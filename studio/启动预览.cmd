@echo off
cd /d "%~dp0"
echo Open http://127.0.0.1:5186 in your browser. Press Ctrl+C to stop.
node server.mjs
pause
