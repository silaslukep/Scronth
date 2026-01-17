@echo off
echo ========================================
echo Committing and Pushing to GitHub
echo ========================================
echo.

REM Check if .git exists, if not initialize
if not exist .git (
    echo Initializing git repository...
    git init
    echo.
    echo Setting branch to main...
    git branch -M main
    echo.
)

echo Adding all files...
git add .

echo.
echo Committing changes...
git commit -m "Improve server for public posts and add Happy New Year message - Add network access, logging, health check endpoint, and Happy New Year subtitle"

echo.
echo Checking for remote repository...
git remote -v

REM Check if remote exists, if not add it
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo Adding remote repository...
    git remote add origin https://github.com/silaslukep/Scronth.git
)

echo.
echo Pushing to GitHub...
echo NOTE: You may be prompted for GitHub credentials
git push -u origin main

echo.
echo ========================================
echo Done! Changes committed and pushed.
echo ========================================
echo.
pause


