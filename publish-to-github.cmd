@echo off
setlocal EnableExtensions DisableDelayedExpansion
title LACTOSE - GitHub + jsDelivr Publisher (Fixed)

echo.
echo ========================================
echo   LACTOSE - GitHub + jsDelivr Publisher
 echo ========================================
echo.
echo Publishes files to:
echo   https://github.com/samuelwinn/my-game-catalog
echo Uses GitHub + jsDelivr; GitHub Pages is not needed.
echo.

where git >nul 2>&1
if errorlevel 1 goto gitmissing
if not exist "%~dp0index.html" goto missing
if not exist "%~dp0games-catalog.json" goto missing
if not exist "%~dp0games\2048.html" goto missing

pushd "%~dp0"
if errorlevel 1 goto dirfail

echo [1/3] Preparing the extracted game folder...
if not exist ".git\" (
    git init
    if errorlevel 1 goto fail
)
git branch -M main
if errorlevel 1 goto fail
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/samuelwinn/my-game-catalog.git
) else (
    git remote set-url origin https://github.com/samuelwinn/my-game-catalog.git
)
if errorlevel 1 goto fail

echo.
echo [2/3] Adding all 868 games and creating a commit...
git add -A
if errorlevel 1 goto fail

git diff --cached --quiet
if errorlevel 1 (
    git var GIT_AUTHOR_IDENT >nul 2>&1
    if errorlevel 1 (
        git config user.name "samuelwinn"
        git config user.email "267185116+samuelwinn@users.noreply.github.com"
    )
    git commit -m "Publish LACTOSE game library through jsDelivr"
    if errorlevel 1 goto fail
) else (
    echo No new files to commit. Checking if a push is still needed...
)

echo.
echo [3/3] Pushing the entire project to GitHub...
git push -u origin main
if errorlevel 1 goto fail

echo.
echo ========================================
echo   SUCCESS - Files are now on GitHub!
echo ========================================
echo.
echo Catalog CDN:
echo https://cdn.jsdelivr.net/gh/samuelwinn/my-game-catalog@main/games-catalog.json
echo.
echo You do NOT need GitHub Pages.
popd
pause
exit /b 0

:gitmissing
echo ERROR: Git for Windows was not found.
echo Install it from https://git-scm.com/downloads/win
pause
exit /b 1

:missing
echo ERROR: This script must be placed beside index.html,
echo games-catalog.json and the games folder in the extracted ZIP.
pause
exit /b 1

:dirfail
echo ERROR: Could not open the extracted project folder.
pause
exit /b 1

:fail
echo.
echo ERROR: Git publishing failed. The detailed error is shown above.
echo No files were deleted; the project remains in:
echo   %~dp0
popd
pause
exit /b 1
