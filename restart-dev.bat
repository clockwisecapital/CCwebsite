@echo off
echo Restarting development server...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
npm run dev
