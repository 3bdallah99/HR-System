$ErrorActionPreference = "Stop"

$sourceDir = "e:\ITI\APIs\HR\publish"
$ftpBase = "ftp://site95935.siteasp.net/wwwroot"
$cred = "site95935:4Fi+E#9mnZ_8"

$files = Get-ChildItem -Path $sourceDir -Recurse -File
$total = $files.Count
Write-Host "Found $total files to upload."

$i = 0
foreach ($file in $files) {
    $i++
    $rel = $file.FullName.Substring($sourceDir.Length).Replace('\', '/').TrimStart('/')
    $targetUrl = "$ftpBase/$rel"
    Write-Host "[$i/$total] Uploading $rel..."
    & curl.exe -s --user $cred --ftp-create-dirs -T "$($file.FullName)" "$targetUrl"
}

Write-Host "All files uploaded successfully!"
