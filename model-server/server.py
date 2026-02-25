"""
ResuMate AI Model Server

All AI tasks powered by Ollama LLM (runs on Google Colab for performance):
  - Resume Parsing (LLM-based extraction)
  - Resume Scoring
  - Interview Question Generation
  - Interview Answer Evaluation
  - Resume-Job Matching
  - AI Chat (Career Advisor)
  - Model Evaluation & Comparison (Academic)

Fallback: regex-based resume parsing when Ollama is unavailable
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import json
import re
import logging
import time
import os

# Load .env file if present (for OLLAMA_URL, PRIMARY_MODEL, etc.)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, using system env vars

# Fallback rule-based resume parser (used only when Ollama is unavailable)
from resume_parser import parse_resume as regex_parse_resume

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model-server")

app = FastAPI(title="ResuMate Model Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama URL — set to your Google Colab ngrok URL for remote inference
# Example: http://localhost:11434 (local) or https://xxxx-xxxx.ngrok-free.app (Colab)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "llama3.2:3b")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "llama3.2:1b")
# Resume parsing mode:
#   - ollama: parse via Ollama LLM (default — runs on Colab for speed)
#   - regex: fallback fast deterministic parsing
RESUME_PARSER_MODE = os.getenv("RESUME_PARSER_MODE", "ollama").strip().lower()
MAX_RETRIES = 2
REQUEST_TIMEOUT = 300.0  # seconds — needs to be generous for 8GB RAM systems

class PromptRequest(BaseModel):
    prompt: str
    temperature: Optional[float] = None  # Will be set based on task
    max_tokens: Optional[int] = 2048
    task_type: Optional[str] = "general"  # "json", "text", "general"

class HealthResponse(BaseModel):
    status: str
    parser: str
    ollama: dict
    active_model: Optional[str] = None

# ── Task-specific request models ──
class ParseResumeRequest(BaseModel):
    resumeText: str

class ScoreResumeRequest(BaseModel):
    resumeText: str
    jobTitle: Optional[str] = None
    jobSkills: Optional[List[str]] = None

class GenerateInterviewRequest(BaseModel):
    jobRole: str
    skills: Optional[List[str]] = ["general"]
    difficulty: Optional[str] = "mixed"
    count: Optional[int] = 5

class EvaluateAnswerRequest(BaseModel):
    question: str
    userAnswer: str
    expectedKeywords: Optional[List[str]] = []

class InterviewFeedbackRequest(BaseModel):
    allAnswers: list
    scores: list

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    resumeData: Optional[dict] = None

class MatchResumeRequest(BaseModel):
    resumeText: str
    jobTitle: str
    jobDescription: Optional[str] = None
    requiredSkills: Optional[List[str]] = []

class EvaluateAccuracyRequest(BaseModel):
    predicted: dict
    expected: dict

class CompareModelsRequest(BaseModel):
    resumeText: str


def extract_json_from_response(text: str) -> Optional[str]:
    """Try to extract valid JSON from model response, even if surrounded by text."""
    # Try parsing the whole response first
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    # Try to find JSON block in markdown code fences
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
        r'(\{[\s\S]*\})',
        r'(\[[\s\S]*\])',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            candidate = match.group(1).strip()
            try:
                json.loads(candidate)
                return candidate
            except json.JSONDecodeError:
                # Try to repair common issues
                repaired = repair_json(candidate)
                if repaired:
                    return repaired
    return None


def repair_json(text: str) -> Optional[str]:
    """Attempt to fix common JSON issues from small models."""
    try:
        # Remove trailing commas before } or ]
        text = re.sub(r',\s*([}\]])', r'\1', text)
        # Remove comments
        text = re.sub(r'//.*?$', '', text, flags=re.MULTILINE)
        # Fix single quotes to double quotes
        text = text.replace("'", '"')
        # Try parsing
        json.loads(text)
        return text
    except json.JSONDecodeError:
        return None


def get_temperature_for_task(task_type: str, user_temp: Optional[float]) -> float:
    """Use lower temperature for structured tasks."""
    if user_temp is not None:
        return user_temp
    temps = {
        "json": 0.1,       # Very deterministic for JSON output
        "scoring": 0.2,    # Consistent scoring
        "parsing": 0.1,    # Consistent parsing
        "text": 0.7,       # Creative for cover letters
        "general": 0.5,
    }
    return temps.get(task_type, 0.5)


async def get_available_model() -> str:
    """Check which model is available, pull if needed."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            models = [m["name"] for m in resp.json().get("models", [])]

            if PRIMARY_MODEL in models or f"{PRIMARY_MODEL}:latest" in models:
                return PRIMARY_MODEL
            # Check without tag suffix
            for m in models:
                if m.startswith(PRIMARY_MODEL.split(":")[0]):
                    return m

            if FALLBACK_MODEL in models:
                logger.warning(f"{PRIMARY_MODEL} not found, using {FALLBACK_MODEL}")
                return FALLBACK_MODEL
            for m in models:
                if m.startswith(FALLBACK_MODEL.split(":")[0]):
                    return m

            # No suitable model found
            if models:
                logger.warning(f"Using first available model: {models[0]}")
                return models[0]

            raise Exception("No models installed in Ollama")
        except httpx.ConnectError:
            raise Exception("Cannot connect to Ollama. Is it running?")


