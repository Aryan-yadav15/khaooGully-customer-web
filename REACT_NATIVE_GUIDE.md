# KhaaoGully React Native App Development Guide

> **Complete documentation for building a React Native mobile app that mirrors the existing React web frontend using the same backend API.**

---

## ⚠️ Important: Customer-Only App

**This mobile app is for CUSTOMERS ONLY.** 

The admin functionality (managing pools, restaurants, promotions, orders) should remain on the **web dashboard only**. The mobile app focuses purely on the customer experience:
- Browsing restaurants and menus
- Joining pools and placing orders
- Tracking deliveries
- Managing profile

Admin users should continue using the web interface at `/admin/*` routes.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [App Architecture](#app-architecture)
3. [Design System & Theme](#design-system--theme)
4. [Authentication & User Management](#authentication--user-management)
5. [Navigation Structure](#navigation-structure)
6. [Screens Reference](#screens-reference)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Data Models & Types](#data-models--types)
10. [Backend API Reference](#backend-api-reference)
11. [Component Library](#component-library)
12. [Feature Implementation Details](#feature-implementation-details)
13. [Push Notifications](#push-notifications)
14. [App Store & Play Store Publishing](#app-store--play-store-publishing)
15. [Environment Setup](#environment-setup)

---

## Project Overview

### What is KhaaoGully?

KhaaoGully is a food delivery pooling platform designed for campus environments (specifically KIIT and KIMS universities). The app allows students to:

- Browse restaurants serving their campus
- Join "pools" to share delivery fees with other students
- Place orders with shared delivery to campus hotspots
- Track orders in real-time

### Core Concept: Order Pooling

The key differentiator is the **pooling system**:
- Orders are grouped into time-limited "pools" 
- Multiple students order from different restaurants in the same pool
- All orders are delivered together to a campus hotspot
- Delivery fees are shared/reduced per order

---

## App Architecture

### Recommended Tech Stack (Updated December 2025)

**Framework & Navigation**
- **Expo SDK 54** - Latest stable version with React Native 0.81
- **@react-navigation/native ^7.x** - Latest navigation library with static API support
- **Expo Router** (alternative) - File-based routing

**Authentication & Backend**
- **@supabase/supabase-js ^2.x** - Authentication & realtime database
- **axios ^1.x** - HTTP client for API requests
- **@tanstack/react-query ^5.x** - Server state management

**State & Storage**
- **zustand or Context API** - Client state management
- **@react-native-async-storage/async-storage ^1.x** - Simple persistent storage (preferred over MMKV for basic needs)
- **react-native-mmkv ^2.x** - High-performance storage (optional, for frequently accessed data)

**UI & Styling**
- **NativeWind or React Native StyleSheet** - Styling
- **expo-linear-gradient** - Gradient backgrounds
- **react-native-gesture-handler ~2.x** - Gesture support

**Notifications**
- **expo-notifications ^12.x** - Push notifications
- **expo-device & expo-constants** - Device detection

**Additional Dependencies**
- **@gorhom/bottom-sheet ^4.x** - Modal & bottom sheet components
- **react-native-reanimated ~3.x** - Animations
- **react-native-safe-area-context ^4.x** - Safe area handling
- **expo-secure-store ~12.x** - Secure token storage
- **expo-auth-session ~5.x** - OAuth handling
- **expo-web-browser ~12.x** - Browser integration

### Project Structure

```
src/
├── app/                    # Expo Router screens OR
├── screens/                # Screen components
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── CampusRestaurantsScreen.tsx
│   ├── pools/
│   │   ├── PoolsScreen.tsx
│   │   └── PoolDetailsScreen.tsx
│   ├── restaurant/
│   │   ├── RestaurantMenuScreen.tsx
│   │   └── RestaurantDetailsScreen.tsx
│   ├── cart/
│   │   └── CartScreen.tsx
│   ├── orders/
│   │   └── OrderTrackingScreen.tsx
│   └── profile/
│       └── ProfileScreen.tsx
├── components/
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   └── shared/             # Shared business components
├── context/
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── services/
│   ├── api.ts              # API client & endpoints
│   ├── supabase.ts         # Supabase client
│   ├── notifications.ts    # Push notifications service
│   └── promotions.ts       # Promotional banners service
├── types/
│   └── index.ts            # TypeScript interfaces
├── utils/
│   ├── datetime.ts         # Date/time helpers (IST timezone)
│   ├── tokenCache.ts       # Token management
│   └── formatters.ts       # Price/data formatters
├── hooks/
│   ├── useAuth.ts
│   └── useNotifications.ts
└── constants/
    └── theme.ts            # Design tokens
```

---

## Design System & Theme

### Color Palette

The app uses a fresh, food-focused color scheme. Use these exact colors throughout:

```typescript
// constants/theme.ts
export const colors = {
  primary: {
    DEFAULT: '#00A86B',    // Vibrant Emerald Green - main brand color
    light: '#E6F7F1',      // Mint Green - backgrounds, highlights
    dark: '#008f5d',       // Darker green for pressed states
  },
  accent: {
    DEFAULT: '#FFC107',    // Mustard/Orange - highlights, CTAs
    light: '#FFF8E1',      // Light yellow backgrounds
  },
  surface: {
    DEFAULT: '#FFFFFF',
    background: '#F3F4F6', // Light gray background
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};
```

### Design Principles

1. **Rounded corners everywhere** - Use `borderRadius: 16-24` for cards, `borderRadius: 12` for buttons
2. **Soft shadows** - Subtle, diffused shadows (`shadowOpacity: 0.05`)
3. **White cards on gray backgrounds** - Content in white cards, `#F3F4F6` background
4. **Bold, clear typography** - Use `fontWeight: 'bold'` for headings, clear hierarchy
5. **Touch targets** - Minimum 44x44px for all tappable elements
6. **Generous padding** - 16-24px padding in cards, 12-16px in buttons

---

## Authentication & User Management

### Supabase Setup (Updated 2025)

Use the official Supabase React Native approach with AsyncStorage:

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});
```

**Why AsyncStorage over Secure Store?** AsyncStorage is simpler, more reliable, and the Supabase team officially recommends it for React Native. Tokens stored in AsyncStorage are still reasonably secure for mobile apps.

### Authentication Context

```typescript
// context/AuthContext.tsx
interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  defaultCampusId: string | null;
  // Note: isAdmin is not needed in the mobile app - admin stays on web
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsPhone: boolean;
  customerProfile: CustomerProfile | null;
  needsCampusSelection: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  setDefaultCampus: (campusId: string) => Promise<{ success: boolean; error?: string }>;
  authError: string | null;
  clearAuthError: () => void;
  // Note: No isAdmin - this app is customer-only
}
```

### Email Domain Restriction

**IMPORTANT**: Only specific university email domains are allowed:

```typescript
const allowedDomains = ['kiit.ac.in', 'kims.ac.in'];

// Whitelisted emails for testing
const whitelistedEmails = [
  'test@example.com',
  'harshitmetha2004@gmail.com',
  'a2003yadav@gmail.com'
];

// Validate after Google sign-in
const validateEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1];
  const isWhitelisted = whitelistedEmails.includes(emailLower);
  const isAllowedDomain = domain && allowedDomains.includes(domain);
  return isWhitelisted || isAllowedDomain;
};
```

### Google Sign-In for React Native

Use Expo's native Google auth approach:

```typescript
// For Expo (latest approach):
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'your-app-scheme://auth-callback',
      skipBrowserRedirect: true,
    },
  });
  return { error };
};
```

### Customer Profile Flow

After authentication:
1. Check if customer exists in `customers` table
2. If not, create profile with inferred name from Google metadata
3. Check if phone is valid (10+ digits) → if not, `needsPhone = true`
4. Check if `default_campus_id` exists → if not, `needsCampusSelection = true`

Reference: `backend/app/routers/customers.py` for profile endpoints

---

## Navigation Structure

### Navigation Tree

```
Root Navigator (Stack)
├── Auth Flow (when not logged in)
│   └── LoginScreen
│
├── Main Flow (when logged in)
│   ├── Tab Navigator
│   │   ├── Home Tab
│   │   │   └── HomeScreen / CampusRestaurantsScreen
│   │   ├── Pools Tab
│   │   │   └── PoolsScreen
│   │   ├── Cart Tab
│   │   │   └── CartScreen
│   │   └── Profile Tab
│   │       └── ProfileScreen
│   │
│   └── Stack Screens (pushed over tabs)
│       ├── PoolDetailsScreen
│       ├── RestaurantMenuScreen (guest browsing)
│       ├── RestaurantDetailsScreen (in pool context)
│       └── OrderTrackingScreen
│
└── Modals
    ├── CampusSelectorModal (shown when needsCampusSelection)
    └── AuthErrorModal
```

### Deep Linking

```typescript
const linking = {
  prefixes: ['khaogully://', 'https://khaogully.com'],
  config: {
    screens: {
      Home: '',
      CampusRestaurants: 'campus/:campusId/restaurants',
      Pools: 'campus/:campusId/pools',
      PoolDetails: 'pool/:poolId',
      RestaurantMenu: 'restaurant/:restaurantId',
      RestaurantDetails: 'pool/:poolId/restaurant/:restaurantId',
      Cart: 'cart',
      OrderTracking: 'order/:orderId',
      Profile: 'profile',
    },
  },
};
```

---

## Screens Reference

### 1. Home Screen / Campus Restaurants Screen

**Path**: `/` or `/campus/:campusId/restaurants`

**Purpose**: Main landing page showing restaurants available for the user's campus

**Data Fetched**:
- `GET /campuses/` - List all campuses
- `GET /campuses/:campusId/restaurants` - Restaurants with pool info for campus
- `GET /promotions/banners/active?campus_id=X` - Promotional banners

**UI Elements**:
- Hero section with gradient background (dark gray to black)
- Search bar for restaurants/cuisines
- Promotional banner sections (horizontal scrolling cards)
- Restaurant grid with cards showing:
  - Restaurant image
  - Name
  - Rating (green badge with star)
  - Cuisine tags
  - Cost for two
  - Pool name (which pool they're in)

**Key Logic**:
```typescript
// Auto-redirect logged in users to their campus
useEffect(() => {
  if (user && customerProfile?.defaultCampusId) {
    navigate(`/campus/${customerProfile.defaultCampusId}/restaurants`);
  }
}, [user, customerProfile]);
```

### 2. Pools Screen

**Path**: `/campus/:campusId/pools`

**Purpose**: Show active/scheduled pools for a campus

**Data Fetched**:
- `GET /pools/?campusId=X` - Pools for campus
- `GET /pools/:poolId/restaurants` - Restaurants in each pool

**UI Elements**:
- Search bar
- Pool cards showing:
  - Pool name
  - Time remaining badge (red, shows `collection_end` time)
  - Restaurant tags (horizontal list)
  - Delivery fee
  - "Browse Restaurants" button

**Filter Logic**:
```typescript
// Only show open or scheduled pools
const activePools = pools.filter(p => {
  const status = (p.computed_status || p.manual_status || '').toLowerCase();
  return status === 'open' || status === 'scheduled';
});
```

### 3. Pool Details Screen

**Path**: `/pool/:poolId`

**Purpose**: Browse restaurants within a specific pool

**Data Fetched**:
- `GET /pools/:poolId` - Pool details
- `GET /pools/:poolId/restaurants` - Restaurants in pool

**UI Elements**:
- Pool header card with:
  - "Active Pool" badge
  - Countdown timer
  - Delivery location
  - Delivery fee
- Search bar with AI search button (future feature)
- Filter chips (Top Rated, Budget Friendly)
- Restaurant grid

### 4. Restaurant Menu Screen

**Path**: `/restaurant/:restaurantId` (guest) or `/pool/:poolId/restaurant/:restaurantId` (in pool)

**Purpose**: Show restaurant details and menu

**Data Fetched**:
- `GET /restaurants/:restaurantId` - Restaurant details
- `GET /restaurants/:restaurantId/menu` - Menu items (dishes)

**UI Elements**:
- Restaurant header with image, name, rating, cuisine
- Stats row (rating, delivery time, cost for two)
- Category navigation (jump to section)
- Menu sections grouped by tags
- Dish cards with:
  - Veg/Non-veg indicator (green/red dot)
  - Name, description, price
  - Image (if available)
  - Add to cart button (+/- quantity controls)

### 5. Cart Screen

**Path**: `/cart`

**Purpose**: Review cart items and checkout

**Data Fetched**:
- `GET /cart/?poolId=X` - Cart contents
- `GET /pools/:poolId` - Pool details for delivery info

**UI Elements**:
- Items grouped by restaurant
- Quantity controls (+/-)
- Special instructions (per item)
- Price breakdown:
  - Subtotal
  - Delivery fee (from pool)
  - Total
- Pool closing warning
- "Proceed to Pay" button

**Important**: Cart is tied to a specific pool. If user tries to add from different pool, show confirmation to clear cart.

### 6. Order Tracking Screen

**Path**: `/order/:orderId`

**Purpose**: Track order status after placement

**Data Fetched**:
- `GET /orders/:orderId` - Order details
- `GET /orders/group/:orderGroupId` - Related orders (multi-restaurant)

**Order Status Flow**:
```typescript
const steps = [
  { status: 'pooling', label: 'Pooling Orders', description: 'Waiting for pool to close' },
  { status: 'pending', label: 'Order Confirmed', description: 'Sent to restaurant' },
  { status: 'accepted', label: 'Order Accepted', description: 'Preparing your food' },
  { status: 'out_for_delivery', label: 'Out for Delivery', description: 'On the way' },
  { status: 'delivered', label: 'Delivered', description: 'Enjoy your meal!' },
];
```

**UI Elements**:
- Success header with checkmark
- Estimated delivery time
- Pickup location (hotspot)
- Driver details (when available)
- OTP for verification (when available)
- Order timeline/stepper
- Order summary (items, prices)

### 7. Profile Screen

**Path**: `/profile`

**Purpose**: User profile and order history

**Data Fetched**:
- `GET /profile/` - Customer profile
- `GET /orders/?limit=20` - Order history

**UI Elements**:
- Profile header with avatar
- Editable phone field (required for ordering)
- Stats (total orders, total spent)
- Order history list grouped by `orderGroupId`

---

## State Management

### Cart Context

The cart uses optimistic updates with background sync:

```typescript
// context/CartContext.tsx
interface CartContextType {
  cart: Cart;
  addToCart: (poolId: string, restaurantId: string, dish: Dish, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: (poolId?: string) => Promise<void>;
  refreshCart: (poolId: string) => Promise<void>;
  syncPendingOperations: () => Promise<void>;
  hasPendingOperations: () => boolean;
  cartTotal: number;
  itemCount: number;
  loading: boolean;
  syncing: boolean;
}
```

**Key Features**:

1. **Pool-based carts**: Cart is tied to a `poolId`. Switching pools clears cart.

2. **Optimistic updates**: UI updates immediately, syncs to backend in background

3. **Debounced sync**: Multiple rapid changes are batched (500ms debounce)

4. **Pending operations**: Track operations for offline support

```typescript
// Pending operation types
interface PendingOperation {
  type: 'add' | 'update' | 'remove';
  poolId: string;
  restaurantId: string;
  dishId: string;
  quantity: number;
  dish?: Dish;
  itemId?: string;
}

// Use Map keyed by poolId:restaurantId:dishId
const pendingOperationsRef = useRef<Map<string, PendingOperation>>(new Map());
```

### Local Storage

Store cart `poolId` for persistence using AsyncStorage:

```typescript
// React Native approach using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const getStoredPoolId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('cartPoolId');
};

const storePoolId = async (poolId: string | null) => {
  if (poolId) {
    await AsyncStorage.setItem('cartPoolId', poolId);
  } else {
    await AsyncStorage.removeItem('cartPoolId');
  }
};
```

---

## API Integration

### API Client Setup

```typescript
// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ensureAccessToken, refreshAccessToken } from '../utils/tokenCache';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await ensureAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api.request(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Token Cache Management

```typescript
// utils/tokenCache.ts
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

let accessToken: string | null = null;
let ensurePromise: Promise<string | null> | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessTokenFromSession = (session: Session | null) => {
  accessToken = session?.access_token ?? null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const ensureAccessToken = async (): Promise<string | null> => {
  if (accessToken) return accessToken;

  if (!ensurePromise) {
    ensurePromise = supabase.auth.getSession()
      .then(({ data: { session } }) => {
        accessToken = session?.access_token ?? null;
        return accessToken;
      })
      .finally(() => { ensurePromise = null; });
  }
  return ensurePromise;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session?.access_token) {
        accessToken = data.session.access_token;
        return accessToken;
      }
    } catch {}
    
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token ?? null;
    return accessToken;
  })().finally(() => { refreshPromise = null; });

  return refreshPromise;
};
```

---

## Data Models & Types

```typescript
// types/index.ts

export interface Campus {
  id: string;
  name: string;
  code: string;
  hotspotLocation: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  activePoolCount?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number;
  deliveryTime: number;
  costForTwo: number;      // In paise (divide by 100 for rupees)
  cuisine: string[];
  image: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  location?: string;
  isActive?: boolean;
}

export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;           // In paise
  image: string;
  veg: boolean;
  rating: number;
  isAvailable: boolean;
  tags?: string[];         // First tag used as category
  customizations?: any[];
}

export interface Pool {
  id: string;
  name: string;
  campus_id: string;
  campus_name?: string;
  collection_start: string;      // ISO datetime
  collection_end: string;        // ISO datetime - when pool stops accepting orders
  delivery_window: string;
  expected_delivery_time: string;
  participating_restaurants: string[];
  delivery_fee_per_order: number;  // In paise
  description?: string;
  status?: 'scheduled' | 'open' | 'closed' | 'synced';
  computed_status?: string;
  manual_status?: string;
}

export interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  dishId: string;
  dish: Dish;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Cart {
  poolId: string | null;
  items: CartItem[];
}

export interface Order {
  orderId: string;
  poolId: string;
  poolName: string;
  campusId: string;
  campusName: string;
  deliveryHotspot: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId?: string;
  restaurantName?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  deliveryWindow: string;
  driverName?: string;
  driverPhone?: string;
  otp?: string;
  orderedAt: string;
  poolClosedAt?: string;
}

export interface OrderItem {
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
  veg: boolean;
  specialInstructions?: string;
}

export interface CustomerProfileSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  referralCode?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  memberSince: string;
  walletBalance: number;
}

export interface CustomerOrderHistoryItem {
  orderId: string;
  orderGroupId?: string;   // Groups multi-restaurant orders
  poolId: string;
  poolName: string;
  restaurantName?: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;
  orderedAt: string;
  itemCount: number;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  banner_type: string;
  display_order: number;
  style_config: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
  is_active: boolean;
  campus_id?: string;
  display_layout: 'horizontal_scroll' | 'grid' | 'carousel';
}

export interface PromotedRestaurant {
  promotion_id: string;
  banner_id: string;
  banner_title: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_image?: string;
  rating: number;
  cuisine: string[];
  cost_for_two: number;
}
```

---

## Backend API Reference

### Base URL

- **Development**: `http://localhost:8000`
- **Production**: Your deployed backend URL

### Authentication

All authenticated endpoints require:
```
Authorization: Bearer <supabase_access_token>
```

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/campuses/` | GET | List all campuses |
| `/restaurants/` | GET | List all restaurants |
| `/restaurants/:id` | GET | Restaurant details |
| `/restaurants/:id/menu` | GET | Restaurant menu (dishes) |
| `/pools/` | GET | List pools (optional `?campusId=X`) |
| `/pools/:id` | GET | Pool details |
| `/pools/:id/restaurants` | GET | Restaurants in a pool |
| `/promotions/banners/active` | GET | Active promotional banners |
| `/promotions/banners/:id/restaurants` | GET | Restaurants in a banner |

### Authenticated Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/campuses/:id/restaurants` | GET | Campus restaurants with pool mapping |
| `/cart/` | GET | Get cart (`?poolId=X` required) |
| `/cart/items` | POST | Add item to cart |
| `/cart/items/:id` | PUT | Update cart item |
| `/cart/items/:id` | DELETE | Remove cart item |
| `/cart/` | DELETE | Clear cart (`?poolId=X`) |
| `/orders/` | GET | Customer order history |
| `/orders/` | POST | Create order from cart |
| `/orders/:id` | GET | Order details |
| `/orders/group/:groupId` | GET | Orders in a group |
| `/profile/` | GET | Customer profile |
| `/profile/` | PUT | Update profile |

### Backend File References

For detailed implementation, reference these backend files:

- **Cart Logic**: `backend/app/routers/cart.py`
- **Order Creation**: `backend/app/routers/orders.py`
- **Pool Management**: `backend/app/routers/pools.py`
- **Customer Profile**: `backend/app/routers/customers.py`
- **Restaurant Menu**: `backend/app/routers/restaurants.py`
- **Promotions**: `backend/app/routers/promotions.py`
- **Pricing Service**: `backend/app/services/pricing.py`
- **Data Models**: `backend/app/models/` directory

---

## Data Transformation (snake_case ↔ camelCase)

### Why Transformation is Needed

The backend API uses **snake_case** (Python convention), but the React Native app uses **camelCase** (JavaScript convention). You MUST transform data both ways:

- **API Response → App**: `pool_id` → `poolId`
- **App → API Request**: `poolId` → `pool_id`

### Transformation Utilities

```typescript
// utils/caseTransform.ts

/**
 * Convert snake_case string to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase string to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively transform object keys from snake_case to camelCase
 * Use this for ALL API responses before using in the app
 */
export const transformResponse = <T>(obj: any): T => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(transformResponse) as T;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = transformResponse(obj[key]);
      return acc;
    }, {} as any) as T;
  }
  
  return obj;
};

/**
 * Recursively transform object keys from camelCase to snake_case
 * Use this for ALL API requests before sending to backend
 */
export const transformRequest = <T>(obj: any): T => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(transformRequest) as T;
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = transformRequest(obj[key]);
      return acc;
    }, {} as any) as T;
  }
  
  return obj;
};
```

### Automatic Transformation in API Client

Add transformers to your axios interceptors:

```typescript
// services/api.ts
import { transformResponse, transformRequest } from '../utils/caseTransform';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Transform request data: camelCase → snake_case
api.interceptors.request.use(async (config) => {
  // Transform request body
  if (config.data) {
    config.data = transformRequest(config.data);
  }
  
  // Transform query params
  if (config.params) {
    config.params = transformRequest(config.params);
  }
  
  // Add auth token
  const token = await ensureAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Transform response data: snake_case → camelCase
api.interceptors.response.use(
  (response) => {
    response.data = transformResponse(response.data);
    return response;
  },
  async (error) => {
    // Transform error response too
    if (error.response?.data) {
      error.response.data = transformResponse(error.response.data);
    }
    // ... handle 401 token refresh ...
    return Promise.reject(error);
  }
);
```

### Transformation Examples

```typescript
// ❌ RAW API RESPONSE (snake_case)
{
  "pool_id": "abc-123",
  "restaurant_id": "rest-456",
  "delivery_fee_per_order": 2500,
  "collection_end": "2025-12-20T18:00:00Z",
  "participating_restaurants": ["rest-1", "rest-2"]
}

// ✅ AFTER transformResponse() (camelCase) - use this in your app
{
  "poolId": "abc-123",
  "restaurantId": "rest-456",
  "deliveryFeePerOrder": 2500,
  "collectionEnd": "2025-12-20T18:00:00Z",
  "participatingRestaurants": ["rest-1", "rest-2"]
}

// ❌ APP DATA (camelCase) - before sending
{
  "poolId": "abc-123",
  "dishId": "dish-789",
  "quantity": 2,
  "specialInstructions": "Extra spicy"
}

// ✅ AFTER transformRequest() (snake_case) - sent to API
{
  "pool_id": "abc-123",
  "dish_id": "dish-789",
  "quantity": 2,
  "special_instructions": "Extra spicy"
}
```

---

## Money & Pricing (Paise System)

### Understanding Paise

**All monetary values in the API are in PAISE (1/100 of a rupee).**

| Rupees | Paise | API Value |
|--------|-------|-----------|
| ₹1 | 100 paise | `100` |
| ₹25 | 2500 paise | `2500` |
| ₹150 | 15000 paise | `15000` |
| ₹499.50 | 49950 paise | `49950` |

### Key Rule: Never Store Rupees

```typescript
// ✅ CORRECT: All internal values in paise
interface Dish {
  price: number;  // 15000 = ₹150
}

interface Order {
  subtotal: number;     // 45000 = ₹450
  deliveryFee: number;  // 2500 = ₹25
  total: number;        // 47500 = ₹475
}

// ❌ WRONG: Don't store rupees
interface BadDish {
  price: 150;  // Confusing! Is this ₹150 or 150 paise?
}
```

### Formatting Utilities

```typescript
// utils/formatters.ts

/**
 * Convert paise to formatted rupee string for display
 * @param paise - Amount in paise (e.g., 15000)
 * @returns Formatted string (e.g., "₹150")
 */
export const formatMoney = (paise: number): string => {
  const rupees = Math.max(0, paise) / 100;
  
  // For whole numbers, don't show decimals
  if (Number.isInteger(rupees)) {
    return `₹${rupees.toFixed(0)}`;
  }
  
  // For decimals, show 2 places
  return `₹${rupees.toFixed(2)}`;
};

/**
 * Convert paise to rupees (for calculations only, not display)
 */
export const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

/**
 * Convert rupees to paise (rarely needed - API handles this)
 */
export const rupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

// Examples:
formatMoney(15000);    // "₹150"
formatMoney(2500);     // "₹25"
formatMoney(49950);    // "₹499.50"
formatMoney(0);        // "₹0"
formatMoney(-500);     // "₹0" (negative protection)
```

### API Request/Response: Always Paise

```typescript
// ✅ SENDING TO API: Send paise (or let backend calculate)
// The cart API calculates totals - you just send quantities
const addToCart = async (poolId: string, dishId: string, quantity: number) => {
  await api.post('/cart/items', {
    poolId,        // snake_case after transform
    dishId,
    quantity,      // Just the quantity - backend calculates price
  });
};

// ✅ RECEIVING FROM API: Values are in paise
const response = await api.get('/cart/', { params: { poolId } });
// response.data.items[0].price = 15000 (paise)
// response.data.subtotal = 30000 (paise)

// ✅ DISPLAYING: Convert to rupees for UI
<Text>{formatMoney(item.price)}</Text>  // Shows "₹150"
<Text>Total: {formatMoney(cart.subtotal)}</Text>  // Shows "Total: ₹300"
```

### Price Calculation (Backend Handles This)

**You do NOT calculate prices on the frontend.** The backend `pricing.py` service handles:

- Item subtotals (price × quantity)
- Delivery fees (from pool)
- Platform fees
- Taxes
- Promo code discounts
- Wallet deductions

```typescript
// ❌ WRONG: Don't calculate totals yourself
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// ✅ CORRECT: Use the total from API response
const { subtotal, deliveryFee, total } = await api.get('/cart/', { params: { poolId } });
// Display these values directly
```

---

## Error Handling

### API Error Response Structure

The backend returns errors in this format:

```typescript
// Standard error response
interface APIError {
  detail: string;           // Human-readable message
  code?: string;            // Machine-readable error code (optional)
  field?: string;           // Which field caused the error (optional)
}

// Examples of actual API error responses:
{ "detail": "Pool is closed" }
{ "detail": "Dish not available", "code": "DISH_UNAVAILABLE" }
{ "detail": "Invalid email domain. Only @kiit.ac.in and @kims.ac.in are allowed." }
{ "detail": "Cart is empty" }
{ "detail": "Phone number is required to place an order" }
```

### Error Handling Utility

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';
import { Alert } from 'react-native';

interface APIErrorResponse {
  detail: string;
  code?: string;
  field?: string;
}

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as APIErrorResponse | undefined;
    
    // Use API's detail message if available
    if (data?.detail) {
      return data.detail;
    }
    
    // Handle common HTTP status codes
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission for this action.';
      case 404:
        return 'The requested item was not found.';
      case 422:
        return 'Invalid data provided.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};

/**
 * Get error code for programmatic handling
 */
export const getErrorCode = (error: unknown): string | null => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as APIErrorResponse | undefined;
    return data?.code ?? null;
  }
  return null;
};

