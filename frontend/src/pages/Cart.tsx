import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ArrowLeft, Clock, Truck, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder, getPoolDetails } from '../services/api';
import type { Pool } from '../types';
import { formatLocalTime } from '../utils/datetime';

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart, loading, refreshCart, syncPendingOperations, hasPendingOperations, syncing } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Sync pending operations when cart page loads
  useEffect(() => {
    if (!cart.poolId) return;

    // Sync any pending operations from rapid adds, then refresh if needed
    const syncAndRefresh = async () => {
      // IMPORTANT: Wait for sync to complete FIRST to avoid race condition
      if (hasPendingOperations()) {
        console.log('[Cart] Syncing pending operations before refresh...');
        await syncPendingOperations();
        console.log('[Cart] Sync complete');
      }
      
      // Only refresh if we have items with missing restaurant names
      const hasMissingRestaurantName = cart.items.some((it) => !(it.restaurantName || '').trim());
      if (hasMissingRestaurantName) {
        console.log('[Cart] Refreshing cart to get missing data...');
        await refreshCart(cart.poolId);
        console.log('[Cart] Refresh complete');
      }
    };
    
    void syncAndRefresh();
  }, [cart.poolId, refreshCart, hasPendingOperations, syncPendingOperations]);

  // Fetch pool details (cart refresh is handled by CartContext)
  useEffect(() => {
    const fetchData = async () => {
      if (cart.poolId) {
        try {
          const poolData = await getPoolDetails(cart.poolId);
          setPool(poolData);
        } catch (err) {
          console.error('Failed to fetch pool details', err);
        }
      }
    };
    fetchData();
  }, [cart.poolId]);

  // Group items by restaurant
  const itemsByRestaurant = cart.items.reduce((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = [];
    }
    acc[item.restaurantId].push(item);
    return acc;
  }, {} as Record<string, typeof cart.items>);

  const restaurantNames = Array.from(
    new Set(
      cart.items
        .map((it) => (it.restaurantName || '').trim())
        .filter((n) => n.length > 0)
    )
  );

  // Calculate total (no platform fee or taxes)
  const deliveryFee = pool?.delivery_fee_per_order || 0;
  const totalAmount = cartTotal + deliveryFee;

  const handleProceedToPay = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!cart.poolId || cart.items.length === 0) return;

    setShowPaymentModal(false);
    setIsSubmitting(true);
    try {
      const orderPayload = {
        poolId: cart.poolId,
        specialInstructions: null,
        promoCode: null
      };

      const order = await createOrder(orderPayload);
      await clearCart(cart.poolId);
      const orderId = (order as any).id ?? (order as any).orderId;
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error('Checkout failed', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show skeleton when syncing pending operations
  if (syncing || (loading && cart.items.length === 0)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-soft p-8 animate-pulse">
          {/* Header skeleton */}
          <div className="h-10 bg-gray-100 rounded-xl w-1/3 mb-8"></div>
          
          {/* Items skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-6 mb-6 pb-6 border-b border-gray-50">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-100 rounded-lg w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded-lg w-1/4"></div>
              </div>
              <div className="h-10 bg-gray-100 rounded-xl w-28"></div>
            </div>
          ))}
          
          {/* Total skeleton */}
          <div className="mt-8 pt-6 border-t border-gray-50">
            <div className="h-8 bg-gray-100 rounded-xl w-1/4 ml-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-12 h-12 border-2 border-gray-300 rounded-xl border-dashed"></div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 text-lg">Add some delicious food from the pools!</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
        >
          Browse Pools
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Cart</h1>
            <div className="flex items-center gap-2 text-xs md:text-sm mt-1">
              <span className="text-gray-500">Pool:</span>
              <span className="font-bold text-primary">{pool?.name}</span>
            </div>
          </div>
        </div>
        <span className="px-3 py-1 md:px-4 md:py-1.5 bg-primary-light text-primary-dark rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border border-primary/10">
          POOLING ACTIVE
        </span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-8 flex flex-row gap-2 md:gap-8 items-center justify-between md:justify-start shadow-soft">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 flex-shrink-0">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">POOL CLOSES</p>
            <p className="font-bold text-gray-900 text-lg md:text-xl leading-none mb-1 truncate">{pool ? formatLocalTime(pool.collection_end) : '...'}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate">Last chance</p>
          </div>
        </div>
        <div className="w-px h-8 md:h-12 bg-gray-100 flex-shrink-0"></div>
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-light rounded-xl md:rounded-2xl flex items-center justify-center text-primary-dark flex-shrink-0">
            <Truck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">DELIVERY</p>
            <p className="font-bold text-gray-900 text-lg md:text-xl leading-none mb-1 truncate">{pool ? formatLocalTime(pool.expected_delivery_time) : '...'}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate">Arrives at</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        {/* Cart Items */}
        <div className="flex-grow space-y-6 min-w-0">
          {Object.entries(itemsByRestaurant).map(([restaurantId, items]) => {
            const restaurantName = items[0]?.restaurantName || 'Restaurant';
            const restaurantSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

            return (
            <div key={restaurantId} className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-50 overflow-hidden">
              <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-xl truncate">{restaurantName}</h3>
                    <p className="text-sm text-gray-500 font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Subtotal</p>
                    <p className="font-bold text-gray-900 text-lg">₹{restaurantSubtotal / 100}</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 relative">
                        {item.dish.image ? (
                          <img src={item.dish.image} alt={item.dish.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <div className="w-8 h-8 rounded-full border-2 border-current opacity-20"></div>
                          </div>
                        )}
                        <div className="absolute top-1 left-1">
                           {item.dish.veg ? (
                              <div className="w-4 h-4 bg-white rounded-md flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                            ) : (
                              <div className="w-4 h-4 bg-white rounded-md flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">{item.dish.name}</h4>
                        <p className="font-bold text-gray-500 text-base">₹{item.price / 100}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-[6.5rem] sm:pl-0">
                      <div className="flex items-center bg-white rounded-xl border border-gray-200 h-10 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-l-xl transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 text-base">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-r-xl transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:w-[24rem] flex-shrink-0">
          <div className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-50 p-8 sticky top-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Order Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Item Total</span>
                <span className="text-gray-900">₹{cartTotal / 100}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Delivery Fee <span className="text-primary text-xs font-bold bg-primary-light px-1.5 py-0.5 rounded ml-1">POOL</span></span>
                <span className="text-gray-900">₹{deliveryFee / 100}</span>
              </div>
              <div className="h-px bg-gray-100 my-6"></div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-primary">₹{totalAmount / 100}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-center text-sm text-gray-500 border border-gray-100 font-medium">
              {restaurantNames.length > 0
                ? `Ordering from: ${restaurantNames.join(', ')}`
                : `Ordering from ${Object.keys(itemsByRestaurant).length} restaurant${Object.keys(itemsByRestaurant).length !== 1 ? 's' : ''}`}
            </div>

            <button
              onClick={handleProceedToPay}
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Pay'}
            </button>

            <p className="text-xs text-center text-gray-400 font-medium">
              By proceeding, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl md:rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-8">
              <div className="bg-accent-light border border-accent/20 rounded-2xl p-5 mb-6">
                <p className="text-sm text-yellow-800 font-bold mb-2 flex items-center gap-2">
                  <span className="text-lg">💰</span> Cash on Delivery
                </p>
                <p className="text-sm text-yellow-700/90 leading-relaxed">
                  We currently accept <span className="font-bold">Cash</span> or <span className="font-bold">UPI payment on delivery</span> only.
                </p>
              </div>
              
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                By clicking "Confirm Order", your order will be placed and you can pay when your food arrives at the delivery hotspot.
              </p>
              
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                   <span className="font-medium">Order Total</span>
                   <span className="font-bold text-gray-900 text-lg">₹{totalAmount / 100}</span>
                </div>
                <p className="text-xs text-gray-400">Please keep exact change or UPI ready.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3.5 px-4 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
