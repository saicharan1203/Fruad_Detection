Write-Host "Starting FinFraudX Application..." -ForegroundColor Green

# Start Backend Server
Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Yellow
Set-Location backend
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "backend_app.py"

Start-Sleep -Seconds 5

# Start Frontend Server
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Yellow
Set-Location ../frontend
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start"

Write-Host ""
Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")