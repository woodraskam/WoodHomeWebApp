@echo off
REM Kill existing Go processes and processes using port 3000

echo Killing existing Go processes...
taskkill /F /IM go.exe 2>nul
taskkill /F /IM main.exe 2>nul
taskkill /F /IM woodhome-webapp.exe 2>nul
taskkill /F /IM woodhome-webapp-debug.exe 2>nul
taskkill /F /IM dlv.exe 2>nul
taskkill /F /IM _debug_bin*.exe 2>nul

echo Killing processes using port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a 2>nul
    )
)

echo Done!
