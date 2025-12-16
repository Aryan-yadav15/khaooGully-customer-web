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
  syncPendingOperations: () => Promise<void>;
  hasPendingOperations: () => boolean;
  cartTotal: number;
  itemCount: number;
  loading: boolean;
  syncing: boolean;
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

// Pending operation types
interface PendingOperation {
  type: 'add' | 'update' | 'remove';
  poolId: string;
  restaurantId: string;
  dishId: string;
  quantity: number;
  dish?: Dish;
  restaurantName?: string;
  itemId?: string;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ poolId: getStoredPoolId(), items: [] });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();

  const refreshInFlightRef = useRef<{ poolId: string; promise: Promise<void> } | null>(null);
  const pendingOperationsRef = useRef<Map<string, PendingOperation>>(new Map());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSyncRef = useRef<Promise<void> | null>(null);

  const makeDesiredKey = (poolId: string, restaurantId: string, dishId: string) => `${poolId}:${restaurantId}:${dishId}`;

  // Check if there are pending operations
  const hasPendingOperations = useCallback(() => {
    return pendingOperationsRef.current.size > 0;
  }, []);

  // Sync all pending operations to backend
  const syncPendingOperations = useCallback(async () => {
    if (!user) return;
    
    // If already syncing, wait for that to complete
    if (inFlightSyncRef.current) {
      return inFlightSyncRef.current;
    }

    const operations = Array.from(pendingOperationsRef.current.values());
    if (operations.length === 0) return;

    console.log(`[CartSync] Starting sync of ${operations.length} operations`);

    const syncPromise = (async () => {
      setSyncing(true);
      const errors: string[] = [];

      try {
        // Group operations by dish (to combine multiple adds of same item)
        const consolidatedOps = new Map<string, PendingOperation>();
        
        for (const op of operations) {
          const key = makeDesiredKey(op.poolId, op.restaurantId, op.dishId);
          const existing = consolidatedOps.get(key);
          
          if (!existing || op.type === 'remove') {
            consolidatedOps.set(key, op);
          } else if (op.type === 'add' && existing.type === 'add') {
            // Combine multiple adds of same item
            consolidatedOps.set(key, { ...existing, quantity: existing.quantity + op.quantity });
          } else if (op.type === 'update') {
            // Update takes precedence
            consolidatedOps.set(key, op);
          }
        }

        console.log(`[CartSync] Consolidated to ${consolidatedOps.size} operations`);

        // Execute all operations in parallel
        const promises = [];
        for (const [key, op] of consolidatedOps) {
          const promise = (async () => {
            try {
              console.log(`[CartSync] Syncing ${op.type} for dish ${op.dishId}, qty: ${op.quantity}`);
              
              if (op.type === 'add' && op.dish) {
                await api.addToCart(op.poolId, op.restaurantId, op.dishId, op.quantity);
                console.log(`[CartSync] ✓ Added ${op.dishId}`);
              } else if (op.type === 'update') {
                if (op.itemId) {
                  // Real item - update or remove via API
                  if (op.quantity <= 0) {
                    await api.removeCartItem(op.itemId);
                    console.log(`[CartSync] ✓ Removed ${op.itemId}`);
                  } else {
                    await api.updateCartItem(op.itemId, op.quantity);
                    console.log(`[CartSync] ✓ Updated ${op.itemId}`);
                  }
                } else if (op.dish && op.quantity > 0) {
                  // Temp item being updated - treat as add with final quantity
                  await api.addToCart(op.poolId, op.restaurantId, op.dishId, op.quantity);
                  console.log(`[CartSync] ✓ Added (from temp update) ${op.dishId}`);
                }
                // If temp item with quantity <= 0, nothing to sync (never existed on backend)
              } else if (op.type === 'remove') {
                if (op.itemId) {
                  await api.removeCartItem(op.itemId);
                  console.log(`[CartSync] ✓ Removed ${op.itemId}`);
                }
                // If temp item being removed, nothing to sync (never existed on backend)
              }
              
              // Remove from pending after successful sync
              pendingOperationsRef.current.delete(key);
            } catch (error) {
              console.error(`[CartSync] ✗ Failed to sync ${key}:`, error);
              errors.push(key);
            }
          })();
          promises.push(promise);
        }

        // Wait for ALL operations to complete before refreshing
        console.log(`[CartSync] Waiting for ${promises.length} promises...`);
        await Promise.all(promises);
        console.log(`[CartSync] All operations completed`);

        // Small delay to ensure backend has fully processed
        await new Promise(resolve => setTimeout(resolve, 200));

        // Refresh cart to get the final state from server
        if (cart.poolId) {
          console.log(`[CartSync] Refreshing cart...`);
          await refreshCart(cart.poolId);
          console.log(`[CartSync] Cart refreshed successfully`);
        }

        if (errors.length > 0) {
          console.warn('[CartSync] Some operations failed:', errors);
        }
      } finally {
        setSyncing(false);
        inFlightSyncRef.current = null;
      }
    })();

    inFlightSyncRef.current = syncPromise;
    return syncPromise;
  }, [user, cart.poolId]);

  // Debounced sync - triggers sync 500ms after last operation
  const scheduleSync = useCallback((immediate = false) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    if (immediate) {
      void syncPendingOperations();
    } else {
      syncTimerRef.current = setTimeout(() => {
        void syncPendingOperations();
      }, 500);
    }
  }, [syncPendingOperations]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Load cart from API on mount if poolId exists
  useEffect(() => {
    const loadCart = async () => {
      if (user && cart.poolId && cart.items.length === 0) {
        // Sync any pending operations first
        if (hasPendingOperations()) {
          await syncPendingOperations();
        }
        await refreshCart(cart.poolId);
      }
    };
    void loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshCart = useCallback(async (poolId: string) => {
    if (!user) return;

    // Don't refresh while sync is in progress to avoid race conditions
    if (inFlightSyncRef.current) {
      console.log('[RefreshCart] Skipping refresh - sync in progress');
      return;
    }

    const inFlight = refreshInFlightRef.current;
    if (inFlight && inFlight.poolId === poolId) {
      return inFlight.promise;
    }

    const promise = (async () => {
      try {
        setLoading(true);
        console.log('[RefreshCart] Fetching cart from backend...');
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

        console.log('[RefreshCart] Setting cart with', transformedCart.items.length, 'items');
        setCart(transformedCart);
        storePoolId(poolId);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Cart not found, initialize empty
          console.log('[RefreshCart] Cart not found (404), initializing empty');
          setCart({ poolId: poolId, items: [] });
          storePoolId(poolId);
        } else {
          console.error('[RefreshCart] Failed to refresh cart', error);
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
      // Sync pending operations before clearing
      await syncPendingOperations();
      await clearCart(cart.poolId);
    }

    const desiredKey = makeDesiredKey(poolId, restaurantId, dish.id);

    // Optimistic local update - instant UI feedback
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.dishId === dish.id && item.restaurantId === restaurantId
      );

      if (existingIndex >= 0) {
        const nextItems = prev.items.map((item, idx) => {
          if (idx !== existingIndex) return item;
          return { ...item, quantity: item.quantity + quantity };
        });
        return { poolId, items: nextItems };
      }

      // New item - create with temp ID
      const tempId = `temp-${Date.now()}-${dish.id}`;
      return {
        poolId,
        items: [
          ...prev.items,
          {
            id: tempId,
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

    // Add to pending operations queue
    const pendingOp: PendingOperation = {
      type: 'add',
      poolId,
      restaurantId,
      dishId: dish.id,
      quantity,
      dish,
      restaurantName
    };
    pendingOperationsRef.current.set(desiredKey, pendingOp);

    // Schedule debounced sync
    scheduleSync();

    // No immediate API call - operations are queued and synced via debounce
  };

  const removeFromCart = async (itemId: string) => {
    if (!user || !cart.poolId) return;

    const existing = cart.items.find((it) => it.id === itemId);
    if (!existing) return;

    // Optimistic remove
    setCart((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }));

    const desiredKey = makeDesiredKey(cart.poolId, existing.restaurantId, existing.dishId);
    
    // Queue remove operation
    const pendingOp: PendingOperation = {
      type: 'remove',
      poolId: cart.poolId,
      restaurantId: existing.restaurantId,
      dishId: existing.dishId,
      quantity: 0,
      itemId: itemId.startsWith('temp-') ? undefined : itemId
    };
    pendingOperationsRef.current.set(desiredKey, pendingOp);

    // Schedule debounced sync
    scheduleSync();
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

    // Queue update operation - include dish for temp items that need to sync as 'add'
    const isTempItem = itemId.startsWith('temp-');
    const pendingOp: PendingOperation = {
      type: quantity <= 0 ? 'remove' : 'update',
      poolId: cart.poolId,
      restaurantId: existing.restaurantId,
      dishId: existing.dishId,
      quantity,
      itemId: isTempItem ? undefined : itemId,
      dish: isTempItem ? existing.dish : undefined,
      restaurantName: isTempItem ? existing.restaurantName : undefined
    };
    pendingOperationsRef.current.set(desiredKey, pendingOp);

    // Schedule debounced sync
    scheduleSync();
  };

  const clearCart = async (poolId?: string) => {
    if (!user) return;
    
    const targetPoolId = poolId || cart.poolId;
    if (!targetPoolId) return;

    // Sync pending operations before clearing
    if (hasPendingOperations()) {
      await syncPendingOperations();
    }

    try {
      setLoading(true);
      await api.clearCart(targetPoolId);
      setCart({ poolId: null, items: [] });
      storePoolId(null);
      pendingOperationsRef.current.clear();
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
      syncPendingOperations,
      hasPendingOperations,
      cartTotal, 
      itemCount,
      loading,
      syncing
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