async def call_ollama(prompt: str, temperature: float, max_tokens: int, model: str) -> str:
    """Make a single call to Ollama."""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": min(max_tokens, 1024),
                    "num_ctx": 2048,      # Smaller context = faster on low RAM
                    "num_thread": 4,       # Use 4 CPU threads
                }
            }
        )
        response.raise_for_status()
        return response.json().get("response", "")


@app.post("/generate")
async def generate(req: PromptRequest):
    try:
        model = await get_available_model()
        temperature = get_temperature_for_task(req.task_type, req.temperature)

        logger.info(f"Task: {req.task_type} | Model: {model} | Temp: {temperature}")

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                start_time = time.time()
                raw_response = await call_ollama(
                    req.prompt, temperature, req.max_tokens, model
                )
                elapsed = round(time.time() - start_time, 2)
                logger.info(f"Attempt {attempt} succeeded in {elapsed}s")

                # If task expects JSON, validate it
                if req.task_type in ("json", "scoring", "parsing"):
                    extracted = extract_json_from_response(raw_response)
                    if extracted:
                        return {
                            "response": extracted,
                            "model": model,
                            "attempts": attempt,
                            "time": elapsed,
                        }
                    else:
                        logger.warning(
                            f"Attempt {attempt}: Invalid JSON response, retrying..."
                        )
                        # Add explicit instruction on retry
                        if attempt < MAX_RETRIES:
                            req.prompt = (
                                req.prompt
                                + "\n\nIMPORTANT: You MUST respond with valid JSON only. "
                                "No explanations, no markdown, just the JSON object."
                            )
                            temperature = max(0.0, temperature - 0.05)
                            continue
                        else:
                            # Last attempt — return raw response anyway
                            return {
                                "response": raw_response,
                                "model": model,
                                "attempts": attempt,
                                "time": elapsed,
                                "warning": "Could not extract valid JSON",
                            }
                else:
                    return {
                        "response": raw_response,
                        "model": model,
                        "attempts": attempt,
                        "time": elapsed,
                    }

            except httpx.ReadTimeout:
                last_error = "Model timed out — your system may be low on RAM"
                logger.warning(f"Attempt {attempt}: Timeout")
            except httpx.ConnectError:
                last_error = "Cannot connect to Ollama"
                logger.error(f"Attempt {attempt}: Connection failed")
                break  # No point retrying if Ollama is down

        raise HTTPException(status_code=504, detail=last_error or "All retries failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


## ── Helper: run a prompt through the model and get parsed JSON ──
async def run_json_task(prompt: str, task_name: str, max_tokens: int = 2048) -> dict:
    """Run a prompt expecting JSON output, with retries."""
    model = await get_available_model()
    temperature = get_temperature_for_task("json", None)
    logger.info(f"Task: {task_name} | Model: {model} | Temp: {temperature}")

    last_error = None
    current_prompt = prompt
    current_temp = temperature
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            start_time = time.time()
            raw_response = await call_ollama(current_prompt, current_temp, max_tokens, model)
            elapsed = round(time.time() - start_time, 2)
            logger.info(f"{task_name} attempt {attempt} succeeded in {elapsed}s")

            extracted = extract_json_from_response(raw_response)
            if extracted:
                parsed = json.loads(extracted)
                return {"data": parsed, "model": model, "inference_time": elapsed}
            else:
                logger.warning(f"{task_name} attempt {attempt}: Invalid JSON, retrying...")
                if attempt < MAX_RETRIES:
                    current_prompt = (
                        prompt
                        + "\n\nIMPORTANT: You MUST respond with valid JSON only. "
                        "No explanations, no markdown, just the JSON object."
                    )
                    current_temp = max(0.0, current_temp - 0.05)
                else:
                    # Last attempt — return raw response wrapped
                    return {
                        "data": raw_response,
                        "model": model,
                        "inference_time": elapsed,
                        "warning": "Could not extract valid JSON",
                    }
        except httpx.ReadTimeout:
            last_error = "Model timed out"
            logger.warning(f"{task_name} attempt {attempt}: Timeout")
        except httpx.ConnectError:
            last_error = "Cannot connect to Ollama"
            logger.error(f"{task_name} attempt {attempt}: Connection failed")
            break

    raise HTTPException(status_code=504, detail=last_error or "All retries failed")


async def run_text_task(prompt: str, task_name: str, max_tokens: int = 2048) -> dict:
    """Run a prompt expecting free-text output."""
    model = await get_available_model()
    temperature = get_temperature_for_task("text", None)
    start_time = time.time()
    raw_response = await call_ollama(prompt, temperature, max_tokens, model)
    elapsed = round(time.time() - start_time, 2)
    logger.info(f"{task_name} completed in {elapsed}s")
    return {"response": raw_response, "model": model, "inference_time": elapsed}


# ══════════════════════════════════════════════════════
#  TASK-SPECIFIC ENDPOINTS
# ══════════════════════════════════════════════════════

@app.post("/parse-resume")
async def parse_resume(req: ParseResumeRequest):
    """Parse resume either with regex (fast) or via Ollama (LLM), based on RESUME_PARSER_MODE."""
    try:
        start_time = time.time()

        if RESUME_PARSER_MODE in ("ollama", "llm"):
            # LLMs are slower and more token-limited; keep input shorter.
            text = req.resumeText[:6000]
            prompt = f"""You are an expert resume parser.

Extract structured data from the resume text.

Return ONLY a valid JSON object with EXACTLY these keys:
{{
  \"fullName\": \"\",
  \"email\": \"\",
  \"phone\": \"\",
  \"location\": \"\",
  \"summary\": \"\",
  \"skills\": [\"\"],
  \"experience\": [{{\"jobTitle\": \"\", \"company\": \"\", \"duration\": \"\", \"description\": \"\"}}],
  \"education\": [{{\"degree\": \"\", \"school\": \"\", \"field\": \"\", \"year\": \"\"}}],
  \"projects\": [\"\"],
  \"certifications\": [\"\"],
  \"score\": 0,
  \"scoreBreakdown\": {{}},
  \"strengths\": [\"\"],
  \"improvements\": [\"\"]
}}

Rules:
- If unknown, use empty string, empty list, empty object, or 0.
- Do NOT include markdown or explanations.

RESUME TEXT:
{text}
"""

            result = await run_json_task(prompt, "parse-resume-ollama", max_tokens=1536)
            elapsed = result.get("inference_time")
            data = result.get("data", {})
            if not isinstance(data, dict):
                data = {}
            return {
                "data": data,
                "model": result.get("model"),
                "inference_time": elapsed,
            }

        # Default: Rule-based parser (instant, deterministic)
        text = req.resumeText[:15000]  # Regex can handle more text than LLM
        data = regex_parse_resume(text)
        elapsed = round(time.time() - start_time, 3)

        logger.info(
            f"Regex parse completed in {elapsed}s — "
            f"skills={len(data.get('skills', []))}, "
            f"exp={len(data.get('experience', []))}, "
            f"edu={len(data.get('education', []))}, "
            f"score={data.get('score', 0)}"
        )

        return {
            "data": data,
            "model": "regex-nlp",
            "inference_time": elapsed,
        }
    except Exception as e:
        logger.error(f"parse-resume error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score-resume")
async def score_resume(req: ScoreResumeRequest):
    """Score a resume, optionally against a specific job."""
    try:
        text = req.resumeText[:6000]
        job_context = ""
        if req.jobTitle:
            job_context = f"\nTarget Job Title: {req.jobTitle}"
        if req.jobSkills:
            job_context += f"\nRequired Skills: {', '.join(req.jobSkills)}"

        prompt = f"""You are a resume evaluator. Score the following resume.{job_context}

Return ONLY a valid JSON object:
{{
  "overallScore": 75,
  "categoryScores": {{
    "experience": 80,
    "education": 70,
    "skills": 75,
    "formatting": 65,
    "impact": 70
  }},
  "strengths": ["strength1", "strength2"],
  "improvements": ["area to improve 1", "area to improve 2"],
  "summary": "brief evaluation summary"
}}

All scores should be 0-100.

RESUME TEXT:
{text}

Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "score-resume")
        return {
            "data": result.get("data", {}),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"score-resume error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-interview")
async def generate_interview(req: GenerateInterviewRequest):
    """Generate interview questions for a job role."""
    try:
        skills_str = ", ".join(req.skills) if req.skills else "general"
        prompt = f"""You are an interview coach. Generate {req.count} interview questions for a {req.jobRole} position.
Skills to focus on: {skills_str}
Difficulty: {req.difficulty}

Return ONLY a valid JSON object:
{{
  "questions": [
    {{
      "id": 1,
      "question": "the interview question",
      "type": "technical|behavioral|situational",
      "difficulty": "easy|medium|hard",
      "expectedKeywords": ["keyword1", "keyword2"],
      "sampleAnswer": "brief ideal answer outline"
    }}
  ]
}}

Generate exactly {req.count} questions.
Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "generate-interview")
        return {
            "data": result.get("data", {}),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"generate-interview error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate-answer")
