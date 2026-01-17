@echo off
echo Setting up Git repository and pushing to GitHub...
echo.
echo NOTE: You must have Git installed first!
echo Download from: https://git-scm.com/download/win
echo.
pause

echo.
echo Step 1: Initializing git repository...
git init

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Making initial commit...
git commit -m "Add server backend for public posts - Scronth social media platform"

echo.
echo Step 4: Adding remote repository...
git remote add origin https://github.com/silaslukep/Scronth.git

echo.
echo Step 5: Setting branch to main...
git branch -M main

echo.
echo Step 6: Pushing to GitHub...
echo NOTE: You may be prompted for GitHub credentials
git push -u origin main

echo.
echo Done! Your code has been pushed to GitHub.
pause