/**
 * Show error alert to user
 */
export const showErrorAlert = (error: unknown, title = 'Error') => {
  Alert.alert(title, getErrorMessage(error));
};

/**
 * Check if error is a specific type
 */
export const isPoolClosedError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('pool') && (message.includes('closed') || message.includes('expired'));
};

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};
```

### Error Handling in Components

```typescript
// Example: Add to cart with error handling
const handleAddToCart = async () => {
  setLoading(true);
  try {
    await addToCart(poolId, dish.id, 1);
    // Success - cart context updates automatically
  } catch (error) {
    if (isPoolClosedError(error)) {
      // Pool closed - show special modal and clear cart
      setShowPoolClosedModal(true);
      await clearCart(poolId);
    } else if (isAuthError(error)) {
      // Not logged in - redirect to login
      navigation.navigate('Login');
    } else {
      // Generic error - show alert
      showErrorAlert(error, 'Could not add item');
    }
  } finally {
    setLoading(false);
  }
};
```

### Common Error Scenarios

| Error Message | When It Occurs | How to Handle |
|---------------|----------------|---------------|
| `"Pool is closed"` | Adding to cart after pool ends | Clear cart, show modal, redirect to pools |
| `"Dish not available"` | Item out of stock | Remove from cart, show toast |
| `"Cart is empty"` | Checkout with no items | Show empty cart UI |
| `"Phone number is required"` | Checkout without phone | Redirect to profile to add phone |
| `"Invalid email domain"` | Login with non-university email | Show auth error modal |
| `"Insufficient wallet balance"` | Wallet payment fails | Show payment options |

---

## Complete Flow Examples

### Flow 1: Add Item to Cart (Optimistic Update)

```typescript
// context/CartContext.tsx - Complete add to cart flow

