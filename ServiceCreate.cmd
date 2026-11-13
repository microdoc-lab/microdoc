cd /d "%~dp0"
sc create MicroDoc binPath= "%CD%\microdoc.exe\MicroDoc.exe" start= auto
pause