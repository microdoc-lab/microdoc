@echo off
setlocal

CD /d "%~dp0"
CD ..
CD microdoc.exe

SET ASPNETCORE_URLS=https://localhost:7273

START "" cmd /c "timeout /t 2 /nobreak >NUL & START """" ""%ASPNETCORE_URLS%"""

MicroDoc.exe
pause
endlocal