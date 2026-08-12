# Fixly Target Demo App — Error Trigger Automation Suite (PowerShell)

param(
    [string]$TargetHost = "localhost:3000"
)

Write-Host "=== Triggering Target App Error Harness on $TargetHost ===" -ForegroundColor Cyan

Write-Host "[1/4] Triggering DB Connection Pool Timeout (src/services/database.js:42)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/db-timeout" -Method Get | Out-Null
Start-Sleep -Seconds 2

Write-Host "[2/4] Triggering Null Reference TypeError (src/routes/user_profile.js:88)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/null-ref" -Method Get | Out-Null
Start-Sleep -Seconds 2

Write-Host "[3/4] Triggering Unhandled Promise Rejection (src/services/payment_gateway.js:104)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/unhandled-rejection" -Method Get | Out-Null
Start-Sleep -Seconds 2

Write-Host "[4/4] Triggering CPU Resource Spike (>90% for 15s)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/resource-spike" -Method Get | Out-Null

Write-Host "=== Trigger sequence complete. Check Fixly Dashboard for live log detection ===" -ForegroundColor Green
