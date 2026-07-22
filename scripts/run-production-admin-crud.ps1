$ErrorActionPreference = 'Stop'

$workspace = Split-Path $PSScriptRoot -Parent
$credentialPath = Join-Path $workspace '.admin-e2e-credential.json'

if (-not (Test-Path -LiteralPath $credentialPath)) {
  throw "Credential file not found. Run scripts\save-production-admin-credential.ps1 first."
}

try {
  $credential = Get-Content -LiteralPath $credentialPath -Raw | ConvertFrom-Json
  $securePassword = $credential.EncryptedPassword | ConvertTo-SecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

  try {
    $env:ADMINAUTH__USERNAME = [string]$credential.Username
    $env:ADMINAUTH__PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & node (Join-Path $PSScriptRoot 'production-admin-crud.mjs')
    if ($LASTEXITCODE -ne 0) {
      throw "Production Admin CRUD smoke test failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    if ($pointer -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    Remove-Item Env:ADMINAUTH__PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ADMINAUTH__USERNAME -ErrorAction SilentlyContinue
  }
}
finally {
  Remove-Item -LiteralPath $credentialPath -Force -ErrorAction SilentlyContinue
}
