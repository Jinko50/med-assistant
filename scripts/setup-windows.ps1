param([switch]$SkipBrowserTests)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
function Invoke-Checked([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Command failed: $Executable $($Arguments -join ' ')" }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 24.16 or newer in the 24.x line, then reopen PowerShell.' }
$nodeVersion = [version]((& node --version).TrimStart('v'))
if ($nodeVersion.Major -ne 24 -or $nodeVersion -lt [version]'24.16.0') { throw 'This checkout requires Node.js 24.16+ in the 24.x line.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd is missing; repair the Node.js installation.' }
$pythonExe = $null
$pythonPrefix = @()
if (Get-Command py -ErrorAction SilentlyContinue) { $pythonExe = 'py'; $pythonPrefix = @('-3') }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $pythonExe = 'python' }
if (-not $pythonExe) { throw 'Install Python 3.12 or newer (including launcher or PATH access) for the preserved safety checks.' }
$env:PYTHONIOENCODING = 'utf-8'
$env:NEXT_TELEMETRY_DISABLED = '1'
Invoke-Checked 'npm.cmd' @('ci','--ignore-scripts')
Invoke-Checked 'npm.cmd' @('audit','--audit-level=high')
Invoke-Checked 'npm.cmd' @('test')
Invoke-Checked 'npm.cmd' @('run','test:database')
Invoke-Checked $pythonExe ($pythonPrefix + @('tools/check_consistency.py'))
Invoke-Checked 'npm.cmd' @('run','build')
Invoke-Checked 'npm.cmd' @('run','typecheck')
if (-not $SkipBrowserTests) {
    Invoke-Checked 'npx.cmd' @('playwright','install','chromium')
    Invoke-Checked 'npm.cmd' @('run','test:e2e')
}
Write-Host 'Setup and requested checks passed. This is still a development app, not ready for patient use.'
Write-Host 'Run scripts/start-preview.ps1 to view the fictional app.'
