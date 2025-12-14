# 🔐 Supabase Auth Setup Guide

## ✅ What Was Implemented

### Complete Authentication System
1. **Supabase Client** - Configured in `src/lib/supabase.ts`
2. **Auth Context** - Global authentication state management
3. **Login Page** - Email/password + Google OAuth
4. **Signup Page** - User registration with automatic customer profile creation
5. **Protected Routes** - Cart and Order pages require authentication
6. **Auth UI** - Login/logout buttons in header with user menu
7. **JWT Token Integration** - Automatic attachment to all API requests

## 🚀 Setup Instructions

### 1. Create `.env` File

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Get Supabase Credentials

Go to your Supabase dashboard (https://supabase.com/dashboard):

1. Select your project
2. Go to **Settings** → **API**
3. Copy the following values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Use the `anon` (public) key, NOT the `service_role` key!

### 3. Enable Google OAuth (Optional)

If you want Google sign-in:

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Google** provider
3. Follow instructions to set up OAuth with Google Cloud Console
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for local development)

### 4. Backend Configuration

Your backend already uses Supabase Auth. Ensure your backend `.env` has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

**Important:** The `JWT_SECRET` must match your Supabase project's JWT secret:
- Go to **Settings** → **API** → **JWT Settings** → **JWT Secret**

## 🎯 How It Works

### Authentication Flow

1. **User Signs Up/Logs In**
   - Supabase creates user in `auth.users` table
   - JWT access token is returned
   - Frontend automatically creates customer profile in `customers` table

2. **JWT Token Storage**
   - Supabase client stores token in localStorage
   - Token automatically refreshed before expiration

3. **API Requests**
   - Axios interceptor attaches JWT to `Authorization` header
   - Backend validates token and extracts user ID
   - Backend passes token to Supabase client for RLS policies

4. **Protected Routes**
   - Cart and Order pages wrapped in `<ProtectedRoute>`
   - Redirects to login if not authenticated
   - Preserves intended destination after login

### User Registration Process

```
User fills signup form
    ↓
Frontend calls Supabase Auth signup
    ↓
Supabase creates user in auth.users
    ↓
Frontend creates customer profile in customers table
    ↓
User automatically logged in
    ↓
Redirected to home page
```

### API Request Flow

```
User makes request (e.g., create order)
    ↓
Axios interceptor gets session from Supabase
    ↓
Adds JWT to Authorization header
    ↓
Backend validates JWT and extracts user_id
    ↓
Backend creates authenticated Supabase client with JWT
    ↓
Database RLS policies enforce auth.uid() = user_id
    ↓
Response returned to frontend
```

## 📝 Environment Variables Required

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
```

## 🔒 Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use anon key in frontend** - It's safe for client-side use
3. **Keep service_role key secret** - Only in backend
4. **JWT tokens expire** - Automatically refreshed by Supabase
5. **RLS policies protect data** - Even if token is compromised

## 🎨 UI Components

### Login Page (`/login`)
- Email/password login
- Google OAuth button
- Link to signup page
- Error handling

### Signup Page (`/signup`)
- Full name, email, phone, password fields
- Password confirmation
- Google OAuth button
- Automatic customer profile creation
- Link to login page

### Layout Header
- Shows login button when logged out
- Shows user menu with email when logged in
- Logout functionality
- Cart icon with item count

### Protected Routes
- `/cart` - Requires authentication
- `/order/:orderId` - Requires authentication
- Automatically redirects to login
- Preserves intended destination

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in frontend root
- Verify variable names start with `VITE_`
- Restart dev server after adding variables

### Google OAuth not working
- Check OAuth credentials in Google Cloud Console
- Verify redirect URLs are correct
- Enable Google provider in Supabase dashboard

### Orders fail with 401 Unauthorized
- Check JWT_SECRET matches in backend .env
- Verify Supabase URL and keys are correct
- Check browser console for token errors

### Customer profile not created on signup
- Check Supabase RLS policies allow INSERT for authenticated users
- Verify `customers` table structure matches signup payload
- Check browser console for errors

## ✅ What's Fixed

1. **Real JWT tokens** - No more hardcoded mock data
2. **Protected routes** - Cart and orders require login
3. **Dynamic delivery fees** - Fetched from pool details
4. **Address form** - User enters real delivery address
5. **Auth headers** - Automatically added to all API requests

## 🚀 Next Steps

1. Add `.env` file with your Supabase credentials
2. Start the backend server
3. Start the frontend server
4. Test signup/login flow
5. Create a test order to verify end-to-end authentication
