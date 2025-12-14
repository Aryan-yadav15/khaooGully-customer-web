import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { Campus, Pool, Restaurant, Dish, Order, CartSummaryResponse, AdminPoolOrder, CustomerProfileSummary, CustomerOrderHistoryItem } from '../types';
import { ensureAccessToken, refreshAccessToken } from '../lib/tokenCache';

const API_URL = 'http://localhost:8000';

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
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const token = await refreshAccessToken();
      if (token) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api.request(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export const getCampuses = async (): Promise<Campus[]> => {
  const response = await api.get('/campuses/');
  return response.data.data || response.data;
};

export const getPools = async (campusId?: string): Promise<Pool[]> => {
  const params = campusId ? { campusId } : {};
  const response = await api.get('/pools/', { params });
  return response.data.data || response.data;
};

export const getPoolDetails = async (id: string): Promise<Pool> => {
  const response = await api.get(`/pools/${id}`);
  return response.data.data || response.data;
};

export const getPoolRestaurants = async (poolId: string): Promise<Restaurant[]> => {
  // Backend returns PoolRestaurantResponse, need to fetch full restaurant details
  const response = await api.get(`/pools/${poolId}/restaurants`);
  const poolRestaurants = response.data.data || response.data;
  
  // Fetch full restaurant details for each restaurant in the pool
  const restaurantPromises = poolRestaurants
    .map((pr: any) => pr?.restaurant_id ?? pr?.restaurantId)
    .filter((id: any) => typeof id === 'string' && id.length > 0 && id !== 'undefined')
    .map((restaurantId: string) => getRestaurantDetails(restaurantId));
  
  return Promise.all(restaurantPromises);
};

export const getRestaurantDetails = async (id: string): Promise<Restaurant> => {
  const response = await api.get(`/restaurants/${id}`);
  return response.data.data || response.data;
};

export const getRestaurantMenu = async (id: string): Promise<Dish[]> => {
  const response = await api.get(`/restaurants/${id}/menu`);
  return response.data.data || response.data;
};

export const getRestaurants = async (): Promise<Restaurant[]> => {
  const response = await api.get('/restaurants/');
  return response.data.data || response.data;
};

export const createOrder = async (orderData: any): Promise<Order> => {
  const response = await api.post('/orders/', orderData);
  return response.data.data || response.data;
};

export const getOrderDetails = async (id: string): Promise<Order> => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data || response.data;
};

export const getCustomerProfile = async (): Promise<CustomerProfileSummary> => {
  const response = await api.get('/profile/');
  return response.data.data || response.data;
};

export const updateCustomerProfile = async (profileUpdate: { phone?: string; fullName?: string; email?: string }) => {
  const response = await api.put('/profile/', profileUpdate);
  return response.data.data || response.data;
};

export const getCustomerOrders = async (limit = 20, offset = 0): Promise<CustomerOrderHistoryItem[]> => {
  const response = await api.get('/orders/', { params: { limit, offset } });
  return response.data.data || response.data;
};

// Cart API functions
export const addToCart = async (poolId: string, restaurantId: string, dishId: string, quantity: number, specialInstructions?: string) => {
  const response = await api.post('/cart/items', {
    poolId,
    restaurantId,
    dishId,
    quantity,
    specialInstructions
  });
  return response.data;
};

export const getCart = async (poolId: string): Promise<CartSummaryResponse> => {
  const response = await api.get(`/cart/?poolId=${poolId}`);
  return response.data;
};

export const updateCartItem = async (itemId: string, quantity: number, specialInstructions?: string) => {
  const response = await api.put(`/cart/items/${itemId}`, {
    quantity,
    specialInstructions
  });
  return response.data;
};

export const removeCartItem = async (itemId: string) => {
  await api.delete(`/cart/items/${itemId}`);
};

export const clearCart = async (poolId: string) => {
  await api.delete(`/cart/?poolId=${poolId}`);
};

// Admin API functions
export const admin = {
  // Campus Management
  createCampus: async (campusData: any) => {
    const response = await api.post('/admin/campuses', campusData);
    return response.data;
  },
  updateCampus: async (campusId: string, campusData: any) => {
    const response = await api.put(`/admin/campuses/${campusId}`, campusData);
    return response.data;
  },
  
  // Restaurant Management
  createRestaurant: async (restaurantData: any) => {
    const response = await api.post('/admin/restaurants', restaurantData);
    return response.data;
  },
  updateRestaurant: async (restaurantId: string, restaurantData: any) => {
    const response = await api.put(`/admin/restaurants/${restaurantId}`, restaurantData);
    return response.data;
  },
  deleteRestaurant: async (restaurantId: string) => {
    await api.delete(`/admin/restaurants/${restaurantId}`);
  },
  
  // Dish Management
  createDish: async (dishData: any) => {
    const response = await api.post('/admin/dishes', dishData);
    return response.data;
  },
  updateDish: async (dishId: string, dishData: any) => {
    const response = await api.put(`/admin/dishes/${dishId}`, dishData);
    return response.data;
  },
  
  // Pool Management
  createPool: async (poolData: any) => {
    const response = await api.post('/admin/pools', poolData);
    return response.data;
  },
  updatePool: async (poolId: string, poolData: any) => {
    const response = await api.put(`/admin/pools/${poolId}`, poolData);
    return response.data;
  },
  closePool: async (poolId: string) => {
    const response = await api.post(`/admin/pools/${poolId}/close`);
    return response.data;
  },
  deletePool: async (poolId: string) => {
    await api.delete(`/admin/pools/${poolId}`);
  },
  getPoolOrders: async (poolId: string): Promise<AdminPoolOrder[]> => {
    const response = await api.get(`/admin/pools/${poolId}/orders`);
    return response.data.data || response.data;
  },
};

export default api;
