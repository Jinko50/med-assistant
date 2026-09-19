param([ValidateRange(1024,65535)][int]$Port = 3000)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path -LiteralPath 'apps/web/.next/BUILD_ID')) { throw 'Run scripts/setup-windows.ps1 first.' }
$env:ENABLE_FICTIONAL_PREVIEW = 'true'
$env:MED_ASSISTANT_PREVIEW_ONLY = 'true'
# The preview launcher explicitly disables the live backend.
$env:SUPABASE_URL = ''
$env:SUPABASE_PUBLISHABLE_KEY = ''
$env:NEXT_TELEMETRY_DISABLED = '1'
Write-Host "Open http://127.0.0.1:$Port/ru/preview/patient in your browser. Ctrl+C stops the app."
& node node_modules/next/dist/bin/next start apps/web --hostname 127.0.0.1 --port $Port
if ($LASTEXITCODE -ne 0) { throw 'App stopped with an error. Check whether the port is already in use.' }
