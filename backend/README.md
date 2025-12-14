# KhaoGully Backend API

FastAPI backend for the KhaoGully food delivery pooling platform.

## Setup

1. Create virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Run development server:
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Supabase client setup
│   ├── dependencies.py      # Dependency injection
│   ├── middleware/          # Custom middleware
│   ├── models/              # Pydantic models
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```
