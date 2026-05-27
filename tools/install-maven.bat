@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (-Not (Test-Path 'apache-maven-3.9.16-bin.zip')) { Invoke-WebRequest -Uri 'https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip' -OutFile 'apache-maven-3.9.16-bin.zip' }; if (-Not (Test-Path 'apache-maven-3.9.16')) { Expand-Archive -Path 'apache-maven-3.9.16-bin.zip' -DestinationPath '.' }; Write-Host 'DOWNLOAD_OK'"
