@echo off
setlocal enabledelayedexpansion
echo ====================================================
echo   ResuMate - Starting Local AI Model Server
echo   Resume Parsing: Instant regex engine (no LLM)
echo   Generative tasks: Ollama (optional)
echo ====================================================
echo.

REM -- Check Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

REM -- Check dependencies
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM -- Optionally start Ollama for generative tasks (scoring, interview, chat)
echo [1/2] Checking Ollama (optional, for generative AI tasks)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>nul | find /I "ollama.exe" >nul
if %errorlevel% neq 0 (
    ollama --version >nul 2>&1
    if !errorlevel! equ 0 (
        echo Starting Ollama service...
        start /B ollama serve
        timeout /t 5 /nobreak >nul
    ) else (
        echo [INFO] Ollama not installed. Generative tasks will be unavailable.
        echo         Resume parsing works without it (built-in regex engine).
        echo         Install Ollama from https://ollama.com/download for full AI features.
    )
) else (
    echo Ollama is already running.
)

REM -- Start FastAPI model server
echo.
echo [2/2] Starting FastAPI model server on http://localhost:8000 ...
echo   Resume parsing: Built-in regex engine (instant, always available)
echo   Scoring/Interview/Chat: Ollama (when available)
echo Press Ctrl+C to stop.
echo.
python server.py
