# 🚀 Quick Start Commands

## Setup (First Time Only)

```powershell
# Navigate to backend
cd "c:\Codes\BUILDS\1.1-Sartup\KhaaoGali\new customer website\backend"

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your Supabase credentials
notepad .env
```

## Run Server (Every Time)

```powershell
# Make sure you're in backend directory
cd "c:\Codes\BUILDS\1.1-Sartup\KhaaoGali\new customer website\backend"

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run development server
uvicorn app.main:App --reload --host 0.0.0.0 --port 8000
```

## Access API

- **API Base**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Quick Test

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Test campuses endpoint
curl http://localhost:8000/campuses
```

## Stop Server

Press `Ctrl+C` in the terminal running uvicorn

## Deactivate Virtual Environment

```powershell
deactivate
```

## Update Dependencies

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Common Issues

### Cannot activate venv
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Module not found errors
```powershell
# Reinstall dependencies
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Port already in use
```powershell
# Use different port
uvicorn app.main:App --reload --port 8001
```
