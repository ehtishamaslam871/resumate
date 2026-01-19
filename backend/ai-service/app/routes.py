from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ParseReq(BaseModel):
    file_url: str

class ParseResp(BaseModel):
    text: str
    skills: List[str]
    score: float
    details: Optional[dict] = {}

@router.post("/parse_resume", response_model=ParseResp)
def parse_resume(req: ParseReq):
    # placeholder implementation - replace with real NLP pipeline
    text = f"Mock parsed text for {req.file_url}"
    skills = ["Python", "React", "Node.js"]
    score = 72.5
    details = {"note": "Replace with real parser"}
    return {"text": text, "skills": skills, "score": score, "details": details}

class EvaluateReq(BaseModel):
    question: str
    answer: str

@router.post("/evaluate_answer")
def evaluate(req: EvaluateReq):
    # placeholder evaluation
    score = 7.2
    feedback = "Clear but add more metrics and examples."
    return {"score": score, "feedback": feedback, "confidence": 0.82}

class MatchReq(BaseModel):
    resume_text: str
    job_description: str

@router.post("/match_job")
def match_job(req: MatchReq):
    similarity = 0.65
    details = {"matched_skills": ["Python", "Machine Learning"], "similarity": similarity}
    return {"match_score": similarity * 100, "details": details}