const addToCart = async (
  poolId: string,
  restaurantId: string,
  dish: Dish,
  quantity: number
): Promise<void> => {
  // 1. CHECK: Is this a different pool?
  if (cart.poolId && cart.poolId !== poolId && cart.items.length > 0) {
    throw new Error('DIFFERENT_POOL'); // Handle in component with confirmation modal
  }

  // 2. OPTIMISTIC UPDATE: Update UI immediately
  const tempId = `temp-${Date.now()}`;
  const optimisticItem: CartItem = {
    id: tempId,
    restaurantId,
    dishId: dish.id,
    dish,
    quantity,
    price: dish.price * quantity,
  };

  setCart((prev) => ({
    poolId,
    items: [...prev.items, optimisticItem],
  }));

  // 3. SYNC TO BACKEND
  try {
    const response = await api.post('/cart/items', {
      poolId,
      restaurantId,
      dishId: dish.id,
      quantity,
    });

    // 4. REPLACE temp item with real item from server
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === tempId
          ? { ...optimisticItem, id: response.data.id }
          : item
      ),
    }));

    // 5. PERSIST pool ID
    await AsyncStorage.setItem('cartPoolId', poolId);
  } catch (error) {
    // 6. ROLLBACK on failure
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== tempId),
    }));
    throw error; // Re-throw for component to handle
  }
};
```

### Flow 2: Complete Checkout Process

```typescript
// screens/cart/CartScreen.tsx - Full checkout flow

