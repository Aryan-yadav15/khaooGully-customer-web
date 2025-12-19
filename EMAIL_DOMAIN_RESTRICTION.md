# Email Domain Restriction Implementation

## Overview
Restricted user registration to only allow email addresses from specific college domains:
- `@kiit.ac.in`
- `@kims.ac.in`

## Implementation Layers

### 1. **Database Level (Most Secure)** ✅
- **File**: `backend/migrations/add_email_domain_check.sql`
- **What**: CHECK constraint on `customers` table
- **Why**: Cannot be bypassed, enforced at database level
- **How to Apply**: Run the SQL migration in your Supabase SQL editor

```sql
-- Apply this migration in Supabase dashboard
ALTER TABLE customers 
ADD CONSTRAINT email_domain_check 
CHECK (
    email ILIKE '%@kiit.ac.in' OR 
    email ILIKE '%@kims.ac.in'
);
```

### 2. **Backend Level** ✅
- **File**: `backend/app/utils/auth.py`
- **Function**: `ValidateEmailDomain(Email: str)`
- **What**: Validates email domain before account creation/update
- **Used in**: 
  - Customer profile updates (`backend/app/routers/customers.py`)
  - Can be called anywhere email validation is needed

### 3. **Frontend Level** ✅
- **File**: `frontend/src/context/AuthContext.tsx`
- **What**: Validates email domain after Google OAuth sign-in
- **Action**: Signs user out immediately if domain is not allowed
- **File**: `frontend/src/pages/Signup.tsx`
- **What**: Shows clear notice about allowed domains before sign-up

### 4. **Configuration** ✅
- **File**: `backend/app/config.py`
- **Setting**: `AllowedEmailDomains` (default: `["kiit.ac.in", "kims.ac.in"]`)
- **Customizable**: Can be overridden via environment variable `ALLOWED_EMAIL_DOMAINS`

## How It Works

### For New Users (Google OAuth):
1. User clicks "Sign in with Google"
2. User selects their Google account
3. Frontend validates email domain
4. If invalid → User is signed out with error message
5. If valid → Profile is created in database
6. Database constraint verifies email domain

### For Profile Updates:
1. User tries to update email in profile
2. Backend validates domain using `ValidateEmailDomain()`
3. If invalid → Returns 400 error
4. If valid → Database constraint verifies before saving

## Adding More Domains

### Option 1: Environment Variable (Recommended)
Add to your `.env` file:
```env
ALLOWED_EMAIL_DOMAINS=kiit.ac.in,kims.ac.in,newcollege.ac.in
```

### Option 2: Update Configuration
Edit `backend/app/config.py`:
```python
AllowedEmailDomains: List[str] = Field(
    default=["kiit.ac.in", "kims.ac.in", "newcollege.ac.in"],
    alias="allowed_email_domains"
)
```

### Option 3: Update Database Constraint
Edit migration file and add new domain:
```sql
ALTER TABLE customers 
DROP CONSTRAINT email_domain_check;

ALTER TABLE customers 
ADD CONSTRAINT email_domain_check 
CHECK (
    email ILIKE '%@kiit.ac.in' OR 
    email ILIKE '%@kims.ac.in' OR
    email ILIKE '%@newcollege.ac.in'
);
```

### Option 4: Update Frontend Allowed List
Edit `frontend/src/context/AuthContext.tsx`:
```typescript
const allowedDomains = ['kiit.ac.in', 'kims.ac.in', 'newcollege.ac.in'];
```

## Testing

### Test Valid Emails:
- `2206168@kiit.ac.in` ✅
- `student@kims.ac.in` ✅

### Test Invalid Emails:
- `user@gmail.com` ❌
- `student@othercollege.ac.in` ❌

## Security Notes

1. **Database constraint is the most important** - It cannot be bypassed even if frontend/backend are compromised
2. **Frontend validation** provides good UX (immediate feedback)
3. **Backend validation** provides API-level protection
4. **All three layers** work together for defense in depth

## Deployment Checklist

- [x] Update backend configuration
- [x] Update backend auth utility
- [x] Update customer router
- [x] Update frontend AuthContext
- [x] Update frontend Signup page
- [ ] **Apply SQL migration in Supabase** (IMPORTANT!)
- [ ] Test with valid email
- [ ] Test with invalid email
- [ ] Update environment variables if needed
