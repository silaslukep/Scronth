@echo off
echo Committing server improvements to git...
echo.

REM Check if .git exists
if not exist .git (
    echo Initializing git repository...
    git init
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

echo.
echo Done! Changes committed.
echo.
echo If you have a remote repository, you can push with:
echo   git push
echo.
pause

