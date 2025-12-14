# Backend RLS and API Alignment - Implementation Summary

## ✅ Completed Tasks

### 1. Fixed RLS Authentication Flow
- **Updated `database.py`**: Changed from service role bypass to proper JWT token passing
- **Updated `dependencies.py`**: Modified `GetSupabase()` to create per-request authenticated clients
- **Result**: Backend now properly passes user JWT tokens so RLS policies work with `auth.uid()`

### 2. Added Missing API Endpoints

#### Promo Codes (`/promo-codes`)
- ✅ `POST /promo-codes/validate` - Validate promo code for order
- ✅ `GET /promo-codes/my-usage` - View customer's promo code usage history
- ✅ `POST /promo-codes/` - Create promo code (admin)
- ✅ `GET /promo-codes/analytics` - View analytics (admin)

#### Referrals (`/referrals`)
- ✅ `GET /referrals/my-stats` - View referral statistics
- ✅ `GET /referrals/my-referrals` - List all referrals made

#### Wallet (`/wallet`)
- ✅ `GET /wallet/` - View wallet balance and totals
- ✅ `GET /wallet/transactions` - View transaction history
- ✅ `POST /wallet/transactions` - Create transaction (admin)

#### Support System (`/support`)
- ✅ `POST /support/tickets` - Create support ticket
- ✅ `GET /support/tickets` - List customer's tickets
- ✅ `GET /support/tickets/{id}` - Get ticket details
- ✅ `POST /support/tickets/{id}/messages` - Send message
- ✅ `GET /support/tickets/{id}/messages` - Get all messages
- ✅ `GET /support/admin/tickets` - List all tickets (admin)
- ✅ `PATCH /support/admin/tickets/{id}` - Update ticket (admin)

#### Notifications (`/notifications`)
- ✅ `GET /notifications/` - List notifications (with unread filter)
- ✅ `GET /notifications/unread-count` - Get unread count
- ✅ `PATCH /notifications/{id}` - Mark as read/unread
- ✅ `POST /notifications/mark-all-read` - Mark all as read
- ✅ `POST /notifications/` - Create notification (admin)

### 3. Database RLS Policy Fixes

Created migration file: `backend/migrations/fix_rls_policies.sql`

**Fixed INSERT policies** (changed from `qual = null` to proper checks):
- `customer_addresses` - Now checks `auth.uid() = customer_id`
- `reviews` - Now checks `auth.uid() = customer_id`
- `customer_orders` - Now checks `auth.uid() = customer_id`
- `support_tickets` - Now checks `auth.uid() = customer_id`
- `support_messages` - Now checks ticket ownership
- `search_history` - Now checks `auth.uid() = customer_id`
- `restaurant_views` - Now checks `auth.uid() = customer_id`

**Added missing RLS policies**:
- `promo_codes` - Public can view active codes
- `promo_code_usage` - Customers can view own usage
- `referrals` - Customers can view own referrals
- `refunds` - Customers can view own refunds
- `restaurant_hours` - Public read access

## 🔐 Security Improvements

### Before
- Backend used service role key for ALL operations
- RLS policies were completely bypassed
- Manual authorization checks in code (error-prone)

### After
- Backend uses anon key + JWT tokens for customer operations
- RLS policies automatically enforce `auth.uid()` checks
- Service role only used for actual admin operations
- INSERT policies prevent user impersonation

## 📋 How to Apply Changes

### 1. Update Environment Variables
Ensure your `.env` has both keys:
```env
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 2. Run Database Migration
```bash
# Connect to Supabase and run the migration
psql -h your-db-host -U postgres -d postgres -f backend/migrations/fix_rls_policies.sql
```

Or use Supabase Dashboard → SQL Editor to paste and run the migration.

### 3. Restart Backend
```bash
cd backend
uvicorn app.main:App --reload
```

## 🎯 What This Fixes

1. **RLS Now Works**: `auth.uid()` in policies now correctly identifies the logged-in user
2. **Security Hardened**: Users cannot impersonate others when creating records
3. **Complete API**: All database tables now have corresponding endpoints
4. **Admin Operations**: Proper separation between customer and admin operations

## ⚠️ Important Notes

- **Admin role implementation**: Currently uses `RequireAdmin` dependency which checks for `is_admin` field. You need to either:
  - Add `is_admin BOOLEAN` column to `customers` table, OR
  - Implement custom JWT claims in Supabase auth

- **Promo code application**: The validation endpoint returns discount amount but doesn't create usage records. Usage records should be created when orders are placed (update order creation logic).

- **Wallet operations**: Admin wallet transaction endpoint handles balance updates. Consider adding database triggers for automatic balance updates.

## 🚀 Next Steps

1. Test all new endpoints with proper JWT tokens
2. Implement admin role checking mechanism
3. Update frontend to use new endpoints
4. Add database triggers for automatic operations (wallet balance, promo code usage count, etc.)
5. Consider adding rate limiting for sensitive operations
