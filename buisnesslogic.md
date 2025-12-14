# 🍽️ KhaoGully - Business Logic & Requirements Documentation

## 📖 Table of Contents
1. [Business Overview](#business-overview)
2. [Core Concepts](#core-concepts)
3. [Business Logic](#business-logic)
4. [User Stories](#user-stories)
5. [System Requirements](#system-requirements)
6. [Data Models](#data-models)
7. [Business Rules](#business-rules)
8. [User Flows](#user-flows)

---

## 🎯 Business Overview

**KhaoGully** is a food delivery pooling platform designed primarily for campus environments (hostels, universities, corporate campuses). The platform enables customers to order food from multiple restaurants and share delivery costs through a pooling system.

### Problem Statement
- High delivery charges for individual orders
- Multiple deliveries to the same location increase costs
- Students/employees want variety but can't afford multiple delivery fees
- Restaurants face challenges with small order values

### Solution
A pooling system where multiple customers can order from different restaurants, but all orders in a pool are delivered together to one location with shared delivery costs.

---

## 🔑 Core Concepts

### 1. **Campus**
A physical location where deliveries are made (e.g., college campus, corporate office, hostel).

**Key Attributes:**
- Name & Code (unique identifier)
- Hotspot Location (main delivery point)
- Geographic coordinates (latitude, longitude)
- Active status

**Purpose:**
- Groups restaurants and customers by location
- Defines delivery zones
- Enables location-based pool creation

---

### 2. **Pool (Order Pool)**
The heart of the business model. A pool is a **time-bound collection window** where multiple customers can place orders from different restaurants to be delivered together.

#### **How Pools Work:**

**Structure:**
```
Pool "Lunch Rush - 1:00 PM"
├── Campus: XYZ University
├── Collection Window: 12:00 PM - 12:45 PM
├── Delivery Time: 1:00 PM - 1:30 PM
├── Participating Restaurants: [Restaurant A, Restaurant B, Restaurant C]
├── Delivery Location: Main Hostel Gate
├── Delivery Fee Per Order: ₹10
└── Orders:
    ├── Customer 1 → Restaurant A → ₹200
    ├── Customer 2 → Restaurant B → ₹150
    ├── Customer 3 → Restaurant A → ₹180
    └── Customer 4 → Restaurant C → ₹220
```

**Key Properties:**
- **Campus ID**: Which campus this pool serves
- **Participating Restaurants**: List of restaurant IDs that can accept orders in this pool
- **Collection Start/End**: Time window when customers can place orders
- **Delivery Window**: Expected delivery time range
- **Expected Delivery Time**: Precise delivery time
- **Max Orders**: Optional cap on number of orders
- **Delivery Fee Per Order**: Fixed delivery charge per customer (e.g., ₹10)
- **Status**: OPEN, CLOSED, SCHEDULED, SYNCED

**Pool Lifecycle:**
1. **SCHEDULED** - Created but collection window hasn't started
2. **OPEN** - Collection window is active, accepting orders
3. **CLOSED** - Collection window ended, processing orders
4. **SYNCED** - Orders synced with delivery partner (Fleetbase)

---

### 3. **Restaurant**
Food vendors that participate in pools and serve specific campuses.

**Key Attributes:**
- Name, address, contact info
- Geographic coordinates
- Rating & delivery time
- Cost for two (pricing indicator)
- Cuisine types
- Image/logo

**Relationship with Pools:**
- One restaurant can participate in MULTIPLE pools
- One pool can have MULTIPLE restaurants
- Restaurants must be within deliverable distance from campus

---

### 4. **Dish (Menu Item)**
Individual food items offered by restaurants.

**Key Attributes:**
- Name, description, price (in paise/cents)
- Image
- Veg/Non-veg indicator
- Rating
- Tags (e.g., "spicy", "popular", "new")
- Availability status

**Pricing:**
- Stored in smallest currency unit (paise for INR, cents for USD)
- Example: ₹200 = 20000 paise

---

### 5. **Cart**
Temporary storage for items before order placement.

**Structure:**
```
Cart
├── Customer ID
├── Pool ID (which pool customer is ordering in)
└── Cart Items:
    ├── Item 1: Restaurant A → Dish X × 2 = ₹400
    ├── Item 2: Restaurant B → Dish Y × 1 = ₹150
    └── Item 3: Restaurant A → Dish Z × 1 = ₹100
```

**Important Rules:**
- One cart per customer per pool
- Can contain items from MULTIPLE restaurants (within same pool)
- Items must be from restaurants participating in the selected pool
- Cart is pool-specific (changing pools clears/changes cart)

---

### 6. **Order (Customer Order)**
A confirmed purchase by a customer in a pool.

**Key Attributes:**
- Pool ID (which pool this order belongs to)
- Customer ID
- Restaurant ID (order grouped by restaurant for preparation)
- Items (JSONB array of dishes with quantities and prices)
- Total amount (subtotal + delivery fee + taxes)
- Payment status (PENDING, COMPLETED, FAILED, REFUNDED)
- Order status (POOLING, PENDING, ACCEPTED, OUT_FOR_DELIVERY, DELIVERED)
- Delivery address (hostel block, room number, etc.)
- Special instructions

**Order Breakdown:**
```
Order #12345
├── Subtotal: ₹450 (items total)
├── Delivery Fee: ₹10 (from pool)
├── Platform Fee: ₹15
├── Taxes (GST): ₹47
├── Discount: -₹50 (promo code)
└── Total: ₹472
```

---

### 7. **Customer**
End users who order food.

**Key Attributes:**
- Full name, phone, email
- Avatar/profile picture
- Default campus
- Delivery addresses (hostel block, room number, etc.)
- Referral code (for referring others)
- Order history
- Wallet balance (for refunds/cashback)

---

## 🧠 Business Logic

### 1. **Pool-Based Delivery Cost Sharing**

**Core Principle:**
Instead of each customer paying full delivery charges, costs are shared when ordering from the same pool.

**Example Scenario:**
```
Without Pool:
- Customer A orders from Restaurant 1: ₹200 + ₹50 delivery = ₹250
- Customer B orders from Restaurant 2: ₹300 + ₹50 delivery = ₹350
- Customer C orders from Restaurant 1: ₹150 + ₹50 delivery = ₹200
Total paid: ₹800 (₹150 in delivery fees)

With Pool (₹10 delivery per order):
- Customer A orders from Restaurant 1: ₹200 + ₹10 = ₹210
- Customer B orders from Restaurant 2: ₹300 + ₹10 = ₹310
- Customer C orders from Restaurant 1: ₹150 + ₹10 = ₹160
Total paid: ₹680 (₹30 in delivery fees)
Savings: ₹120 (80% reduction in delivery costs!)
```

**Why This Works:**
- All orders go to the same campus hotspot location
- One delivery person can carry multiple orders
- Orders are batched in time windows (pools)
- Restaurants coordinate pickup times

---

### 2. **Multiple Restaurants in One Pool**

**Key Innovation:**
Customers in the same pool can order from DIFFERENT restaurants.

**How It Works:**
```
Pool "Dinner Special - 8:00 PM"
├── Restaurant A (Pizza place)
├── Restaurant B (Chinese food)
└── Restaurant C (Indian cuisine)

Customer Orders:
├── Customer 1: 2 pizzas from Restaurant A
├── Customer 2: Fried rice from Restaurant B
├── Customer 3: Paneer tikka from Restaurant A
└── Customer 4: Noodles from Restaurant B
```

**Logistics:**
1. All restaurants in pool must be near the campus
2. Delivery partner collects orders from each restaurant
3. All items delivered together to campus hotspot
4. Each customer pays only their share (e.g., ₹10) of delivery

**Business Benefits:**
- **For Customers**: More variety, lower costs
- **For Restaurants**: More orders, shared delivery costs
- **For Platform**: Higher order values, better engagement

---

### 3. **One Pool = One Delivery Location**

**Critical Rule:**
All orders in a pool are delivered to the SAME location (campus hotspot).

**Why:**
- Enables cost sharing
- Simplifies logistics
- Faster delivery execution
- Predictable delivery windows

**Example:**
```
Pool: "ABC Hostel - Lunch"
├── Delivery Location: Main Gate, ABC Hostel
├── All restaurants know where to deliver
├── Customers collect from this central point
└── OR delivery person distributes to individual rooms
```

**Customer Delivery Options:**
1. **Hotspot Collection**: Customer picks up from central location
2. **Room Delivery**: Delivery person distributes to individual rooms (within campus)

---

### 4. **Time-Based Pool Operations**

**Pool Scheduling:**
```
Pool Creation (Admin)
↓
SCHEDULED (waiting for collection window)
↓
OPEN (collection_start reached - accepting orders)
↓
CLOSED (collection_end reached - no more orders)
↓
SYNCED (orders sent to delivery partner)
↓
DELIVERED (all orders completed)
```

**Time Windows:**
- **Collection Window**: When customers can place orders (e.g., 12:00 PM - 12:45 PM)
- **Delivery Window**: When food will arrive (e.g., 1:00 PM - 1:30 PM)
- **Buffer Time**: Gap between collection and delivery for preparation

**Example Timeline:**
```
11:45 AM - Pool opens (SCHEDULED → OPEN)
12:00 PM - Customer A places order
12:15 PM - Customer B places order
12:30 PM - Customer C places order
12:45 PM - Pool closes (OPEN → CLOSED)
12:50 PM - Orders synced with delivery partner (CLOSED → SYNCED)
1:00 PM  - Delivery partner starts collecting from restaurants
1:20 PM  - All food collected
1:30 PM  - Delivery to campus hotspot (DELIVERED)
```

---

## 👥 User Stories

### Customer Stories

#### **US-C1: Select Campus and Browse Pools**
```
As a customer,
I want to select my campus location,
So that I can see available food pools and restaurants near me.

Acceptance Criteria:
- Can view list of active campuses
- Can select a campus
- System shows pools available for selected campus
- Only shows pools in OPEN or SCHEDULED status
```

#### **US-C2: Browse Restaurants in a Pool**
```
As a customer,
I want to see which restaurants are participating in a pool,
So that I can order from any of them in the same delivery.

Acceptance Criteria:
- Pool details show list of participating restaurants
- Can view restaurant details (menu, ratings, cuisines)
- Can browse multiple restaurant menus within same pool
```

#### **US-C3: Add Items to Cart from Multiple Restaurants**
```
As a customer,
I want to add dishes from multiple restaurants to my cart,
So that I can get variety in a single order.

Acceptance Criteria:
- Can add items from Restaurant A
- Can add items from Restaurant B (same pool)
- Cart shows items grouped by restaurant
- Cart displays total with delivery fee
```

#### **US-C4: Place Order and Pay**
```
As a customer,
I want to checkout my cart and pay,
So that I can confirm my food order in the pool.

Acceptance Criteria:
- Cart shows breakdown (subtotal, delivery, taxes)
- Can enter delivery address (hostel/room)
- Can add special instructions
- Payment gateway integration
- Order confirmed after successful payment
```

#### **US-C5: Track Order Status**
```
As a customer,
I want to track my order status,
So that I know when my food will arrive.

Acceptance Criteria:
- Order shows current status (POOLING, ACCEPTED, OUT_FOR_DELIVERY, DELIVERED)
- Can see expected delivery time
- Real-time status updates
- Notifications on status changes
```

#### **US-C6: View Order History**
```
As a customer,
I want to see my past orders,
So that I can reorder favorites and track spending.

Acceptance Criteria:
- List of all past orders
- Order details (items, restaurant, total, date)
- Can filter by date/restaurant
- Can reorder from history
```

#### **US-C7: Leave Reviews and Ratings**
```
As a customer,
I want to rate and review restaurants and dishes,
So that I can share my experience with others.

Acceptance Criteria:
- Can rate restaurant (1-5 stars)
- Can rate individual dishes
- Can write text review
- Reviews visible to other customers
```

---

### Admin Stories

#### **US-A1: Manage Campuses**
```
As an admin,
I want to create and manage campus locations,
So that customers can order deliveries to their location.

Acceptance Criteria:
- Can add new campus with name, code, coordinates
- Can set hotspot location for delivery
- Can activate/deactivate campuses
- Can view all campuses
```

#### **US-A2: Create and Manage Pools**
```
As an admin,
I want to create order pools with time windows,
So that customers can place grouped orders.

Acceptance Criteria:
- Can create pool with collection/delivery times
- Can select participating restaurants
- Can set delivery fee per order
- Can set max order limit
- Can close pool manually
- Can view pool statistics (orders, revenue)
```

#### **US-A3: Onboard Restaurants**
```
As an admin,
I want to add restaurants to the platform,
So that they can participate in pools.

Acceptance Criteria:
- Can add restaurant details (name, address, coordinates)
- Can upload restaurant image
- Can set cuisine types
- Can activate/deactivate restaurants
```

#### **US-A4: Manage Restaurant Menus**
```
As an admin,
I want to add/edit dishes for restaurants,
So that customers can browse and order items.

Acceptance Criteria:
- Can add dish with name, price, description
- Can upload dish image
- Can mark veg/non-veg
- Can add tags
- Can set availability status
```

#### **US-A5: Monitor Pool Performance**
```
As an admin,
I want to view analytics for pools,
So that I can optimize pool schedules and restaurants.

Acceptance Criteria:
- Dashboard shows pool metrics (orders, revenue, customers)
- Can see popular restaurants
- Can see peak ordering times
- Can export reports
```

---

### Restaurant Partner Stories

#### **US-R1: View Incoming Pool Orders**
```
As a restaurant partner,
I want to see orders from pools I'm participating in,
So that I can prepare food on time.

Acceptance Criteria:
- Dashboard shows upcoming pool orders
- Orders grouped by pool
- Shows preparation deadline
- Can accept/reject orders
```

#### **US-R2: Update Menu and Availability**
```
As a restaurant partner,
I want to update my menu items and availability,
So that customers see accurate options.

Acceptance Criteria:
- Can mark items as unavailable
- Can update prices
- Can add new dishes
- Changes reflect immediately
```

---

## 🛠️ System Requirements

### Functional Requirements

#### **1. Authentication & Authorization**
- User registration (email/phone + Google OAuth)
- Login/logout functionality
- JWT-based session management
- Role-based access (Customer, Admin, Restaurant Partner)
- Password reset flow

#### **2. Location & Campus Management**
- Campus CRUD operations
- Geographic coordinate handling
- Hotspot location mapping
- Distance calculation between restaurants and campuses

#### **3. Pool Management**
- Pool CRUD operations
- Time-based status computation (SCHEDULED → OPEN → CLOSED → SYNCED)
- Restaurant assignment to pools
- Order capacity limits
- Auto-close pools after collection window
- Pool analytics and reporting

#### **4. Restaurant & Menu Management**
- Restaurant CRUD operations
- Menu/dish CRUD operations
- Image upload and storage (Supabase Storage)
- Category and tag management
- Availability toggling

#### **5. Cart & Order Processing**
- Multi-restaurant cart support
- Cart persistence (per pool)
- Price calculation (subtotal, delivery, taxes, discounts)
- Order creation from cart
- Payment gateway integration
- Order status workflow
- Order history

#### **6. Reviews & Ratings**
- Restaurant ratings (1-5 stars)
- Dish ratings
- Text reviews
- Rating aggregation and display

#### **7. User Profile**
- Profile viewing and editing
- Address management (hostel blocks, room numbers)
- Order history
- Wallet/refunds
- Referral system

---

### Non-Functional Requirements

#### **1. Performance**
- Page load time < 2 seconds
- API response time < 500ms
- Support 1000+ concurrent users
- Cart operations < 100ms

#### **2. Scalability**
- Horizontal scaling for backend
- Database query optimization
- Caching for restaurant/menu data
- CDN for static assets (images)

#### **3. Security**
- HTTPS for all communications
- JWT token expiration and refresh
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF protection
- Rate limiting on APIs
- Secure payment handling (PCI DSS compliance)

#### **4. Reliability**
- 99.9% uptime
- Database backups (daily)
- Error logging and monitoring
- Graceful error handling
- Payment failure recovery

#### **5. Usability**
- Mobile-responsive design
- Intuitive navigation
- Clear error messages
- Loading indicators
- Accessibility (WCAG 2.1 Level AA)

---

## 📊 Data Models

### Core Entities

#### **1. Campus**
```typescript
Campus {
  id: UUID (PK)
  name: string
  code: string (unique)
  hotspot_location: string
  latitude: decimal
  longitude: decimal
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### **2. Restaurant**
```typescript
Restaurant {
  id: UUID (PK)
  name: string
  address: string
  latitude: decimal
  longitude: decimal
  phone: string
  email: string
  rating: decimal (0-5)
  delivery_time: integer (minutes)
  cost_for_two: integer (paise)
  cuisine: string[] (JSONB)
  image: string (URL)
  location: string
  created_at: timestamp
  updated_at: timestamp
}
```

#### **3. Dish**
```typescript
Dish {
  id: UUID (PK)
  restaurant_id: UUID (FK → Restaurant)
  name: string
  description: text
  price: integer (paise)
  image: string (URL)
  veg: boolean
  rating: decimal (0-5)
  tags: string[] (ARRAY)
  is_available: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### **4. Order Pool**
```typescript
OrderPool {
  id: UUID (PK)
  name: string
  campus_id: UUID (FK → Campus)
  collection_start: timestamp
  collection_end: timestamp
  delivery_window: string
  expected_delivery_time: timestamp
  participating_restaurants: UUID[] (JSONB)
  max_orders: integer (nullable)
  delivery_fee_per_order: integer (paise)
  status: enum (OPEN, CLOSED, SCHEDULED, SYNCED)
  fleetbase_pool_id: string (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### **5. Customer**
```typescript
Customer {
  id: UUID (PK, FK → auth.users)
  full_name: string
  phone: string
  email: string
  default_campus_id: UUID (FK → Campus)
  hostel_block: string (nullable)
  room_number: string (nullable)
  delivery_instructions: text (nullable)
  avatar_url: string (nullable)
  referral_code: string (unique)
  referred_by: UUID (FK → Customer, nullable)
  total_orders: integer
  total_spent: integer (paise)
  last_order_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### **6. Cart**
```typescript
Cart {
  id: UUID (PK)
  customer_id: UUID (FK → Customer)
  pool_id: UUID (FK → OrderPool)
  created_at: timestamp
  updated_at: timestamp
}

CartItem {
  id: UUID (PK)
  cart_id: UUID (FK → Cart)
  restaurant_id: UUID (FK → Restaurant)
  dish_id: UUID (FK → Dish)
  quantity: integer
  price: integer (paise, snapshot at add time)
  special_instructions: text (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### **7. Customer Order**
```typescript
CustomerOrder {
  id: UUID (PK)
  pool_id: UUID (FK → OrderPool)
  customer_id: UUID (FK → Customer)
  restaurant_id: UUID (FK → Restaurant)
  items: JSONB[] // [{ dish_id, dish_name, quantity, price, veg }]
  
  // Pricing breakdown
  subtotal: integer (paise)
  delivery_fee: integer (paise)
  platform_fee: integer (paise)
  taxes: integer (paise)
  discount: integer (paise)
  total: integer (paise)
  
  promo_code: string (nullable)
  
  // Status tracking
  payment_status: enum (PENDING, COMPLETED, FAILED, REFUNDED)
  payment_id: string (nullable)
  status: enum (POOLING, PENDING, ACCEPTED, REJECTED, OUT_FOR_DELIVERY, DELIVERED)
  
  // Delivery details
  delivery_address: JSONB // { hostel_block, room_number, landmark, phone }
  special_instructions: text (nullable)
  
  synced_to_fleetbase: boolean
  
  // Timestamps
  created_at: timestamp
  updated_at: timestamp
  cancelled_at: timestamp (nullable)
  cancellation_reason: text (nullable)
  delivered_at: timestamp (nullable)
}
```

#### **8. Review**
```typescript
Review {
  id: UUID (PK)
  customer_id: UUID (FK → Customer)
  restaurant_id: UUID (FK → Restaurant)
  order_id: UUID (FK → CustomerOrder, nullable)
  dish_id: UUID (FK → Dish, nullable)
  rating: integer (1-5)
  comment: text (nullable)
  is_verified_order: boolean
  helpful_count: integer
  created_at: timestamp
  updated_at: timestamp
}
```

---

### Relationships

```
Campus (1) ----< (M) OrderPool
Campus (1) ----< (M) Customer (default_campus)

Restaurant (1) ----< (M) Dish
Restaurant (1) ----< (M) CustomerOrder
Restaurant (M) ----< (M) OrderPool (via participating_restaurants JSONB)

OrderPool (1) ----< (M) Cart
OrderPool (1) ----< (M) CustomerOrder

Customer (1) ----< (M) Cart
Customer (1) ----< (M) CustomerOrder
Customer (1) ----< (M) Review
Customer (1) ----< (M) Customer (referral, self-referencing)

Cart (1) ----< (M) CartItem

Dish (1) ----< (M) CartItem
```

---

## 📋 Business Rules

### Pool Rules
1. **Pool Creation**:
   - Must have at least 1 participating restaurant
   - Collection end must be after collection start
   - Delivery time must be after collection end
   - Delivery fee must be >= 0

2. **Pool Status**:
   - Auto-transition SCHEDULED → OPEN when collection_start time reached
   - Auto-transition OPEN → CLOSED when collection_end time reached
   - Admin can manually close pool anytime
   - CLOSED pools cannot accept new orders

3. **Pool Capacity**:
   - If max_orders set, close pool when limit reached
   - Orders must complete payment to count toward limit

### Order Rules
1. **Order Placement**:
   - Can only order from restaurants in the selected pool
   - Pool must be in OPEN status
   - Items must be available
   - Payment must be completed to confirm order

2. **Order Pricing**:
   - Subtotal = sum of (item_price × quantity)
   - Delivery fee = pool's delivery_fee_per_order
   - Platform fee = calculated based on subtotal (e.g., 5%)
   - Taxes = calculated on subtotal + fees (e.g., 5% GST)
   - Total = subtotal + delivery_fee + platform_fee + taxes - discount

3. **Order Status Workflow**:
   ```
   POOLING (waiting in pool)
     ↓
   PENDING (pool closed, sent to restaurant)
     ↓
   ACCEPTED (restaurant confirmed) / REJECTED (restaurant declined)
     ↓
   OUT_FOR_DELIVERY (delivery partner picked up)
     ↓
   DELIVERED (customer received)
   ```

4. **Cancellation Rules**:
   - Can cancel if status is POOLING or PENDING
   - Cannot cancel once ACCEPTED or later
   - Refund = full amount if cancelled before pool closes
   - Refund = 80% if cancelled after pool closes but before ACCEPTED

### Cart Rules
1. **Cart Operations**:
   - One active cart per customer per pool
   - Changing pool clears existing cart (or prompts user)
   - Cart items must be from participating restaurants
   - Cart expires when pool closes

2. **Cart Limits**:
   - Max 50 items per cart
   - Max quantity per item: 99
   - Min cart value: ₹50 (5000 paise)

### Payment Rules
1. **Payment Methods**:
   - UPI, Credit/Debit Card, Net Banking, Wallet
   - Payment gateway: Razorpay/Stripe

2. **Payment Flow**:
   - Create order → Initiate payment → Confirm payment → Update order status
   - Payment timeout: 10 minutes
   - Failed payment: Order cancelled, retry allowed

3. **Refunds**:
   - Refund to original payment method
   - Processing time: 5-7 business days
   - Cancellation refunds go to wallet (instant)

### Review Rules
1. **Review Eligibility**:
   - Can only review after order DELIVERED
   - One review per order per restaurant
   - Can review individual dishes from order

2. **Rating Aggregation**:
   - Restaurant rating = average of all restaurant reviews
   - Dish rating = average of all dish reviews
   - Verified reviews (from orders) weighted higher

---

## 🔄 User Flows

### Flow 1: Customer Places Order

```
1. Customer opens app
   ↓
2. Select campus location
   ↓
3. View available pools (OPEN/SCHEDULED)
   ↓
4. Select a pool (e.g., "Lunch Rush - 1:00 PM")
   ↓
5. Browse participating restaurants
   ↓
6. Select Restaurant A → Browse menu → Add items to cart
   ↓
7. Select Restaurant B → Browse menu → Add more items to cart
   ↓
8. View cart (items from both restaurants)
   ↓
9. Review pricing:
   - Subtotal: ₹450
   - Delivery: ₹10
   - Taxes: ₹23
   - Total: ₹483
   ↓
10. Click "Checkout"
    ↓
11. Enter/confirm delivery address (hostel block, room)
    ↓
12. Add special instructions (optional)
    ↓
13. Select payment method
    ↓
14. Complete payment
    ↓
15. Order confirmed! Status: POOLING
    ↓
16. Track order status in real-time
    ↓
17. Receive food at delivery time
    ↓
18. Leave review/rating
```

---

### Flow 2: Admin Creates Pool

```
1. Admin logs in to dashboard
   ↓
2. Navigate to "Pool Management"
   ↓
3. Click "Create New Pool"
   ↓
4. Fill pool details:
   - Name: "Dinner Special - 8:30 PM"
   - Campus: XYZ Hostel
   - Collection: 7:30 PM - 8:15 PM
   - Delivery: 8:30 PM - 9:00 PM
   - Expected delivery: 8:30 PM
   - Max orders: 50
   - Delivery fee: ₹10
   ↓
5. Select participating restaurants:
   - [x] Restaurant A (Pizza)
   - [x] Restaurant B (Chinese)
   - [x] Restaurant C (Indian)
   ↓
6. Save pool → Status: SCHEDULED
   ↓
7. At 7:30 PM → Pool auto-opens → Status: OPEN
   ↓
8. Customers place orders between 7:30-8:15 PM
   ↓
9. At 8:15 PM → Pool auto-closes → Status: CLOSED
   ↓
10. System syncs orders with delivery partner → Status: SYNCED
    ↓
11. Monitor pool performance:
    - Total orders: 23
    - Total revenue: ₹8,450
    - Avg order value: ₹367
```

---

### Flow 3: Restaurant Receives Pool Orders

```
1. Restaurant partner logs in
   ↓
2. View dashboard → Upcoming pools
   ↓
3. Pool "Lunch Rush" closes at 12:45 PM
   ↓
4. Restaurant receives order notifications:
   - Order #101: Pizza × 2, Pasta × 1 (₹450)
   - Order #102: Pizza × 1, Salad × 1 (₹320)
   - Order #103: Burger × 3 (₹540)
   ↓
5. Preparation deadline: 1:15 PM
   ↓
6. Restaurant marks orders as ACCEPTED
   ↓
7. Prepare food items
   ↓
8. At 1:15 PM: Delivery partner arrives
   ↓
9. Hand over all orders to delivery partner
   ↓
10. Orders marked as OUT_FOR_DELIVERY
    ↓
11. Delivery partner goes to campus hotspot
    ↓
12. Customers collect orders / Room-wise delivery
    ↓
13. Orders marked as DELIVERED
```

---

## 🚀 Technical Stack Requirements

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API / Redux
- **Routing**: React Router v6
- **HTTP Client**: Axios / Fetch API
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Headless UI / Shadcn UI

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase Client (postgREST)
- **Authentication**: Supabase Auth + JWT
- **Validation**: Pydantic models
- **API Documentation**: OpenAPI (Swagger UI)

### Database & Storage
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage (for images)
- **Real-time**: Supabase Realtime (for order tracking)
- **Row Level Security**: Supabase RLS policies

### Third-Party Services
- **Payment Gateway**: Razorpay / Stripe
- **Authentication**: Google OAuth 2.0
- **Maps**: Google Maps API (for coordinates)
- **Delivery Partner**: Fleetbase API (optional)
- **AI Features**: Google Gemini API (for recommendations)
- **SMS/Notifications**: Twilio / Firebase Cloud Messaging

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Hosting**: 
  - Frontend: Vercel / Netlify
  - Backend: Railway / Render / AWS EC2
  - Database: Supabase Cloud
- **Monitoring**: Sentry (error tracking)
- **Analytics**: Google Analytics / Mixpanel

---

## 📈 Success Metrics

### Business KPIs
1. **Orders per Pool**: Target 15-20 orders per pool
2. **Average Order Value**: Target ₹350+
3. **Customer Retention**: Target 60% monthly retention
4. **Pool Utilization**: Target 70% of pools with 10+ orders
5. **Delivery Cost Savings**: Average 70% savings vs individual delivery

### Technical KPIs
1. **API Response Time**: < 500ms (p95)
2. **Page Load Time**: < 2 seconds
3. **Error Rate**: < 1%
4. **Uptime**: 99.9%
5. **Payment Success Rate**: > 95%

---

## 🎯 MVP (Minimum Viable Product) Features

### Phase 1 - Core Pooling (MVP)
- [x] Campus management
- [x] Restaurant & menu management
- [x] Pool creation and management
- [x] Multi-restaurant cart
- [x] Order placement
- [x] Basic payment integration
- [x] Order tracking
- [x] User authentication (email + Google)

### Phase 2 - Enhancement
- [ ] Real-time order tracking
- [ ] Reviews and ratings
- [ ] Referral system
- [ ] Promo codes and discounts
- [ ] Order history and favorites
- [ ] Push notifications
- [ ] Restaurant partner dashboard

### Phase 3 - Scale
- [ ] Admin analytics dashboard
- [ ] AI-powered recommendations (Gemini)
- [ ] Scheduled recurring pools
- [ ] Group orders (shared carts)
- [ ] Wallet and refunds
- [ ] Multiple payment methods
- [ ] Delivery partner integration (Fleetbase)

---

## 📝 Summary

**KhaoGully** revolutionizes campus food delivery by enabling:

1. **Cost Sharing**: Customers save 70%+ on delivery by pooling orders
2. **Variety**: Order from multiple restaurants in one delivery
3. **Convenience**: Fixed delivery windows, predictable timing
4. **Efficiency**: Restaurants handle batched orders, reducing logistics costs

**Key Differentiator**: One pool, many restaurants, one location, shared delivery cost.

This model works best in:
- College campuses
- Corporate offices
- Apartment complexes
- Hostel communities
- Any location with concentrated demand and shared delivery points

