@echo off
echo ========================================
echo Committing and Pushing Scronth to Git
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
git commit -m "Update to scronth.com domain - Configure API to use scronth.com, improve server for public posts, add Happy New Year message, network access, logging, and health check endpoint"

echo.
echo Checking for remote repository...
git remote -v

REM Check if remote exists, if not add it
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo Adding remote repository...
    git remote add origin https://github.com/silaslukep/Scronth.git
    echo Remote added: https://github.com/silaslukep/Scronth.git
)

echo.
echo Pushing to GitHub (scronth.com)...
echo NOTE: You may be prompted for GitHub credentials
git push -u origin main

if errorlevel 1 (
    echo.
    echo Push failed. This might be because:
    echo - Git authentication is required
    echo - Remote branch doesn't exist yet
    echo - Need to set upstream branch
    echo.
    echo Try: git push -u origin main --force
)

echo.
echo ========================================
echo Done! Changes committed and pushed.
echo Repository: https://github.com/silaslukep/Scronth.git
echo ========================================
echo.
pause

