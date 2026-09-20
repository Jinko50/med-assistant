param([string]$OutputDirectory = '', [switch]$Connected, [string]$Version = '')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $repoRoot ('dist/windows-' + [guid]::NewGuid().ToString('N')) }
$OutputDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
if (Test-Path -LiteralPath $OutputDirectory) { throw 'Choose a new output directory; existing files are never replaced.' }
# Windows PowerShell 5.1 has no utf8NoBOM encoding and its UTF8 writer emits a BOM.
# app-config.json and MANIFEST.json are parsed by Node, which rejects a leading BOM.
function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding $false))
}
$standalone = Join-Path $repoRoot 'apps/web/.next/standalone'
if (-not (Test-Path -LiteralPath (Join-Path $standalone 'apps/web/server.js'))) { throw 'Run npm run build first.' }
# Double quotes inside a single-quoted argument are stripped by Windows PowerShell 5.1.
if ((node -p "process.platform + '/' + process.arch") -ne 'win32/x64') { throw 'Build this package on Windows x64.' }
New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
$packageRoot = Join-Path $OutputDirectory 'Med-Assistant-Windows'
New-Item -ItemType Directory -Path (Join-Path $packageRoot 'runtime') -Force | Out-Null
$appRoot=Join-Path $packageRoot 'app'
New-Item -ItemType Directory -Path $appRoot | Out-Null
Get-ChildItem -LiteralPath $standalone -Recurse -Force -File | Where-Object { $_.Name -notlike '.env*' } | ForEach-Object {
  $relative=$_.FullName.Substring($standalone.Length+1)
  $target=Join-Path $appRoot $relative
  New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $target
}
'{"private":true,"type":"commonjs"}' | Set-Content -LiteralPath (Join-Path $packageRoot 'app/package.json') -Encoding ascii
Copy-Item -LiteralPath (Join-Path $repoRoot 'apps/web/.next/static') -Destination (Join-Path $packageRoot 'app/apps/web/.next/static') -Recurse
$publicPath = Join-Path $repoRoot 'apps/web/public'
if (Test-Path -LiteralPath $publicPath) { Copy-Item -LiteralPath $publicPath -Destination (Join-Path $packageRoot 'app/apps/web/public') -Recurse }
Copy-Item -LiteralPath (Get-Command node).Source -Destination (Join-Path $packageRoot 'runtime/node.exe')
Get-ChildItem -LiteralPath (Join-Path $repoRoot 'desktop') -File | Copy-Item -Destination $packageRoot
if($Connected) {
  $connection=@{}
  Get-Content -LiteralPath (Join-Path $repoRoot 'apps/web/.env.local') | ForEach-Object {
    if($_ -match '^(SUPABASE_URL|SUPABASE_PUBLISHABLE_KEY)=(.*)$') { $connection[$matches[1]]=$matches[2].Trim() }
  }
  if($connection.SUPABASE_URL -notmatch '^https://[a-z0-9]+\.supabase\.co/?$' -or $connection.SUPABASE_PUBLISHABLE_KEY -notlike 'sb_publishable_*') { throw 'Valid public app connection settings are required.' }
  Write-Utf8NoBom (Join-Path $packageRoot 'app-config.json') (@{supabaseUrl=$connection.SUPABASE_URL;publishableKey=$connection.SUPABASE_PUBLISHABLE_KEY} | ConvertTo-Json)
}
if ($Version) { $Version | Set-Content -LiteralPath (Join-Path $packageRoot 'VERSION.txt') -Encoding ascii }
elseif ($Connected) { throw 'A connected release must be stamped: pass -Version and build with NEXT_PUBLIC_APP_VERSION set to the same value.' }
# Include the exact runtime distribution's license (also covers bundled components).
$nodeVersion = node -p 'process.version'
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nodejs/node/$nodeVersion/LICENSE" -OutFile (Join-Path $packageRoot 'runtime/LICENSE.txt')
$badFiles = Get-ChildItem -LiteralPath $packageRoot -Recurse -Force -File | Where-Object { $_.Name -like '.env*' -or $_.Name -match '\.(pem|key)$' }
if ($badFiles) { throw 'Unexpected environment/credential file in build output; package stopped.' }
$files = @(Get-ChildItem -LiteralPath $packageRoot -Recurse -Force -File | ForEach-Object {
  @{ path = $_.FullName.Substring($packageRoot.Length + 1).Replace('\', '/'); sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
})
Write-Utf8NoBom (Join-Path $packageRoot 'MANIFEST.json') (@{ format = 'med-assistant-windows/v1'; previewOnly = -not $Connected; clinicalReady = $false; runtime = $nodeVersion; version = $Version; files = $files } | ConvertTo-Json -Depth 5)
$archive = Join-Path $OutputDirectory 'Med-Assistant-Windows-x64.zip'
# Compress-Archive omits hidden files on some systems, including .next assets.
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageRoot, $archive, [System.IO.Compression.CompressionLevel]::Optimal, $true)
$digest = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
"$digest  Med-Assistant-Windows-x64.zip" | Set-Content -LiteralPath ($archive + '.sha256') -Encoding ascii
Write-Output $archive
