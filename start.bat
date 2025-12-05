@echo off
echo ═══════════════════════════════════════════════════════════
echo 🔮 SURE PREDICT - Quick Setup
echo ═══════════════════════════════════════════════════════════
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found: 
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo.
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  No .env file found!
    echo.
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo 🔑 IMPORTANT: Configure your API key
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo 1. Open .env file
    echo 2. Get API key from: https://rapidapi.com/api-sports/api/api-football
    echo 3. Replace YOUR_RAPIDAPI_KEY_HERE with your actual key
    echo 4. Save the file
    echo 5. Run this script again
    echo.
    pause
    exit /b 0
)

echo ═══════════════════════════════════════════════════════════
echo 🚀 Starting Sure Predict Backend Server...
echo ═══════════════════════════════════════════════════════════
echo.
echo Server will start on: http://localhost:3000
echo Open this URL in your browser!
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
