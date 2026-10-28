@echo off
setlocal EnableExtensions DisableDelayedExpansion
title LACTOSE - GitHub + jsDelivr Publisher - History Fix

echo.
echo ==========================================
echo  LACTOSE - GitHub + jsDelivr Publisher
echo ==========================================
echo.
echo Destination: https://github.com/samuelwinn/my-game-catalog
echo No GitHub Pages required.
echo.

where git >nul 2>&1
if errorlevel 1 goto gitmissing
if not exist "%~dp0index.html" goto missing
if not exist "%~dp0games-catalog.json" goto missing
if not exist "%~dp0games\2048.html" goto missing

pushd "%~dp0"
if errorlevel 1 goto dirfail

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

echo [1/4] Preparing game files and local commit...
git add -A
if errorlevel 1 goto fail

git diff --cached --quiet
if errorlevel 1 (
    git var GIT_AUTHOR_IDENT >nul 2>&1
    if errorlevel 1 (
        git config user.name "samuelwinn"
        git config user.email "267185116+samuelwinn@users.noreply.github.com"
    )
    git commit -m "Publish game library through GitHub and jsDelivr"
    if errorlevel 1 goto fail
) else (
    echo No uncommitted changes found.
)

echo.
echo [2/4] Fetching existing GitHub history...
git fetch origin main
if errorlevel 1 goto fail

echo.
echo [3/4] Merging existing GitHub history safely...
git merge --allow-unrelated-histories --no-edit origin/main
if errorlevel 1 goto mergefail

echo.
echo [4/4] Pushing project to GitHub...
git push -u origin main
if errorlevel 1 goto fail

echo.
echo ==========================================
echo  SUCCESS - Game files are now on GitHub!
echo ==========================================
echo.
echo jsDelivr catalog:
echo https://cdn.jsdelivr.net/gh/samuelwinn/my-game-catalog@main/games-catalog.json
echo.
popd
pause
exit /b 0

:gitmissing
echo ERROR: Git for Windows was not found.
echo Install it from https://git-scm.com/downloads/win
pause
exit /b 1

:missing
echo ERROR: Put this script in the extracted project folder, next to
echo index.html, games-catalog.json, and the games directory.
pause
exit /b 1

:dirfail
echo ERROR: Could not open the project folder.
pause
exit /b 1

:mergefail
echo.
echo ERROR: Git could not merge the existing history automatically.
echo Do NOT use force push or delete the repository.
echo Copy the errors above and share them for a safe resolution.
popd
pause
exit /b 1

:fail
echo.
echo ERROR: Publishing failed. Copy the detailed error above.
echo Your game files are still in the extracted folder.
popd
pause
exit /b 1