const handleCheckout = async () => {
  // 1. VALIDATE: Check if pool is still open
  if (!pool || isPoolClosedNow(pool)) {
    setShowPoolClosedModal(true);
    await clearCart(poolId);
    return;
  }

  // 2. VALIDATE: Check if phone exists
  if (!customerProfile?.phone || customerProfile.phone.length < 10) {
    Alert.alert(
      'Phone Required',
      'Please add your phone number to place an order.',
      [{ text: 'Add Phone', onPress: () => navigation.navigate('Profile') }]
    );
    return;
  }

  // 3. VALIDATE: Check cart not empty
  if (cart.items.length === 0) {
    Alert.alert('Empty Cart', 'Please add items before checkout.');
    return;
  }

  setCheckoutLoading(true);

  try {
    // 4. CREATE ORDER via API
    const response = await api.post('/orders/', {
      poolId: cart.poolId,
      // Backend gets cart items from cart table - no need to send items
    });

    const { orderId, orderGroupId } = response.data;

    // 5. CLEAR CART after successful order
    await clearCart(cart.poolId!);

    // 6. NAVIGATE to order tracking
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Home' },
        { name: 'OrderTracking', params: { orderId, orderGroupId } },
      ],
    });
  } catch (error) {
    if (isPoolClosedError(error)) {
      setShowPoolClosedModal(true);
      await clearCart(poolId);
    } else {
      showErrorAlert(error, 'Checkout Failed');
    }
  } finally {
    setCheckoutLoading(false);
  }
};

