$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$zipPath = Join-Path $root 'apache-maven-3.9.16-bin.zip'
$extractPath = Join-Path $root 'apache-maven-3.9.16'

if (-Not (Test-Path $zipPath)) {
    Write-Host "Downloading Maven..."
    Invoke-WebRequest -Uri 'https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip' -OutFile $zipPath
}
if (-Not (Test-Path $extractPath)) {
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $zipPath -DestinationPath $root -Force
}
Write-Host "Maven ready at $extractPath"
