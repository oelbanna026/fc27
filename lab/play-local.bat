@echo off
chcp 65001 >nul
title FC 27 - Defense Lab (local)
cd /d "%~dp0"
echo.
echo   FC 27 - Defense Lab
echo   -------------------
echo   بيفتح على: http://localhost:8765/
echo   اقفل الشباك ده عشان توقف السيرفر.
echo.
start "" "http://localhost:8765/"
python -m http.server 8765