// Pool closed modal component
const PoolClosedModal = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Pool Closed</Text>
        <Text style={styles.modalMessage}>
          Sorry, this pool has closed and is no longer accepting orders.
          Your cart has been cleared.
        </Text>
        <Button
          title="Browse Other Pools"
          onPress={() => {
            onClose();
            navigation.navigate('Pools');
          }}
        />
      </View>
    </View>
  </Modal>
);
```

### Flow 3: Fetch Restaurant Menu with Loading States

```typescript
// screens/restaurant/RestaurantMenuScreen.tsx

const RestaurantMenuScreen = ({ route }) => {
  const { restaurantId, poolId } = route.params;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch restaurant details and menu in parallel
      const [restaurantRes, menuRes] = await Promise.all([
        api.get(`/restaurants/${restaurantId}`),
        api.get(`/restaurants/${restaurantId}/menu`),
      ]);

      setRestaurant(restaurantRes.data);
      
      // Filter only available dishes
      const availableDishes = menuRes.data.filter((dish: Dish) => dish.isAvailable);
      setDishes(availableDishes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Group dishes by category (first tag)
  const groupedDishes = useMemo(() => {
    const groups: Record<string, Dish[]> = {};
    
    dishes.forEach((dish) => {
      const category = dish.tags?.[0] || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(dish);
    });
    
    return groups;
  }, [dishes]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        message={error}
        onRetry={fetchRestaurantData}
      />
    );
  }

  return (
    <ScrollView>
      <RestaurantHeader restaurant={restaurant!} />
      
      {Object.entries(groupedDishes).map(([category, categoryDishes]) => (
        <View key={category}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {categoryDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              poolId={poolId}
              onAdd={() => handleAddToCart(dish)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};
```

### Flow 4: Order Tracking with Polling

```typescript
// screens/orders/OrderTrackingScreen.tsx

const OrderTrackingScreen = ({ route }) => {
  const { orderId, orderGroupId } = route.params;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch order on mount and poll every 30 seconds
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
        
        // If part of a group, fetch related orders
        if (orderGroupId) {
          const groupResponse = await api.get(`/orders/group/${orderGroupId}`);
          setRelatedOrders(groupResponse.data.filter((o: Order) => o.orderId !== orderId));
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchOrder();

    // Poll every 30 seconds for status updates
    const pollInterval = setInterval(fetchOrder, 30000);

    // Stop polling when order is delivered or cancelled
    return () => clearInterval(pollInterval);
  }, [orderId, orderGroupId]);

  // Stop polling when terminal state reached
  useEffect(() => {
    if (order?.orderStatus === 'delivered' || order?.orderStatus === 'cancelled') {
      // Could clear interval here if needed
    }
  }, [order?.orderStatus]);

  const statusSteps = [
    { key: 'pooling', label: 'Pooling', icon: '⏳' },
    { key: 'pending', label: 'Confirmed', icon: '✓' },
    { key: 'accepted', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'out_for_delivery', label: 'On the Way', icon: '🛵' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex((step) => step.key === order?.orderStatus) || 0;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView>
      {/* Success Header */}
      <View style={styles.successHeader}>
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.successTitle}>Order Placed!</Text>
        <Text style={styles.orderId}>Order #{order?.orderId.slice(-8)}</Text>
      </View>

      {/* Delivery Info */}
      <View style={styles.deliveryCard}>
        <Text style={styles.label}>Estimated Delivery</Text>
        <Text style={styles.value}>{formatLocalTime(order?.deliveryWindow || '')}</Text>
        <Text style={styles.label}>Pickup Location</Text>
        <Text style={styles.value}>{order?.deliveryHotspot}</Text>
        
        {order?.otp && (
          <>
            <Text style={styles.label}>Verification OTP</Text>
            <Text style={styles.otpValue}>{order.otp}</Text>
          </>
        )}
      </View>

      {/* Status Timeline */}
      <OrderStatusStepper
        steps={statusSteps}
        currentStep={getCurrentStepIndex()}
      />

      {/* Order Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {order?.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text>{item.quantity}x {item.dishName}</Text>
            <Text>{formatMoney(item.price)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatMoney(order?.total || 0)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};
```

### Flow 5: Authentication with Token Management

```typescript
// context/AuthContext.tsx - Complete auth flow

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize auth state on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get existing session from storage
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          setAccessTokenFromSession(session); // Update token cache
          
          // Validate email domain
          if (!validateEmail(session.user.email!)) {
            await supabase.auth.signOut();
            setAuthError('Only university emails (@kiit.ac.in, @kims.ac.in) are allowed.');
            return;
          }
          
          // Fetch/create customer profile
          await ensureCustomerProfile(session.user);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAccessTokenFromSession(session);

        if (event === 'SIGNED_IN' && session) {
          // Validate email domain
          if (!validateEmail(session.user.email!)) {
            await supabase.auth.signOut();
            setAuthError('Only university emails are allowed.');
            return;
          }
          
          await ensureCustomerProfile(session.user);
          
          // Register push token
          await registerPushToken(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          clearAccessToken();
          // Clear cart and other user data
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'khaogully://auth-callback',
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAccessToken();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      authError,
      signInWithGoogle,
      signOut,
      // ... other values
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Component Library

### Base UI Components to Build

**Button**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

**Card** - White card with soft shadow, rounded corners (24px), used for restaurants, pools, orders

**Badge**
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  size: 'sm' | 'md';
}
```

**Input / SearchInput** - Rounded input with icon support, search variant with icon

**Modal / BottomSheet** - Use @gorhom/bottom-sheet for campus selector, payment confirmation, pool switch warnings

**QuantitySelector** - Horizontal layout with -/+/number controls for cart items

**RestaurantCard**
```typescript
interface RestaurantCardProps {
  restaurant: Restaurant;
  poolId?: string;
  poolName?: string;
  onPress: () => void;
}
```

**DishCard**
```typescript
interface DishCardProps {
  dish: Dish;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onPress?: () => void;
}
```

**OrderStatusStepper** - Vertical timeline showing order progress with green checkmarks for completed steps

---

## Feature Implementation Details

### Pool Switching Logic

When adding from a restaurant in a different pool:

```typescript
const handleRestaurantClick = async (row: CampusRestaurantMapping) => {
  const isDifferentPool = cart.poolId && cart.poolId !== row.poolId && cart.items.length > 0;
  
  if (isDifferentPool) {
    // Show confirmation modal
    setPoolSwitchConfirm({
      fromPoolId: cart.poolId,
      fromPoolName: await getPoolName(cart.poolId),
      toPoolId: row.poolId,
      toPoolName: row.poolName,
      restaurantId: row.restaurant.id,
    });
    return;
  }
  
  navigate(`/pool/${row.poolId}/restaurant/${row.restaurant.id}`);
};

// On confirm: clear cart and proceed
const handleConfirmPoolSwitch = async () => {
  await clearCart(poolSwitchConfirm.fromPoolId);
  navigate(`/pool/${poolSwitchConfirm.toPoolId}/restaurant/${poolSwitchConfirm.restaurantId}`);
};
```

### Pool Closed Handling

Check pool status before checkout:

```typescript
const isPoolClosedNow = (pool: Pool | null): boolean => {
  if (!pool?.collection_end) return false;
  const end = new Date(pool.collection_end);
  return new Date() > end;
};

// In checkout:
if (isPoolClosedNow(pool)) {
  await clearCart(poolId);
  showPoolClosedModal();
  return;
}
```

### Order Polling

Poll for order updates every 30 seconds:

```typescript
useEffect(() => {
  const fetchOrder = async () => {
    const data = await getOrderDetails(orderId);
    setOrder(data);
  };

  fetchOrder();
  const interval = setInterval(fetchOrder, 30000);
  return () => clearInterval(interval);
}, [orderId]);
```

### Date/Time Formatting (IST)

All times should be displayed in IST (Asia/Kolkata):

```typescript
// utils/datetime.ts
export const formatLocalTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatLocalDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
```

### Price Formatting

All prices from API are in **paise** (1/100 of a rupee):

```typescript
// utils/formatters.ts
export const formatMoney = (paise: number): string => {
  return `₹${Math.max(0, paise / 100).toFixed(0)}`;
};

// Example: 25000 paise → ₹250
```

### Veg/Non-Veg Indicators

```typescript
// Green circle for veg, red circle for non-veg
<View style={[
  styles.vegIndicator,
  { borderColor: dish.veg ? '#22C55E' : '#EF4444' }
]}>
  <View style={[
    styles.vegDot,
    { backgroundColor: dish.veg ? '#22C55E' : '#EF4444' }
  ]} />
</View>
```

---

## Push Notifications

### Overview

Push notifications are essential for a food delivery app. Implement notifications for:

- **Order status updates** (confirmed, preparing, out for delivery, delivered)
- **Pool closing reminders** (15 min, 5 min before pool closes)
- **Promotional offers** (new restaurants, discounts)
- **Driver updates** (driver assigned, OTP ready)

### Recommended Setup: Expo Notifications + Backend Integration

**Install Dependencies**

```bash
npx expo install expo-notifications expo-device expo-constants
```

**Configure Notification Permissions**

```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device (not simulator)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  // Android-specific channel configuration
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00A86B',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
}
```

**Save Push Token to Backend**

```typescript
// After login, register and save token
const registerPushToken = async (userId: string) => {
  const token = await registerForPushNotificationsAsync();
  
  if (token) {
    // Save to your backend or Supabase
    await supabase
      .from('customer_push_tokens')
      .upsert({
        customer_id: userId,
        expo_push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });
  }
};
```

**Handle Incoming Notifications**

```typescript
// In your App.tsx or root component
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export function useNotificationHandler() {
  const navigation = useNavigation();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Handle notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Handle user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data.type === 'order_update' && data.orderId) {
          navigation.navigate('OrderTracking', { orderId: data.orderId });
        } else if (data.type === 'pool_reminder' && data.poolId) {
          navigation.navigate('PoolDetails', { poolId: data.poolId });
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);
}
```

### Notification Types Implementation

| Event | Title | Body | Data |
|-------|-------|------|------|
| Order confirmed | Order Confirmed! ✅ | Your order has been sent to the restaurant | `{type: "order_update", orderId}` |
| Order accepted | Preparing Your Food 👨‍🍳 | The restaurant is now preparing your order | `{type: "order_update", orderId}` |
| Out for delivery | On The Way! 🛵 | Your order is out for delivery | `{type: "order_update", orderId}` |
| Delivered | Delivered! 🎉 | Enjoy your meal! | `{type: "order_update", orderId}` |
| Pool closing soon | Pool Closing Soon ⏰ | Order now! Pool closes in 15 minutes | `{type: "pool_reminder", poolId}` |

---

## App Store & Play Store Publishing

### Pre-Publishing Requirements

**App Configuration (app.json)**

```json
{
  "expo": {
    "name": "KhaaoGully",
    "slug": "khaogully",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#00A86B"
    },
    "ios": {
      "bundleIdentifier": "com.khaogully.app",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "Used for profile photo",
        "NSPhotoLibraryUsageDescription": "Used for profile photo"
      }
    },
    "android": {
      "package": "com.khaogully.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#00A86B"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-notifications",
      ["expo-build-properties", {
        "android": {
          "compileSdkVersion": 34,
          "targetSdkVersion": 34,
          "minSdkVersion": 24
        },
        "ios": {
          "deploymentTarget": "13.4"
        }
      }]
    ]
  }
}
```

**Required Assets**

| Asset | Size | Purpose |
|-------|------|---------|
| `icon.png` | 1024×1024 | App icon (both stores) |
| `splash.png` | 1284×2778 | Splash screen |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon |
| `feature-graphic.png` | 1024×500 | Play Store feature |
| Screenshots | Various | Store listings |

### Publishing Steps

**EAS Build Setup**

```bash
npm install -g eas-cli
eas login
eas build:configure
```

**Create EAS Configuration (eas.json)**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Build and Submit for Android**

```bash
# Create production APK
eas build --platform android --profile production

# Auto-submit to Play Store
eas submit --platform android --latest
```

**Build and Submit for iOS**

```bash
# Create production build
eas build --platform ios --profile production

# Auto-submit to App Store
eas submit --platform ios --latest
```

### Store Listing Content

**App Title**: KhaaoGully - Campus Food Delivery

**Short Description**: Order food together, save on delivery! Made for KIIT & KIMS students 🍕

**Full Description**:
```
KhaaoGully is the smartest way to order food on campus!

🎯 HOW IT WORKS
• Join a "food pool" with fellow students
• Order from multiple restaurants in one go
• Share delivery fees and save money
• Pick up your food at the campus hotspot

🍔 FEATURES
• Browse restaurants serving your campus
• Join time-limited pools for group ordering
• Real-time order tracking
• Get notified when your food arrives
• Pay together, eat together!

🏫 FOR KIIT & KIMS STUDENTS
Built specifically for our campus community. Use your university email to get started!

Download now and never overpay for delivery again!
```

### Privacy Policy

Create a privacy policy covering:
- Data collection (email, phone, location)
- Data usage
- Third-party services (Supabase, Google Auth)
- Data retention
- User rights

Host at: `https://khaogully.com/privacy-policy`

---

## Environment Setup

### Required Environment Variables

```bash
# .env or app.config.js

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
EXPO_PUBLIC_API_URL=https://your-backend.com

# Google Auth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Developer Notes

### Critical Rules

| # | Rule | Details |
|---|------|---------|
| 1 | **Customer-only app** | No admin features; admin stays on web dashboard |
| 2 | **Money in paise** | Always divide by 100 for display. Use `formatMoney()` utility |
| 3 | **Pools expire** | Check `collection_end` before cart/order operations |
| 4 | **Cart is pool-scoped** | Clear cart when switching pools. Show confirmation modal |
| 5 | **Email validation** | Only `@kiit.ac.in` and `@kims.ac.in` domains allowed |
| 6 | **Phone required** | Block orders if no valid 10-digit phone |
| 7 | **Order groups** | Multi-restaurant orders share an `orderGroupId` |
| 8 | **IST timezone** | All times use `Asia/Kolkata`. Use datetime utils |
| 9 | **snake_case transform** | API uses snake_case; transform to camelCase in interceptors |
| 10 | **Push notifications** | Register token on login, handle notification taps |

### API Communication Checklist

- [ ] Transform request body: camelCase → snake_case
- [ ] Transform response body: snake_case → camelCase
- [ ] Add auth token to all authenticated requests
- [ ] Handle 401 with token refresh
- [ ] Display money using `formatMoney(paise)` not raw values
- [ ] Never calculate totals on frontend - use API values
- [ ] Check pool status before checkout
- [ ] Handle error responses with `getErrorMessage(error)`

---

## Troubleshooting

### Common Issues & Solutions

**Issue: "Pool is closed" error on checkout**
```typescript
// Solution: Check pool status before operations
if (isPoolClosedNow(pool)) {
  await clearCart(poolId);
  showPoolClosedModal();
}
```

**Issue: Cart items disappear on app restart**
```typescript
// Solution: Store poolId and refresh cart on mount
useEffect(() => {
  const init = async () => {
    const storedPoolId = await AsyncStorage.getItem('cartPoolId');
    if (storedPoolId) {
      await refreshCart(storedPoolId);
    }
  };
  init();
}, []);
```

**Issue: Prices showing as large numbers (e.g., 15000 instead of ₹150)**
```typescript
// Problem: Displaying paise directly
<Text>{item.price}</Text>  // Shows 15000

// Solution: Use formatMoney
<Text>{formatMoney(item.price)}</Text>  // Shows ₹150
```

**Issue: API returns snake_case but TypeScript expects camelCase**
```typescript
// Solution: Ensure transformResponse is in axios interceptor
api.interceptors.response.use((response) => {
  response.data = transformResponse(response.data);
  return response;
});
```

**Issue: Token expired during long session**
```typescript
// Solution: Token refresh is automatic via interceptor
// If still failing, force refresh:
const token = await refreshAccessToken();
```

**Issue: Push notifications not working on simulator**
```typescript
// Solution: Push notifications only work on physical devices
if (!Device.isDevice) {
  console.log('Push notifications require a physical device');
  return null;
}
```

---

## Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup & Auth | 1 week | Expo setup, Supabase, Google auth, navigation |
| Core Screens | 2-3 weeks | Home, Pools, Restaurant, Cart, Orders, Profile |
| Polish & Testing | 1 week | UI polish, bug fixes, testing on devices |
| Notifications | 3-4 days | Push notification integration |
| Store Prep | 1 week | Assets, store listings, privacy policy |
| Review Process | 1-2 weeks | App store review (varies) |

**Total: ~6-8 weeks to production**

---

## Latest Technology Updates (December 2025)

**Updated Recommendations:**

- **Expo SDK 54** is current stable (includes React Native 0.81, final version supporting Old Architecture)
- **React Navigation 7.0+** now available with improved static API and screen preloading
- **AsyncStorage** is officially recommended for React Native token storage (simpler, more reliable than Secure Store)
- **React Native 0.82** released in October 2025 as first entirely New Architecture version
- **MMKV** is still supported for high-performance use cases but AsyncStorage is preferred for this app's needs

All code examples and dependencies in this documentation are current as of December 2025.

---

*This documentation reflects the current best practices for React Native development with Expo SDK 54, React Navigation 7.0, and the latest Supabase React Native integration patterns as of December 2025. For backend architecture questions, reference the files in `backend/app/` directory.*