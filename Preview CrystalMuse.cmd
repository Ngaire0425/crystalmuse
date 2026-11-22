@echo off
cd /d "%~dp0"
start "CrystalMuse preview" cmd /c "node preview-server.js . 8899"
timeout /t 2 >nul
start "" http://127.0.0.1:8899/
