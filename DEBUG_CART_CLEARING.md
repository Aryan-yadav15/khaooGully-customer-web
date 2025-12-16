# Cart Clearing Issue - Debugging Guide

## Root Cause
The cart appears to clear because of a **race condition** between:
1. Optimistic UI updates (instant)
2. Pending operation sync (debounced 500ms)
3. Cart refresh calls (immediate)

## The Problem Flow

1. User adds item to cart → Optimistic update shows item instantly
2. Operation queued in `pendingOperationsRef`
3. Cart page loads → `useEffect` fires
4. `syncOnLoad()` called but NOT awaited
5. `refreshCart()` called IMMEDIATELY (before sync completes)
6. Backend still has old data (because sync hasn't finished)
7. Cart state gets overwritten with old data → Cart appears "cleared"

## Evidence from Logs

```
INFO: 127.0.0.1 - "GET /cart/?poolId=..." 200 OK  ← Multiple rapid GET requests
```

These rapid GET requests are the `refreshCart()` calls happening while sync is still in progress.

Frontend console shows:
```
[CartSync] Starting sync of 1 operations
[CartSync] Refreshing cart...
[CartSync] Cart refreshed successfully
```

The sync completes, but by then another `refreshCart()` may have already overwritten the state.

## Solution Options

### Option 1: Await sync before refresh (Recommended)
Make sure `refreshCart` only happens AFTER pending operations complete:

```tsx
useEffect(() => {
  if (!cart.poolId) return;

  const syncAndRefresh = async () => {
    // Wait for sync to complete FIRST
    if (hasPendingOperations()) {
      await syncPendingOperations();
    }
    
    // Then check if refresh is needed
    const hasMissingRestaurantName = cart.items.some((it) => !(it.restaurantName || '').trim());
    if (hasMissingRestaurantName) {
      await refreshCart(cart.poolId);
    }
  };
  
  void syncAndRefresh();
}, [cart.poolId, refreshCart, hasPendingOperations, syncPendingOperations]);
```

### Option 2: Don't refresh if syncing
Add a check to prevent refresh during sync:

```tsx
const hasMissingRestaurantName = cart.items.some((it) => !(it.restaurantName || '').trim());
if (hasMissingRestaurantName && !syncing && !hasPendingOperations()) {
  void refreshCart(cart.poolId);
}
```

### Option 3: Increase debounce timing
If users navigate to cart quickly after adding items, 500ms might not be enough. Consider:
- Immediate sync when navigating to cart
- Or increase debounce to 300ms

## Testing Steps

1. **Add console logs to track timing:**
   ```tsx
   console.log('[DEBUG] Syncing pending ops...', hasPendingOperations());
   console.log('[DEBUG] About to refresh cart');
   console.log('[DEBUG] Refresh complete, items:', cart.items.length);
   ```

2. **Test rapid operations:**
   - Add item to cart
   - Immediately click cart icon (within 500ms)
   - Check if cart appears empty or refreshes correctly

3. **Check network timing:**
   - Open DevTools → Network tab
   - Watch the sequence of POST/PUT/GET requests
   - Verify GET (refresh) happens AFTER POST/PUT (sync)

## Additional Monitoring

Add these console logs to CartContext.tsx:

```tsx
// In refreshCart function
console.log('[RefreshCart] Starting refresh, pending ops:', pendingOperationsRef.current.size);

// In syncPendingOperations
console.log('[Sync] Starting, operations:', pendingOperationsRef.current.size);
console.log('[Sync] Complete, remaining:', pendingOperationsRef.current.size);
```

This will show if refreshes are happening while operations are still pending.
