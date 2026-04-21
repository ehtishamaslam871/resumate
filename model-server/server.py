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
from typing import Optional, List, Dict
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


def normalize_ollama_url(raw_url: str) -> str:
    """Extract a usable URL even if env value contains extra pasted text."""
    candidate = (raw_url or "").strip().strip('"').strip("'")
    if not candidate:
        return "http://localhost:11434"

    # Support pasted values like: NgrokTunnel: "https://..." -> "http://localhost:11434"
    match = re.search(r"https?://[^\s\"']+", candidate)
    if match:
        return match.group(0).rstrip("/")

    return candidate.rstrip("/")


OLLAMA_URL = normalize_ollama_url(os.getenv("OLLAMA_URL", "http://localhost:11434"))
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "qwen2.5:14b")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "qwen2.5:7b")
# Resume parsing mode:

RESUME_PARSER_MODE = os.getenv("RESUME_PARSER_MODE", "ollama").strip().lower()
MAX_RETRIES = 2
REQUEST_TIMEOUT = 300.0  # seconds — needs to be generous for 8GB RAM systems


def get_ollama_headers() -> Dict[str, str]:
    """Build headers for Ollama requests, including ngrok compatibility."""
    headers = {"Accept": "application/json"}
    if "ngrok" in OLLAMA_URL.lower():
        # Avoid ngrok browser warning/interstitial responses for API calls.
        headers["ngrok-skip-browser-warning"] = "1"
    return headers


def format_ollama_http_error(response: httpx.Response) -> str:
    """Create actionable Ollama upstream error messages."""
    if "ngrok" in OLLAMA_URL.lower() and response.status_code == 403:
        return (
            "Ollama tunnel returned 403 Forbidden. The ngrok URL may be expired or blocked. "
            "Re-run Colab Cell 3 to create a fresh tunnel and update model-server/.env with the new OLLAMA_URL."
        )

    body_preview = (response.text or "").strip().replace("\n", " ")[:180]
    if body_preview:
        return f"Ollama request failed with HTTP {response.status_code}: {body_preview}"
    return f"Ollama request failed with HTTP {response.status_code}"

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


def evaluate_answer_heuristic(question: str, answer: str, expected_keywords: Optional[List[str]] = None) -> dict:
    """Local fallback answer evaluation when Ollama is unavailable."""
    normalized = (answer or "").lower()
    words = [w for w in re.split(r"\s+", normalized.strip()) if w]
    word_count = len(words)

    keywords = [str(k).strip() for k in (expected_keywords or []) if str(k).strip()]
    matched = [k for k in keywords if str(k).lower() in normalized]
    missed = [k for k in keywords if k not in matched]

    coverage = (len(matched) / len(keywords)) if keywords else (0.75 if word_count >= 40 else 0.55)
    depth = 0.9 if word_count >= 90 else 0.7 if word_count >= 45 else 0.5 if word_count >= 20 else 0.3
    score = max(35, min(100, round((coverage * 0.65 + depth * 0.35) * 100)))

    strengths = []
    improvements = []

    if matched:
        strengths.append(f"Covered expected topics: {', '.join(matched)}")
    if word_count >= 45:
        strengths.append("Provided reasonable depth and structure.")
    if not strengths:
        strengths.append("Addressed the question directly.")

    if missed:
        improvements.append(f"Include more role-specific details around: {', '.join(missed)}")
    if word_count < 30:
        improvements.append("Add concrete examples and measurable outcomes.")
    if not improvements:
        improvements.append("Quantify impact to make your answer stronger.")

    return {
        "score": score,
        "feedback": (
            f"Fallback evaluation: {round(coverage * 100)}% keyword coverage, "
            f"{word_count} words. Focus on concrete examples and clear outcomes."
        ),
        "strengths": strengths,
        "improvements": improvements,
        "keywordMatches": matched,
        "missedKeywords": missed,
    }


