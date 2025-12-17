export interface Campus {
  id: string;
  name: string;
  code: string;
  hotspotLocation: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  activePoolCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PoolRestaurantListItem {
  pool_id: string;
  pool_name: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_active: boolean;
  active_in_pool: boolean;
  added_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number;
  deliveryTime: number;
  costForTwo: number;
  cuisine: string[];
  image: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  location?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  veg: boolean;
  rating: number;
  isAvailable: boolean;
  tags?: string[];
  customizations?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Pool {
  id: string;
  name: string;
  campus_id: string;
  campus_name?: string;
  collection_start: string;
  collection_end: string;
  delivery_window: string;
  expected_delivery_time: string;
  participating_restaurants: string[];
  delivery_fee_per_order: number;
  description?: string;
  status?: 'scheduled' | 'open' | 'closed' | 'synced';
  computed_status?: string;
  manual_status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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

// Backend cart summary response
export interface CartApiItem {
  id: string;
  cartId: string;
  restaurantId: string;
  dishId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  dishName: string;
  dishImage?: string;
  veg: boolean;
  restaurantName: string;
}

export interface CartSummaryResponse {
  cartId: string;
  customerId: string;
  poolId: string;
  poolName: string;
  campusId: string;
  restaurantCount: number;
  itemCount: number;
  totalQuantity: number;
  cartSubtotal: number;
  deliveryFeePerOrder: number;
  items: CartApiItem[];
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
  customerEmail: string;
  deliveryAddress: any;
  restaurantId?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  total: number;
  promoCode?: string;
  specialInstructions?: string;
  paymentStatus: string;
  paymentId?: string;
  orderStatus: string;
  syncedToFleetbase: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  deliveredAt?: string;
  driverName?: string;
  driverPhone?: string;
  otp?: string;
  deliveryWindow: string;
  fleetbasePoolId?: string;
  orderedAt: string;
  updatedAt: string;
}

export interface AdminPoolOrder {
  orderId: string;
  poolId: string;
  poolName?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  restaurantId?: string;
  restaurantName?: string;
  items?: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    price: number;
    veg: boolean;
    specialInstructions?: string;
  }>;
  subtotal?: number;
  deliveryFee?: number;
  platformFee?: number;
  taxes?: number;
  discount?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  orderedAt?: string;
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
  favoriteRestaurantsCount: number;
  favoriteDishesCount: number;
  savedAddressesCount: number;
}

export interface CustomerOrderHistoryItem {
  customerId: string;
  orderId: string;
  orderGroupId?: string;
  poolId: string;
  poolName: string;
  restaurantId?: string;
  restaurantName?: string;
  restaurantImage?: string;
  items: any[];
  total: number;
  status: string;
  paymentStatus: string;
  orderedAt: string;
  deliveredAt?: string;
  itemCount: number;
}
