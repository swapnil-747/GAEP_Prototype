$projectDir = Get-Location
$tempDir = Join-Path $env:TEMP "GAEP-Package"
$zipFile = Join-Path $projectDir "GAEP_Delivery.zip"

# Clean up
if (Test-Path $zipFile) { Remove-Item $zipFile }
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }

# Create temp structure
New-Item -Path $tempDir -ItemType Directory

# Copy everything, but EXCLUDE junk folders
$exclude = @("node_modules", ".next", ".git", "workspaces", "GAEP_Delivery.zip", "package_project.ps1")

Write-Host "Packaging project..."

Get-ChildItem -Path $projectDir -Recurse | Where-Object {
    $item = $_
    $isExcluded = $false
    foreach ($ex in $exclude) {
        if ($item.FullName -like "*\$ex*") { $isExcluded = $true }
    }
    -not $isExcluded
} | ForEach-Object {
    $dest = $_.FullName.Replace($projectDir.Path, $tempDir)
    if ($_.PSIsContainer) {
        if (!(Test-Path $dest)) { New-Item -Path $dest -ItemType Directory }
    } else {
        Copy-Item -Path $_.FullName -Destination $dest
    }
}

# Create Zip
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

# Cleanup
Remove-Item -Recurse -Force $tempDir
Write-Host "Success! Your project is packaged in GAEP_Delivery.zip"