def generate_interview_questions_fallback(
    job_role: str,
    skills: Optional[List[str]] = None,
    difficulty: str = "mixed",
    count: int = 5,
) -> dict:
    """Local fallback interview question generation when Ollama is unavailable."""
    safe_count = max(3, min(int(count or 5), 12))
    role = (job_role or "Software Engineer").strip()[:120]
    skill_list = [str(s).strip() for s in (skills or []) if str(s).strip()]
    if not skill_list:
        skill_list = ["problem solving", "system design", "testing"]

    focus_a = skill_list[0]
    focus_b = skill_list[1] if len(skill_list) > 1 else "system design"
    focus_c = skill_list[2] if len(skill_list) > 2 else "debugging"

    technical_target = min(max(safe_count // 2, 1), 5)
    general_target = max(safe_count - technical_target, 1)
    level = (difficulty or "mixed").lower()
    default_difficulty = "medium" if level == "mixed" else level

    general_bank = [
        {
            "question": f"Tell me about your most relevant experience for a {role} role.",
            "type": "general",
            "difficulty": "easy",
            "expectedKeywords": ["experience", "impact", "role"],
            "sampleAnswer": "Summarize a relevant project, your ownership, and measurable outcomes.",
        },
        {
            "question": "Describe a time you handled conflicting priorities. How did you decide what to do first?",
            "type": "general",
            "difficulty": "medium",
            "expectedKeywords": ["priority", "stakeholders", "trade-offs"],
            "sampleAnswer": "Explain your prioritization framework, communication approach, and result.",
        },
        {
            "question": "How do you approach ambiguous requirements before implementation?",
            "type": "general",
            "difficulty": "medium",
            "expectedKeywords": ["clarification", "assumptions", "scope"],
            "sampleAnswer": "Describe requirement discovery, assumption validation, and iterative delivery.",
        },
        {
            "question": "Describe a project setback and how you recovered from it.",
            "type": "general",
            "difficulty": "medium",
            "expectedKeywords": ["ownership", "learning", "outcome"],
            "sampleAnswer": "Share the issue, root cause, corrective action, and improved process.",
        },
        {
            "question": "What does success look like in your first 90 days in this role?",
            "type": "general",
            "difficulty": "easy",
            "expectedKeywords": ["onboarding", "impact", "collaboration"],
            "sampleAnswer": "Outline ramp-up, quick wins, and measurable contribution milestones.",
        },
    ]

    technical_bank = [
        {
            "question": f"Walk me through a project where you used {focus_a}. What design trade-offs did you make?",
            "type": "technical",
            "difficulty": default_difficulty,
            "expectedKeywords": [focus_a, "trade-off", "architecture", "result"],
            "sampleAnswer": "Explain architecture decisions, constraints, alternatives, and measurable outcomes.",
        },
        {
            "question": f"How would you diagnose a production issue in a {role} system built with {focus_b}?",
            "type": "technical",
            "difficulty": "medium",
            "expectedKeywords": [focus_b, "logs", "hypothesis", "root cause"],
            "sampleAnswer": "Discuss impact triage, observability, reproduction, fix, and postmortem steps.",
        },
        {
            "question": f"What testing strategy would you apply for a feature that relies heavily on {focus_c}?",
            "type": "technical",
            "difficulty": "medium",
            "expectedKeywords": [focus_c, "unit tests", "integration", "edge cases"],
            "sampleAnswer": "Cover unit/integration coverage, mock strategy, and regression prevention.",
        },
        {
            "question": f"How would you optimize performance in a {role} workflow using {focus_a} and {focus_b}?",
            "type": "technical",
            "difficulty": "hard",
            "expectedKeywords": ["profiling", "latency", "throughput", focus_a],
            "sampleAnswer": "Explain profiling first, bottleneck prioritization, and measured optimization results.",
        },
        {
            "question": f"How would you design an API contract for a {role} service and keep it backward-compatible?",
            "type": "technical",
            "difficulty": "medium",
            "expectedKeywords": ["API", "versioning", "compatibility", "validation"],
            "sampleAnswer": "Describe contract design, versioning policy, schema validation, and rollout plan.",
        },
    ]

    selected = []
    for q in general_bank[:general_target]:
        selected.append(q)
    for q in technical_bank[:technical_target]:
        selected.append(q)

    # If caller asks for more than available bank slices, cycle through banks without duplicates by text.
    seen = set(item["question"].strip().lower() for item in selected)
    merged_bank = general_bank + technical_bank
    for q in merged_bank:
        if len(selected) >= safe_count:
            break
        key = q["question"].strip().lower()
        if key in seen:
            continue
        selected.append(q)
        seen.add(key)

    questions = [
        {
            "id": idx + 1,
            "question": item["question"],
            "type": item["type"],
            "difficulty": item["difficulty"],
            "expectedKeywords": item["expectedKeywords"],
            "sampleAnswer": item["sampleAnswer"],
        }
        for idx, item in enumerate(selected[:safe_count])
    ]

    return {"questions": questions}


async def get_available_model() -> str:
    """Check which model is available, pull if needed."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{OLLAMA_URL}/api/tags", headers=get_ollama_headers())
            resp.raise_for_status()
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
        except httpx.HTTPStatusError as exc:
            raise Exception(format_ollama_http_error(exc.response))
        except json.JSONDecodeError:
            raise Exception(
                "Ollama endpoint returned non-JSON data. Verify OLLAMA_URL points to a live Ollama tunnel."
            )
        except httpx.ConnectError:
            raise Exception("Cannot connect to Ollama. Is it running?")


async def call_ollama(prompt: str, temperature: float, max_tokens: int, model: str) -> str:
    """Make a single call to Ollama."""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            headers=get_ollama_headers(),
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
        try:
            return response.json().get("response", "")
        except json.JSONDecodeError as exc:
            raise Exception("Ollama returned non-JSON output from /api/generate") from exc


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
            except httpx.HTTPStatusError as exc:
                last_error = format_ollama_http_error(exc.response)
                logger.error(f"Attempt {attempt}: Upstream HTTP error: {last_error}")
                break

        raise HTTPException(status_code=504, detail=last_error or "All retries failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


## ── Helper: run a prompt through the model and get parsed JSON ──
async def run_json_task(prompt: str, task_name: str, max_tokens: int = 2048) -> dict:
    """Run a prompt expecting JSON output, with retries."""
    try:
        model = await get_available_model()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

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
        except httpx.HTTPStatusError as exc:
            last_error = format_ollama_http_error(exc.response)
            logger.error(f"{task_name} attempt {attempt}: Upstream HTTP error: {last_error}")
            break

    raise HTTPException(status_code=504, detail=last_error or "All retries failed")


async def run_text_task(prompt: str, task_name: str, max_tokens: int = 2048) -> dict:
    """Run a prompt expecting free-text output."""
    try:
        model = await get_available_model()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

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
        parser_warning = None

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
- "skills" must contain ONLY 5 to 6 technical skills.
- Exclude project names, company names, job titles, degree names, and section headers from "skills".
- Each skill should be short (1 to 4 words).

RESUME TEXT:
{text}
"""

            try:
                result = await run_json_task(prompt, "parse-resume-ollama", max_tokens=1536)
                elapsed = result.get("inference_time")
                data = result.get("data", {})
                if not isinstance(data, dict):
                    data = {}

                # --- POST-PROCESSING: Ensure sections are not mixed and cap skills ---
                def build_blocked_terms(parsed):
                    blocked = set()

                    for project in parsed.get("projects") or []:
                        p = str(project).strip().lower()
                        if p:
                            blocked.add(p)

                    for exp in parsed.get("experience") or []:
                        if isinstance(exp, dict):
                            title = str(exp.get("jobTitle", "")).strip().lower()
                            company = str(exp.get("company", "")).strip().lower()
                            if title:
                                blocked.add(title)
                            if company:
                                blocked.add(company)

                    for edu in parsed.get("education") or []:
                        if isinstance(edu, dict):
                            degree = str(edu.get("degree", "")).strip().lower()
                            school = str(edu.get("school", "")).strip().lower()
                            field = str(edu.get("field", "")).strip().lower()
                            if degree:
                                blocked.add(degree)
                            if school:
                                blocked.add(school)
                            if field:
                                blocked.add(field)

                    return blocked

                def split_skill_candidates(raw_skill):
                    text_skill = str(raw_skill or "").strip()
                    if not text_skill:
                        return []

                    text_skill = re.sub(r"^[\-\*\s]+", "", text_skill)
                    parts = [p.strip() for p in re.split(r"[,\n|;/]+", text_skill) if p.strip()]

                    expanded = []
                    for part in parts:
                        if " and " in part and len(part.split()) <= 6:
                            expanded.extend([x.strip() for x in part.split(" and ") if x.strip()])
                        else:
                            expanded.append(part)
                    return expanded

                def normalize_skill(skill):
                    cleaned = re.sub(r"^[\s\-.,:;]+|[\s\-.,:;]+$", "", str(skill))
                    cleaned = re.sub(r"\s+", " ", cleaned).strip()
                    return cleaned

                def is_noise_skill(skill, blocked_terms):
                    s = str(skill or "").strip().lower()
                    if not s:
                        return True
                    if len(s) < 2 or len(s) > 35:
                        return True
                    if s in blocked_terms:
                        return True
                    if re.search(r"https?://|www\\.|@", s):
                        return True
                    if re.search(r"\b(19|20)\d{2}\b", s):
                        return True
                    if any(k in s for k in (
                        "project", "experience", "intern", "objective", "summary",
                        "education", "university", "college", "responsible",
                        "developed", "designed", "implemented", "achievement",
                        "certification", "award"
                    )):
                        return True
                    token_count = len(re.findall(r"[a-z0-9+#./-]+", s))
                    if token_count == 0 or token_count > 4:
                        return True
                    return False

                def sanitize_skills(skills, fallback_skills, parsed):
                    blocked_terms = build_blocked_terms(parsed)
                    chosen = []
                    seen = set()

                    def add_candidates(raw):
                        for candidate in split_skill_candidates(raw):
                            normalized = normalize_skill(candidate)
                            lowered = normalized.lower()
                            if not normalized or lowered in seen:
                                continue
                            if is_noise_skill(normalized, blocked_terms):
                                continue
                            seen.add(lowered)
                            chosen.append(normalized)
                            if len(chosen) >= 6:
                                return True
                        return False

                    for skill in skills or []:
                        if add_candidates(skill):
                            break

                    if len(chosen) < 5:
                        for skill in fallback_skills or []:
                            if add_candidates(skill):
                                break

                    return chosen[:6]

                def filter_experience(experience, skills):
                    # Remove any experience entry that is just a skill
                    skill_set = set(str(s).strip().lower() for s in (skills or []))
                    filtered = []
                    for exp in experience or []:
                        if isinstance(exp, dict):
                            title = str(exp.get("jobTitle", "")).strip().lower()
                            if title and title not in skill_set:
                                filtered.append(exp)
                    return filtered

                fallback_skills = []
                try:
                    fallback_data = regex_parse_resume(text)
                    if isinstance(fallback_data, dict):
                        fallback_skills = fallback_data.get("skills", [])
                except Exception:
                    fallback_skills = []

                data["skills"] = sanitize_skills(data.get("skills", []), fallback_skills, data)

                if "experience" in data:
                    data["experience"] = filter_experience(data.get("experience", []), data["skills"])

                return {
                    "data": data,
                    "model": result.get("model"),
                    "inference_time": elapsed,
                }
            except HTTPException as exc:
                parser_warning = str(exc.detail)
                logger.warning("parse-resume fallback activated: %s", parser_warning)
            except Exception as exc:
                parser_warning = str(exc)
                logger.warning("parse-resume fallback activated: %s", parser_warning)

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

        response = {
            "data": data,
            "model": "regex-nlp",
            "inference_time": elapsed,
        }
        if parser_warning:
            response["warning"] = parser_warning

        return response
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

Important constraints:
- This is for PRACTICE preparation, so make questions realistic and job-focused.
- Questions MUST be tailored to the role, tech stack, and difficulty above.
- Avoid generic questions unless explicitly adapted to the role context.
- Prefer scenario-based and technical depth checks over generic textbook prompts.
- Keep each question concise and interview-ready.

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
    except HTTPException as exc:
        if exc.status_code in (503, 504):
            logger.warning("generate-interview fallback activated: %s", exc.detail)
            start_time = time.time()
            fallback_data = generate_interview_questions_fallback(
                job_role=req.jobRole,
                skills=req.skills,
                difficulty=req.difficulty or "mixed",
                count=req.count or 5,
            )
            elapsed = round(time.time() - start_time, 4)
            return {
                "data": fallback_data,
                "model": "fallback-heuristic",
                "inference_time": elapsed,
                "warning": str(exc.detail),
            }
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
    except HTTPException as exc:
        # Keep interview flow alive when Ollama tunnel is down/blocked.
        if exc.status_code in (503, 504):
            logger.warning("evaluate-answer fallback activated: %s", exc.detail)
            start_time = time.time()
            fallback = evaluate_answer_heuristic(req.question, req.userAnswer, req.expectedKeywords)
            elapsed = round(time.time() - start_time, 4)
            return {
                "data": fallback,
                "model": "fallback-heuristic",
                "inference_time": elapsed,
                "warning": str(exc.detail),
            }
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
            resp = await client.get(f"{OLLAMA_URL}/api/tags", headers=get_ollama_headers())
            resp.raise_for_status()
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
