$ErrorActionPreference = "Continue"

$sourceDir = "e:\ITI\APIs\HR\publish"
$ftpBase = "ftp://site95935.siteasp.net/wwwroot"
$cred = "site95935:4Fi+E#9mnZ_8"

Write-Host "Placing app_offline.htm to safely release IIS file locks..."
$tempOffline = "$env:TEMP\app_offline.htm"
"<!DOCTYPE html><html><body>Site under maintenance for update deployment...</body></html>" | Set-Content -Path $tempOffline -Encoding utf8
& curl.exe -s --user $cred -T $tempOffline "$ftpBase/app_offline.htm"
Start-Sleep -Seconds 2

$files = Get-ChildItem -Path $sourceDir -Recurse -File
$total = $files.Count
Write-Host "Found $total files to upload."

$i = 0
$failCount = 0
foreach ($file in $files) {
    $i++
    $rel = $file.FullName.Substring($sourceDir.Length).Replace('\', '/').TrimStart('/')
    $targetUrl = "$ftpBase/$rel"
    Write-Host "[$i/$total] Uploading $rel..."
    $result = & curl.exe -s -w "%{http_code}" --user $cred --ftp-create-dirs -T "$($file.FullName)" "$targetUrl"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to upload $rel (exit code: $LASTEXITCODE)"
        $failCount++
    }
}

Write-Host "Removing app_offline.htm to bring site online..."
& curl.exe -s --user $cred -Q "DELE /wwwroot/app_offline.htm" "$ftpBase/"

if ($failCount -eq 0) {
    Write-Host "All $total files uploaded successfully and site is back online!"
} else {
    Write-Warning "Upload completed with $failCount errors."
}
