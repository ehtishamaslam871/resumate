from fastapi import FastAPI
from app.routes import router as routes

app = FastAPI(title="ResuMate AI Service")
app.include_router(routes)
