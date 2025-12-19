import { createContext } from 'react';
import type { Cart, Dish } from '../types';

export interface CartContextType {
  cart: Cart;
  addToCart: (poolId: string, restaurantId: string, dish: Dish, quantity: number, restaurantName?: string) => Promise<void>;
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

export const CartContext = createContext<CartContextType | undefined>(undefined);
