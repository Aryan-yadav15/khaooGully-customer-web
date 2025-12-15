import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Cart, Dish } from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  addToCart: (poolId: string, restaurantId: string, dish: Dish, quantity: number, restaurantName?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: (poolId?: string) => Promise<void>;
  refreshCart: (poolId: string) => Promise<void>;
  cartTotal: number;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get poolId from localStorage
const getStoredPoolId = (): string | null => {
  try {
    return localStorage.getItem('cartPoolId');
  } catch {
    return null;
  }
};

// Helper to store poolId to localStorage
const storePoolId = (poolId: string | null) => {
  try {
    if (poolId) {
      localStorage.setItem('cartPoolId', poolId);
    } else {
      localStorage.removeItem('cartPoolId');
    }
  } catch {
    // Ignore storage errors
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ poolId: getStoredPoolId(), items: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshInFlightRef = useRef<{ poolId: string; promise: Promise<void> } | null>(null);
  const desiredQuantityRef = useRef<Record<string, number>>({});

  const makeDesiredKey = (poolId: string, restaurantId: string, dishId: string) => `${poolId}:${restaurantId}:${dishId}`;

  // Load cart from API on mount if poolId exists
  useEffect(() => {
    if (user && cart.poolId && cart.items.length === 0) {
      refreshCart(cart.poolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshCart = useCallback(async (poolId: string) => {
    if (!user) return;

    const inFlight = refreshInFlightRef.current;
    if (inFlight && inFlight.poolId === poolId) {
      return inFlight.promise;
    }

    const promise = (async () => {
      try {
        setLoading(true);
        const cartData = await api.getCart(poolId);

        // Transform backend response to frontend Cart structure
        const transformedCart: Cart = {
          poolId: poolId,
          items: cartData.items?.map((item: any) => ({
            id: item.id,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName ?? item.restaurant_name,
            dishId: item.dishId,
            dish: {
              id: item.dishId,
              name: item.dishName,
              price: item.price,
              image: item.dishImage,
              veg: item.veg,
              restaurantId: item.restaurantId,
              description: '',
              rating: 0,
              isAvailable: true
            },
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions
          })) || []
        };

        setCart(transformedCart);
        storePoolId(poolId);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Cart not found, initialize empty
          setCart({ poolId: poolId, items: [] });
          storePoolId(poolId);
        } else {
          console.error('Failed to refresh cart', error);
        }
      } finally {
        setLoading(false);
        if (refreshInFlightRef.current?.poolId === poolId) {
          refreshInFlightRef.current = null;
        }
      }
    })();

    refreshInFlightRef.current = { poolId, promise };
    return promise;
  }, [user]);

  const addToCart = async (poolId: string, restaurantId: string, dish: Dish, quantity: number, restaurantName?: string) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    // Enforce: max 3 distinct restaurants per cart (frontend-only)
    const distinctRestaurants = new Set(cart.items.map((i) => i.restaurantId));
    const addingNewRestaurant = !distinctRestaurants.has(restaurantId);
    if (addingNewRestaurant && distinctRestaurants.size >= 3) {
      alert('You can add items from up to 3 restaurants in a single pool.');
      return;
    }

    // Check if switching pools
    if (cart.poolId && cart.poolId !== poolId && cart.items.length > 0) {
      await clearCart(cart.poolId);
    }

    const desiredKey = makeDesiredKey(poolId, restaurantId, dish.id);

    // Optimistic local update so UI/badge updates instantly
    let optimisticTempId: string | null = null;
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.dishId === dish.id && item.restaurantId === restaurantId
      );

      if (existingIndex >= 0) {
        const nextItems = prev.items.map((item, idx) => {
          if (idx !== existingIndex) return item;
          return { ...item, quantity: item.quantity + quantity };
        });
        const newQuantity = nextItems[existingIndex].quantity;
        desiredQuantityRef.current[desiredKey] = newQuantity;

        return { poolId, items: nextItems };
      }

      optimisticTempId = `temp-${Date.now()}-${dish.id}`;
      desiredQuantityRef.current[desiredKey] = quantity;

      return {
        poolId,
        items: [
          ...prev.items,
          {
            id: optimisticTempId,
            restaurantId,
            restaurantName,
            dishId: dish.id,
            dish,
            quantity,
            price: dish.price,
          },
        ],
      };
    });
    storePoolId(poolId);

    try {
      setLoading(true);
      const created: any = await api.addToCart(poolId, restaurantId, dish.id, quantity);

      // Replace temp id (if any) and sync quantity/price from server response
      setCart((prev) => {
        const idx = prev.items.findIndex((item) => item.dishId === dish.id && item.restaurantId === restaurantId);
        if (idx < 0) return prev;

        const nextItems = prev.items.map((item, i) => {
          if (i !== idx) return item;
          return {
            ...item,
            id: typeof created?.id === 'string' ? created.id : item.id,
            quantity: typeof created?.quantity === 'number' ? created.quantity : item.quantity,
            price: typeof created?.price === 'number' ? created.price : item.price,
            specialInstructions: created?.specialInstructions ?? item.specialInstructions,
          };
        });
        return { ...prev, poolId, items: nextItems };
      });

      // If user changed quantity while the item was still pending, reconcile once.
      const desired = desiredQuantityRef.current[desiredKey];
      if (typeof desired === 'number' && typeof created?.id === 'string') {
        if (desired !== created.quantity) {
          try {
            if (desired <= 0) {
              await api.removeCartItem(created.id);
              setCart((prev) => ({
                ...prev,
                items: prev.items.filter((it) => it.id !== created.id),
              }));
            } else {
              const updated: any = await api.updateCartItem(created.id, desired);
              setCart((prev) => {
                const idx = prev.items.findIndex((it) => it.id === created.id);
                if (idx < 0) return prev;
                const nextItems = prev.items.map((it, i) => {
                  if (i !== idx) return it;
                  return {
                    ...it,
                    quantity: typeof updated?.quantity === 'number' ? updated.quantity : desired,
                    price: typeof updated?.price === 'number' ? updated.price : it.price,
                    specialInstructions: updated?.specialInstructions ?? it.specialInstructions,
                  };
                });
                return { ...prev, items: nextItems };
              });
            }
          } catch (err) {
            console.error('Failed to reconcile pending cart quantity', err);
          }
        }
        delete desiredQuantityRef.current[desiredKey];
      }
    } catch (error) {
      console.error('Failed to add to cart', error);

      // Roll back just this change
      setCart((prev) => {
        const idx = prev.items.findIndex((item) => item.dishId === dish.id && item.restaurantId === restaurantId);
        if (idx < 0) return prev;

        const item = prev.items[idx];
        if (item.id && item.id.startsWith('temp-')) {
          return { ...prev, items: prev.items.filter((it) => it.id !== item.id) };
        }

        const nextQty = item.quantity - quantity;
        if (nextQty <= 0) {
          return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
        }

        const nextItems = prev.items.map((it, i) => (i === idx ? { ...it, quantity: nextQty } : it));
        return { ...prev, items: nextItems };
      });
      delete desiredQuantityRef.current[desiredKey];
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user || !cart.poolId) return;

    const existing = cart.items.find((it) => it.id === itemId);
    if (!existing) return;

    // Optimistic remove
    setCart((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }));

    // If this was a temp item, just remember the intent; addToCart reconciliation will clean up server.
    if (itemId.startsWith('temp-')) {
      desiredQuantityRef.current[makeDesiredKey(cart.poolId, existing.restaurantId, existing.dishId)] = 0;
      return;
    }

    try {
      setLoading(true);
      await api.removeCartItem(itemId);
    } catch (error) {
      console.error('Failed to remove from cart', error);
      // Rollback
      setCart((prev) => ({ ...prev, items: [...prev.items, existing] }));
      alert('Failed to remove item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user || !cart.poolId) return;

    const existing = cart.items.find((it) => it.id === itemId);
    if (!existing) return;

    const desiredKey = makeDesiredKey(cart.poolId, existing.restaurantId, existing.dishId);

    // Optimistic update
    if (quantity <= 0) {
      setCart((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }));
    } else {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === itemId ? { ...it, quantity } : it)),
      }));
    }

    // If item is still pending (temp id), just record desired quantity; addToCart will reconcile once it gets a real id.
    if (itemId.startsWith('temp-')) {
      desiredQuantityRef.current[desiredKey] = quantity;
      return;
    }

    try {
      setLoading(true);
      if (quantity <= 0) {
        await api.removeCartItem(itemId);
        return;
      }

      const updated: any = await api.updateCartItem(itemId, quantity);
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            quantity: typeof updated?.quantity === 'number' ? updated.quantity : quantity,
            price: typeof updated?.price === 'number' ? updated.price : it.price,
            specialInstructions: updated?.specialInstructions ?? it.specialInstructions,
          };
        }),
      }));
    } catch (error) {
      console.error('Failed to update quantity', error);
      // Rollback
      setCart((prev) => ({
        ...prev,
        items: quantity <= 0
          ? [...prev.items, existing]
          : prev.items.map((it) => (it.id === itemId ? existing : it)),
      }));
      alert('Failed to update quantity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async (poolId?: string) => {
    if (!user) return;
    
    const targetPoolId = poolId || cart.poolId;
    if (!targetPoolId) return;

    try {
      setLoading(true);
      await api.clearCart(targetPoolId);
      setCart({ poolId: null, items: [] });
      storePoolId(null);
    } catch (error) {
      console.error('Failed to clear cart', error);
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      refreshCart,
      cartTotal, 
      itemCount,
      loading 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
