$ErrorActionPreference = "SilentlyContinue"

# Stop existing PL.API process
Get-Process -Name "PL.API" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start new PL.API process
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "https://localhost:7129;http://localhost:5082"

$proc = Start-Process -FilePath "E:\ITI\APIs\HR\PL.API\bin\Release\net8.0\PL.API.exe" -WorkingDirectory "E:\ITI\APIs\HR\PL.API" -PassThru -WindowStyle Hidden
Write-Host "Started PL.API with Process ID: $($proc.Id)"

Start-Sleep -Seconds 3

# Check port 7129
$conn = Get-NetTCPConnection -LocalPort 7129 -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "API successfully listening on port 7129"
} else {
    Write-Host "Warning: Port 7129 not yet active"
}
