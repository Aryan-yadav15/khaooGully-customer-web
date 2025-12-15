import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ArrowLeft, Clock, Truck, Trash2, Loader2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder, getPoolDetails } from '../services/api';
import type { Pool } from '../types';
import { formatLocalTime } from '../utils/datetime';

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart, loading, refreshCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Ensure cart details (like restaurantName) are hydrated
  useEffect(() => {
    if (!cart.poolId) return;

    const hasMissingRestaurantName = cart.items.some((it) => !(it.restaurantName || '').trim());
    if (hasMissingRestaurantName) {
      void refreshCart(cart.poolId);
    }
  }, [cart.poolId, cart.items, refreshCart]);

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

  if (loading && cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add some delicious food from the pools!</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-lime-500 text-white rounded-xl font-bold hover:bg-lime-600 transition-colors"
        >
          Browse Pools
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-gray-500">Pool:</span>
              <span className="font-medium text-lime-600">{pool?.name}</span>
            </div>
          </div>
        </div>
        <span className="px-4 py-1.5 bg-lime-100 text-lime-700 rounded-full text-xs font-bold uppercase tracking-wider border border-lime-200">
          POOLING ACTIVE
        </span>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">POOL CLOSES</p>
            <p className="font-bold text-gray-900 text-lg leading-none mb-1">{pool ? formatLocalTime(pool.collection_end) : '...'}</p>
            <p className="text-xs text-gray-500">Last chance to order</p>
          </div>
        </div>
        <div className="hidden md:block w-px h-12 bg-green-200"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">EXPECTED DELIVERY</p>
            <p className="font-bold text-gray-900 text-lg leading-none mb-1">{pool ? formatLocalTime(pool.expected_delivery_time) : '...'}</p>
            <p className="text-xs text-gray-500">Food arrives at</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-grow space-y-6">
          {Object.entries(itemsByRestaurant).map(([restaurantId, items]) => {
            const restaurantName = items[0]?.restaurantName || 'Restaurant';
            const restaurantSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

            return (
            <div key={restaurantId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{restaurantName}</h3>
                    <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="font-bold text-gray-900">₹{restaurantSubtotal / 100}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-6 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.dish.image ? (
                          <img src={item.dish.image} alt={item.dish.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.dish.veg ? (
                            <span className="w-4 h-4 border border-green-600 flex items-center justify-center p-0.5 rounded-sm">
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            </span>
                          ) : (
                            <span className="w-4 h-4 border border-red-600 flex items-center justify-center p-0.5 rounded-sm">
                              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            </span>
                          )}
                          <h4 className="font-bold text-gray-900 text-lg">{item.dish.name}</h4>
                        </div>
                        <p className="font-bold text-gray-900 text-lg">₹{item.price / 100}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-10">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
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
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Item Total</span>
                <span>₹{cartTotal / 100}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee <span className="text-lime-600 text-xs font-bold">(Pool)</span></span>
                <span>₹{deliveryFee / 100}</span>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">₹{totalAmount / 100}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center text-sm text-gray-600 border border-gray-100">
              {restaurantNames.length > 0
                ? `Ordering from: ${restaurantNames.join(', ')}`
                : `Ordering from ${Object.keys(itemsByRestaurant).length} restaurant${Object.keys(itemsByRestaurant).length !== 1 ? 's' : ''}`}
            </div>

            <button
              onClick={handleProceedToPay}
              disabled={isSubmitting}
              className="w-full py-4 bg-lime-500 text-white rounded-xl font-bold text-lg hover:bg-lime-600 transition-colors shadow-lg shadow-lime-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Pay'}
            </button>

            <p className="text-xs text-center text-gray-400">
              By proceeding, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">💰 Cash on Delivery</p>
                <p className="text-sm text-yellow-700">
                  We currently accept <span className="font-bold">Cash</span> or <span className="font-bold">UPI payment on delivery</span> only.
                </p>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">
                By clicking "Confirm Order", your order will be placed and you can pay when your food arrives at the delivery hotspot.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p className="font-semibold text-gray-900 mb-1">Order Total: ₹{totalAmount / 100}</p>
                <p className="text-xs">Please keep exact change or UPI ready for payment.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-lime-500 text-white rounded-xl font-bold hover:bg-lime-600 transition-colors shadow-lg shadow-lime-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
