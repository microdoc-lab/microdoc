@echo off
setlocal

CD /d "%~dp0"
CD ..

echo Removing publish folder...
if exist "microdoc.exe" rmdir /s /q "microdoc.exe"

echo Building application...
dotnet publish "MicroDoc\MicroDoc.csproj" -c Release -o "microdoc.exe" ^
    || (echo ERROR: Publish failed. & pause & exit /b 1)

endlocal