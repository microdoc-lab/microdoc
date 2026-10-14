@echo off
setlocal

cd /d "%~dp0"

echo Removing publish folder...
if exist "microdoc.exe" rmdir /s /q "microdoc.exe"

echo Publishing application...
dotnet publish "MicroDoc\MicroDoc.csproj" -c Release -o "microdoc.exe" ^
    || (echo ERROR: Publish failed. & pause & exit /b 1)

echo Creating ZIP archive...
powershell -NoProfile -Command ^
    "Compress-Archive -Path 'microdoc.exe','ServerStart.cmd','microdoc.doc','test.doc' -DestinationPath 'microdoc.zip' -Force" ^
    || (echo ERROR: ZIP creation failed. & pause & exit /b 1)

echo. & echo Done: microdoc.zip & pause

endlocal