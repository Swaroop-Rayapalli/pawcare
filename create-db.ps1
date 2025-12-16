# PawCare MySQL Database Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PawCare MySQL Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for password
$password = Read-Host "Enter MySQL root password (press Enter if no password)"

Write-Host ""
Write-Host "Creating database..." -ForegroundColor Yellow
Write-Host ""

# Build MySQL command
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$sqlCommand = "CREATE DATABASE IF NOT EXISTS pawcare_db; SHOW DATABASES;"

try {
    if ([string]::IsNullOrEmpty($password)) {
        # No password
        & $mysqlPath -u root -e $sqlCommand 2>&1 | Out-String | Write-Host
    } else {
        # With password
        & $mysqlPath -u root "-p$password" -e $sqlCommand 2>&1 | Out-String | Write-Host
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS! Database created successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Updating .env file with password..." -ForegroundColor Yellow
        
        # Update .env file with the password
        $envPath = Join-Path $PSScriptRoot ".env"
        $envContent = Get-Content $envPath -Raw
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$password"
        Set-Content $envPath $envContent
        
        Write-Host "✅ .env file updated!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now you can start the PawCare application with:" -ForegroundColor Cyan
        Write-Host "npm start" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "ERROR: Failed to create database" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check your MySQL password and try again." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
