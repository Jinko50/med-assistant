param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$packageRoot = $PSScriptRoot
$manifest = Get-Content -LiteralPath (Join-Path $packageRoot 'MANIFEST.json') -Raw | ConvertFrom-Json
$sourceRoot = Join-Path $packageRoot 'source/med-assistant'
foreach ($entry in $manifest.files) {
    $relative = [string]$entry.path
    if ($relative -match '(^|[\\/])\.\.([\\/]|$)' -or [System.IO.Path]::IsPathRooted($relative)) { throw 'Invalid manifest path.' }
    $sourcePath = Join-Path $sourceRoot $relative
    if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Source checksum failed: $relative" }
}
$bundle = Join-Path $packageRoot 'med-assistant-history.bundle'
if ((Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.historyBundleSha256) { throw 'Git history checksum failed.' }
$target = [System.IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $target) { throw 'Destination already exists. Choose a new empty destination; this script never overwrites an existing checkout.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Install Git and reopen PowerShell before restoring.' }
& git clone -- $bundle $target
if ($LASTEXITCODE -ne 0) { throw 'Git clone failed. Existing files were not deleted.' }
# History is restored first; the audited working tree is overlaid without changing old commits.
Get-ChildItem -LiteralPath $sourceRoot -Force | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force }
& git -C $target remote remove origin
if ($LASTEXITCODE -ne 0) { throw 'Could not remove the local bundle remote. Review git remote -v manually.' }
Write-Host "Restored to $target. Current development changes remain uncommitted, just as on the source computer."
Write-Host 'Read START_HERE.md and docs/COMPUTER_TRANSFER.md before setup.'
