# Start Development Servers
Write-Host "Starting KhaaoGali Development Servers..." -ForegroundColor Green

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Frontend
Write-Host "`nStarting Frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

# Wait a moment before starting backend
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; uvicorn app.main:App --reload"

Write-Host "`nBoth servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "`nClose the terminal windows to stop the servers." -ForegroundColor Gray
