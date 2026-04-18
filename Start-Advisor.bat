@echo off
set "ROOT_DIR=C:\Users\harsh\AI ETHICS ADVISOR"

echo =========================================
echo   Starting Enterprise AI Advisor...
echo =========================================

:: 1. Start Ollama in the background
echo [1/3] Waking up Ollama...
start /min "Ollama" cmd /c "ollama serve"

:: Wait for Ollama to initialize
timeout /t 3 /nobreak >nul

:: 2. Start Node.js Backend (SQLite)
echo [2/3] Starting Backend (SQLite)...
start "Ethics Backend" cmd /k "cd /d %ROOT_DIR%\ethics-backend && node server.js"

:: 3. Start React Frontend
echo [3/3] Starting React UI...
start "Ethics UI" cmd /k "cd /d %ROOT_DIR%\ethics-ui && npm run dev"

:: 4. Open the browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo -----------------------------------------
echo   All systems active! Enjoy your AI.
echo -----------------------------------------
exit