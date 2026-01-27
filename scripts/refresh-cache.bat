@echo off
REM Daily cache refresh script for development
REM Usage: Run this once daily when starting development

echo.
echo ======================================
echo  Clockwise Capital - Cache Refresh
echo ======================================
echo.

REM Check if ADMIN_API_KEY environment variable is set
if "%ADMIN_API_KEY%"=="" (
    echo ERROR: ADMIN_API_KEY environment variable not set
    echo Please set it in your .env.local file and restart your terminal
    echo.
    pause
    exit /b 1
)

echo Refreshing all caches...
echo (This will take 5-7 minutes)
echo.

curl -X POST http://localhost:3000/api/admin/refresh-cache ^
  -H "Content-Type: application/json" ^
  -d "{\"cacheType\": \"all\", \"adminKey\": \"%ADMIN_API_KEY%\"}"

echo.
echo.
echo ======================================
echo Cache refresh triggered!
echo Check your dev server terminal for progress
echo ======================================
echo.
pause
