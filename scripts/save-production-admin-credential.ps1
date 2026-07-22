$ErrorActionPreference = 'Stop'

$credentialPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.admin-e2e-credential.json'
$username = Read-Host 'Production Admin username'
$password = Read-Host 'Production Admin password (input is hidden)' -AsSecureString

if ([string]::IsNullOrWhiteSpace($username)) {
  throw 'Production Admin username is required.'
}

@{
  Username = $username.Trim()
  EncryptedPassword = ConvertFrom-SecureString $password
} | ConvertTo-Json | Set-Content -LiteralPath $credentialPath -Encoding UTF8

Write-Host 'Credential saved with Windows user encryption. Tell Codex: da luu credential.' -ForegroundColor Green
