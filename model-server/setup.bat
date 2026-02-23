@echo off
echo ====================================================
echo   ResuMate - Local AI Model Server Setup
echo ====================================================
echo.

REM -- Check Python
echo [1/3] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Download from https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version

REM -- Install Python dependencies
echo.
echo [2/3] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies.
    pause
    exit /b 1
)
echo Done.

REM -- Check Ollama (optional, for generative AI tasks)
echo.
echo [3/3] Checking Ollama (optional)...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Ollama is not installed.
    echo         Resume parsing works without it (built-in regex engine).
    echo         For generative AI features (scoring, interview, chat), install from:
    echo         https://ollama.com/download
) else (
    ollama --version
    echo Ollama detected. Generative AI features will be available.
)

echo.
echo ====================================================
echo   Setup Complete!
echo   Run start.bat to launch the model server.
echo ====================================================
pause
