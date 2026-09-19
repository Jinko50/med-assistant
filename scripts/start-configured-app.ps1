param([ValidateRange(1024,65535)][int]$Port = 3000)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path -LiteralPath 'apps/web/.env.local')) { throw 'Follow docs/SUPABASE_SETUP.md to configure the synthetic test environment first.' }
if (-not (Test-Path -LiteralPath 'apps/web/.next/BUILD_ID')) { throw 'Run the setup script or npm run build first.' }
$env:ENABLE_FICTIONAL_PREVIEW = 'false'
$env:MED_ASSISTANT_PREVIEW_ONLY = 'false'
$env:NEXT_TELEMETRY_DISABLED = '1'
Write-Host "Open http://127.0.0.1:$Port/ru/login. This test application is not ready for real patient data."
& node node_modules/next/dist/bin/next start apps/web --hostname 127.0.0.1 --port $Port
if ($LASTEXITCODE -ne 0) { throw 'App stopped with an error.' }