async def evaluate_answer(req: EvaluateAnswerRequest):
    """Evaluate a single interview answer."""
    try:
        keywords_str = ", ".join(req.expectedKeywords) if req.expectedKeywords else "none specified"
        prompt = f"""You are an interview evaluator. Evaluate the candidate's answer.

Question: {req.question}
Candidate's Answer: {req.userAnswer}
Expected Keywords: {keywords_str}

Return ONLY a valid JSON object:
{{
  "score": 75,
  "feedback": "detailed feedback on the answer",
  "strengths": ["what was good"],
  "improvements": ["what could be better"],
  "keywordMatches": ["keywords the candidate mentioned"],
  "missedKeywords": ["important keywords that were missed"]
}}

Score should be 0-100.
Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "evaluate-answer")
        return {
            "data": result.get("data", {}),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"evaluate-answer error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/interview-feedback")
async def interview_feedback(req: InterviewFeedbackRequest):
    """Generate overall interview feedback."""
    try:
        answers_summary = json.dumps(req.allAnswers[:10], default=str)[:3000]
        scores_summary = json.dumps(req.scores[:10], default=str)[:500]
        prompt = f"""You are an interview coach. Provide overall feedback for a completed interview.

Answers given: {answers_summary}
Scores received: {scores_summary}

Return ONLY a valid JSON object:
{{
  "overallScore": 75,
  "overallFeedback": "comprehensive feedback paragraph",
  "strengths": ["top strength 1", "top strength 2"],
  "areasToImprove": ["improvement area 1", "improvement area 2"],
  "tips": ["actionable tip 1", "actionable tip 2"],
  "recommendation": "hire|consider|needs improvement"
}}

Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "interview-feedback")
        return {
            "data": result.get("data", {}),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"interview-feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(req: ChatRequest):
    """AI career advisor chat."""
    try:
        context_str = ""
        if req.context:
            context_str = f"\nConversation context: {req.context}"
        if req.resumeData:
            context_str += f"\nUser's resume data: {json.dumps(req.resumeData, default=str)[:1000]}"

        prompt = f"""You are ResuMate's AI career advisor. Help the user with career advice, resume tips, interview preparation, and job search strategies.{context_str}

User's message: {req.message}

Provide a helpful, concise, and actionable response. Be friendly and professional."""

        result = await run_text_task(prompt, "chat")
        return {
            "response": result.get("response", ""),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except Exception as e:
        logger.error(f"chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match-resume")
async def match_resume(req: MatchResumeRequest):
    """Match a resume against a job posting."""
    try:
        text = req.resumeText[:4000]
        skills_str = ", ".join(req.requiredSkills) if req.requiredSkills else "not specified"
        job_desc = (req.jobDescription or "")[:2000]

        prompt = f"""You are a job matching expert. Analyze how well this resume matches the job.

Job Title: {req.jobTitle}
Job Description: {job_desc}
Required Skills: {skills_str}

RESUME TEXT:
{text}

Return ONLY a valid JSON object:
{{
  "matchScore": 75,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "experienceMatch": "strong|moderate|weak",
  "educationMatch": "strong|moderate|weak",
  "overallFit": "excellent|good|fair|poor",
  "summary": "brief matching analysis",
  "suggestions": ["suggestion1", "suggestion2"]
}}

matchScore should be 0-100.
Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "match-resume")
        return {
            "data": result.get("data", {}),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"match-resume error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate")
async def evaluate_accuracy(req: EvaluateAccuracyRequest):
    """Academic: evaluate prediction accuracy."""
    try:
        prompt = f"""Compare these two data sets and calculate accuracy metrics.

Predicted: {json.dumps(req.predicted, default=str)[:2000]}
Expected: {json.dumps(req.expected, default=str)[:2000]}

Return ONLY a valid JSON object:
{{
  "accuracy": 0.85,
  "precision": 0.80,
  "recall": 0.90,
  "f1Score": 0.85,
  "details": "brief explanation of the comparison"
}}

Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "evaluate-accuracy")
        return {
            "success": True,
            "data": result.get("data", {}),
            "model": result.get("model"),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"evaluate error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compare-models")
async def compare_models(req: CompareModelsRequest):
    """Academic: compare model outputs."""
    try:
        text = req.resumeText[:4000]
        prompt = f"""Parse this resume and extract skills, experience, and education.

RESUME TEXT:
{text}

Return ONLY a valid JSON object:
{{
  "skills": ["skill1", "skill2"],
  "experience": [{{"title": "job title", "company": "company"}}],
  "education": [{{"degree": "degree", "institution": "school"}}]
}}

Respond with ONLY the JSON object."""

        result = await run_json_task(prompt, "compare-models")
        return {
            "success": True,
            "model": result.get("model"),
            "data": result.get("data", {}),
            "inference_time": result.get("inference_time"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"compare-models error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════
#  GENERIC & UTILITY ENDPOINTS
# ══════════════════════════════════════════════════════

@app.get("/health")
async def health():
    ollama_status = {"running": False, "note": "Not required for resume parsing"}
    active_model = None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            models = [m["name"] for m in resp.json().get("models", [])]
            ollama_status = {"running": True, "models": models}
            active_model = await get_available_model()
    except Exception:
        pass  # Ollama is optional — parsing still works

    return {
        "status": "healthy",
        "parser": f"{RESUME_PARSER_MODE} (regex always available; ollama requires Ollama)",
        "ollama": ollama_status,
        "active_model": active_model,
        "ram_note": "Parsing: regex is instant; ollama parsing/generation depends on model + hardware.",
    }


@app.get("/")
async def root():
    return {
        "service": "ResuMate Model Server",
        "parser": f"resume parser mode: {RESUME_PARSER_MODE}",
        "generative": f"Ollama via {OLLAMA_URL} (when available)",
        "endpoints": [
            "/generate", "/health", "/parse-resume", "/score-resume",
            "/generate-interview", "/evaluate-answer", "/interview-feedback",
            "/chat", "/match-resume", "/evaluate", "/compare-models"
        ],
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting ResuMate Model Server")
    logger.info(f"Ollama endpoint: {OLLAMA_URL}")
    logger.info(f"Primary model: {PRIMARY_MODEL} | Fallback: {FALLBACK_MODEL}")
    logger.info(f"Resume parsing mode: {RESUME_PARSER_MODE}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
