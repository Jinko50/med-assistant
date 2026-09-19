param([string]$OutputDirectory = '')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $repoRoot ('dist/windows-' + [guid]::NewGuid().ToString('N')) }
$OutputDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
if (Test-Path -LiteralPath $OutputDirectory) { throw 'Choose a new output directory; existing files are never replaced.' }
$standalone = Join-Path $repoRoot 'apps/web/.next/standalone'
if (-not (Test-Path -LiteralPath (Join-Path $standalone 'apps/web/server.js'))) { throw 'Run npm run build first.' }
if ((node -p 'process.platform + "/" + process.arch') -ne 'win32/x64') { throw 'Build this package on Windows x64.' }
New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
$packageRoot = Join-Path $OutputDirectory 'Med-Assistant-Windows'
New-Item -ItemType Directory -Path (Join-Path $packageRoot 'runtime') -Force | Out-Null
Copy-Item -LiteralPath $standalone -Destination (Join-Path $packageRoot 'app') -Recurse
'{"private":true,"type":"commonjs"}' | Set-Content -LiteralPath (Join-Path $packageRoot 'app/package.json') -Encoding ascii
Copy-Item -LiteralPath (Join-Path $repoRoot 'apps/web/.next/static') -Destination (Join-Path $packageRoot 'app/apps/web/.next/static') -Recurse
$publicPath = Join-Path $repoRoot 'apps/web/public'
if (Test-Path -LiteralPath $publicPath) { Copy-Item -LiteralPath $publicPath -Destination (Join-Path $packageRoot 'app/apps/web/public') -Recurse }
Copy-Item -LiteralPath (Get-Command node).Source -Destination (Join-Path $packageRoot 'runtime/node.exe')
Get-ChildItem -LiteralPath (Join-Path $repoRoot 'desktop') -File | Copy-Item -Destination $packageRoot
# Include the exact runtime distribution's license (also covers bundled components).
$nodeVersion = node -p 'process.version'
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nodejs/node/$nodeVersion/LICENSE" -OutFile (Join-Path $packageRoot 'runtime/LICENSE.txt')
$badFiles = Get-ChildItem -LiteralPath $packageRoot -Recurse -Force -File | Where-Object { $_.Name -like '.env*' -or $_.Name -match '\.(pem|key)$' }
if ($badFiles) { throw 'Unexpected environment/credential file in build output; package stopped.' }
$files = @(Get-ChildItem -LiteralPath $packageRoot -Recurse -Force -File | ForEach-Object {
  @{ path = $_.FullName.Substring($packageRoot.Length + 1).Replace('\', '/'); sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
})
@{ format = 'med-assistant-windows/v1'; previewOnly = $true; clinicalReady = $false; runtime = $nodeVersion; files = $files } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $packageRoot 'MANIFEST.json') -Encoding utf8
$archive = Join-Path $OutputDirectory 'Med-Assistant-Windows-x64.zip'
# Compress-Archive omits hidden files on some systems, including .next assets.
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageRoot, $archive, [System.IO.Compression.CompressionLevel]::Optimal, $true)
$digest = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
"$digest  Med-Assistant-Windows-x64.zip" | Set-Content -LiteralPath ($archive + '.sha256') -Encoding ascii
Write-Output $archive
