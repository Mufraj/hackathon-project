# Fixly Target Demo App — Error Trigger Automation Suite (PowerShell)

param(
    [string]$TargetHost = "localhost:3000"
)

Write-Host "=== Triggering Target App Error Harness on $TargetHost ===" -ForegroundColor Cyan

Write-Host "[1/6] Triggering DB Connection Pool Timeout (src/services/database.js:42)..." -ForegroundColor Yellow
try { Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/db-timeout" -Method Get | Out-Null } catch { Write-Host "Expected error captured" -ForegroundColor DarkGray }
Start-Sleep -Seconds 2

Write-Host "[2/6] Triggering Null Reference TypeError (src/routes/user_profile.js:88)..." -ForegroundColor Yellow
try { Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/null-ref" -Method Get | Out-Null } catch { Write-Host "Expected error captured" -ForegroundColor DarkGray }
Start-Sleep -Seconds 2

Write-Host "[3/6] Triggering Unhandled Promise Rejection (src/services/payment_gateway.js:104)..." -ForegroundColor Yellow
try { Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/unhandled-rejection" -Method Get | Out-Null } catch { Write-Host "Expected error captured" -ForegroundColor DarkGray }
Start-Sleep -Seconds 2

Write-Host "[4/6] Triggering CPU Resource Spike (>90% for 15s)..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/resource-spike" -Method Get | Out-Null
Start-Sleep -Seconds 1

Write-Host "[5/6] Triggering Math Division By Zero..." -ForegroundColor Yellow
try { Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/math-error" -Method Get | Out-Null } catch { Write-Host "Expected error captured" -ForegroundColor DarkGray }
Start-Sleep -Seconds 1

Write-Host "[6/6] Triggering Coding Syntax Error..." -ForegroundColor Yellow
try { Invoke-RestMethod -Uri "http://$TargetHost/api/trigger/syntax-error" -Method Get | Out-Null } catch { Write-Host "Expected error captured" -ForegroundColor DarkGray }

Write-Host "=== Trigger sequence complete. Open http://localhost:4000 and click Resolve with Grok ===" -ForegroundColor Green
