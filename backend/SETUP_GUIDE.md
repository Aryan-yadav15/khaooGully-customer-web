# 🚀 KhaoGully Backend - Setup & Deployment Guide

## 📋 Prerequisites

- Python 3.10 or higher
- PostgreSQL database (via Supabase)
- Supabase account and project
- Git (for version control)

## 🔧 Initial Setup

### 1. Environment Setup

```powershell
# Navigate to backend directory
cd "c:\Codes\BUILDS\1.1-Sartup\KhaaoGali\new customer website\backend"

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

```powershell
# Copy example environment file
Copy-Item .env.example .env

# Edit .env with your configuration
notepad .env
```

Required environment variables in `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
APP_NAME=KhaoGully API
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development

# CORS Configuration (Frontend URLs)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Business Configuration
PLATFORM_FEE_PERCENTAGE=5
TAX_PERCENTAGE=5
MIN_CART_VALUE=5000
```

### 3. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing one
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### 4. Generate JWT Secret

```powershell
# Generate a secure random secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and use it as `JWT_SECRET` in `.env`

## ▶️ Running the Application

### Development Mode

```powershell
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Run with auto-reload (development)
uvicorn app.main:App --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Production Mode

```powershell
# Run without auto-reload (production)
uvicorn app.main:App --host 0.0.0.0 --port 8000 --workers 4
```

## 🧪 Testing the API

### Health Check

```powershell
# Test if API is running
curl http://localhost:8000/health
```

### Get Campuses (No Auth Required)

```powershell
curl http://localhost:8000/campuses
```

### Authenticated Requests

For authenticated endpoints, you need a JWT token in the Authorization header:

```powershell
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/profile
```

## 📚 API Documentation

### Interactive Documentation

Once the server is running, visit:

1. **Swagger UI**: http://localhost:8000/docs
   - Interactive API explorer
   - Try out endpoints directly in browser
   - See request/response schemas

2. **ReDoc**: http://localhost:8000/redoc
   - Clean, readable API documentation
   - Better for reading and understanding

### Quick Endpoint Reference

See `API_REFERENCE.md` for complete list of endpoints.

## 🗂️ Project Structure

```
backend/
├── app/
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Supabase client
│   ├── dependencies.py      # Dependency injection
│   ├── models/              # Pydantic models
│   │   ├── campus.py
│   │   ├── restaurant.py
│   │   ├── pool.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── customer.py
│   │   └── review.py
│   ├── routers/             # API route handlers
│   │   ├── campuses.py
│   │   ├── restaurants.py
│   │   ├── pools.py
│   │   ├── cart.py
│   │   ├── orders.py
│   │   ├── customers.py
│   │   ├── reviews.py
│   │   └── admin.py
│   ├── services/            # Business logic
│   │   └── pricing.py
│   ├── utils/               # Utilities
│   │   ├── auth.py
│   │   └── exceptions.py
│   └── middleware/          # Custom middleware
├── tests/                   # Test files (future)
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
├── .env                    # Your local environment (gitignored)
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── API_REFERENCE.md       # API endpoints reference
```

## 🔐 Authentication Flow

1. **User Registration** (handled by Supabase Auth)
   - Frontend uses Supabase client to register user
   - User record created in `customers` table via trigger

2. **User Login** (handled by Supabase Auth)
   - Frontend uses Supabase client to authenticate
   - Receives JWT token from Supabase

3. **API Requests**
   - Frontend includes JWT in Authorization header
   - Backend validates JWT using `GetCurrentUserId` dependency
   - Extracts user ID from token for data access

## 🛠️ Common Tasks

### Add New Endpoint

1. Create route function in appropriate router file
2. Define Pydantic models in `models/` if needed
3. Add business logic in `services/` if complex
4. Test using Swagger UI

### Update Configuration

1. Edit `app/config.py` to add new setting
2. Add to `.env.example` as documentation
3. Set value in your local `.env`

### Database Schema Changes

The backend uses Supabase (PostgreSQL) directly. Schema changes are managed via:
- Supabase Dashboard SQL Editor
- Migration files (if using migration tool)

## 🚨 Troubleshooting

### Import Errors

```powershell
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

### Connection Errors

- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check if Supabase project is active
- Verify network connection

### CORS Errors

- Add frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart the server after changing `.env`

### Authentication Errors

- Verify JWT token is valid
- Check token hasn't expired
- Ensure `JWT_SECRET` matches across app restarts

## 🌐 Deployment

### Railway.app (Recommended)

1. Create account on [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

### Render.com

1. Create account on [render.com](https://render.com)
2. Create new Web Service
3. Connect repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:App --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy

### AWS EC2 / DigitalOcean

See detailed deployment guides for production setups.

## 📊 Monitoring

For production, consider adding:
- Logging: Python's `logging` module or external service
- Error tracking: Sentry
- Performance monitoring: New Relic or DataDog
- Health checks: Uptime monitoring service

## 🔒 Security Considerations

- **Never commit `.env` file** to version control
- Use strong `JWT_SECRET` in production
- Keep `SUPABASE_SERVICE_KEY` secure (admin access)
- Enable rate limiting for production
- Use HTTPS in production
- Regularly update dependencies

## 📝 License

[Your License Here]

## 🤝 Contributing

[Your Contribution Guidelines Here]

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Contact: [your-email@example.com]
