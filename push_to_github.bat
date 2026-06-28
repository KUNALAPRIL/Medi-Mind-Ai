@echo off
echo ===================================================
echo   MediMind AI - Automatic GitHub Deployment Script
echo ===================================================
echo.

:: 1. Clean up raw architecture markdown designs
echo [1/3] Removing raw AI design files...
if exist system_architecture_design.md (
    del /f /q system_architecture_design.md
    echo  - Removed system_architecture_design.md
)
if exist docs (
    rmdir /s /q docs
    echo  - Removed docs/ directory
)

:: 2. Initialize Git
echo.
echo [2/3] Checking Git status...
if not exist .git (
    echo Initializing Git repository...
    git init
)

:: 3. Ask user for GitHub repository URL
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
    echo Error: GitHub Repository URL cannot be empty!
    pause
    exit /b
)

:: 4. Add, commit, and push
echo.
echo [3/3] Staging and pushing code to GitHub...
git add .
git commit -m "Refactor clinical telemetry dashboards, migrate completions framework, and polish responsive layouts"
git branch -M main

:: Check if remote origin already exists
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo Pushing files to main branch...
git push -u origin main

echo.
echo ===================================================
echo   Done! Your project has been successfully uploaded!
echo ===================================================
pause
