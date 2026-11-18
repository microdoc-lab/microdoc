CD /d "%~dp0"
CD ..

sc create MicroDoc binPath= "%CD%\microdoc.exe\MicroDoc.exe" start= auto
pause