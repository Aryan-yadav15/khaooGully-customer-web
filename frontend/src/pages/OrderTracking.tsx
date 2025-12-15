import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getOrderDetails } from '../services/api';
import type { Order } from '../types';

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const formatMoney = (paise: number) => `₹${(Math.max(0, paise) / 100).toFixed(0)}`;

  const items = useMemo(() => {
    const raw: any = (order as any)?.items;
    if (!raw) return [] as any[];

    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [order]);

  const paymentLabel = (order?.paymentStatus || '').toLowerCase() === 'completed'
    ? 'Paid'
    : 'Amount to pay';

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!order) return <div>Order not found</div>;

  const steps = [
    { status: 'pooling', label: 'Pooling Orders', description: 'Waiting for pool to close' },
    { status: 'pending', label: 'Order Confirmed', description: 'Pool closed, order sent to restaurant' },
    { status: 'accepted', label: 'Order Accepted', description: 'Restaurant is preparing your food' },
    { status: 'out_for_delivery', label: 'Out for Delivery', description: 'On the way to hotspot' },
    { status: 'delivered', label: 'Delivered', description: 'Enjoy your meal!' },
  ];

  // Map order status to step index (handle rejected/cancelled separately)
  const currentStatus = order.orderStatus?.toLowerCase() || '';
  let currentStepIndex = steps.findIndex(s => s.status === currentStatus);
  
  // If order is rejected or cancelled, show it stuck at the last known step
  if (currentStepIndex === -1) {
    if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
      // Find the highest step that could have been reached
      // Rejected orders likely never got past 'pending' or 'accepted'
      currentStepIndex = 1; // Show as confirmed but not progressing
    } else {
      // Unknown status - default to first step
      currentStepIndex = 0;
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500">Order ID: #{order.orderId.slice(0, 8)}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.poolName ? (
                <>
                  <span className="font-medium text-gray-900">Pool:</span> {order.poolName}
                </>
              ) : null}
              {order.campusName || order.deliveryHotspot ? (
                <>
                  {order.poolName ? <br /> : null}
                  <span className="font-medium text-gray-900">Campus:</span> {order.campusName || '—'}
                  {order.deliveryHotspot ? <> • {order.deliveryHotspot}</> : null}
                </>
              ) : null}
              {order.restaurantName ? (
                <>
                  {(order.poolName || order.campusName || order.deliveryHotspot) ? <br /> : null}
                  <span className="font-medium text-gray-900">Restaurant:</span> {order.restaurantName}
                </>
              ) : null}
              {!order.poolName && !order.campusName && !order.deliveryHotspot && !order.restaurantName ? 'Items and total' : null}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">{paymentLabel}</p>
            <p className="text-2xl font-extrabold text-gray-900">{formatMoney(order.total)}</p>
            <p className="text-xs text-gray-500 mt-1">{order.paymentStatus}</p>
          </div>
        </div>

        <div className="mt-6 divide-y">
          {items.length === 0 ? (
            <p className="text-sm text-gray-600">No items found for this order.</p>
          ) : (
            items.map((it: any, idx: number) => {
              const name = it.dish_name ?? it.dishName ?? it.name ?? it.dishName ?? 'Item';
              const quantity = typeof it.quantity === 'number' ? it.quantity : 1;
              const unitPrice = typeof it.unit_price === 'number'
                ? it.unit_price
                : (typeof it.unitPrice === 'number' ? it.unitPrice : (typeof it.price === 'number' ? it.price : 0));
              const lineTotal = typeof it.subtotal === 'number' ? it.subtotal : unitPrice * quantity;
              const isVeg = typeof it.veg === 'boolean' ? it.veg : true;

              return (
                <div key={`${idx}-${String(name)}`} className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isVeg ? (
                        <span className="w-4 h-4 border border-green-600 flex items-center justify-center p-0.5 rounded-sm flex-shrink-0">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        </span>
                      ) : (
                        <span className="w-4 h-4 border border-red-600 flex items-center justify-center p-0.5 rounded-sm flex-shrink-0">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                        </span>
                      )}
                      <p className="font-semibold text-gray-900 truncate">{name}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {quantity} × {formatMoney(unitPrice)}
                      {it.special_instructions ? <> • <span className="italic">{String(it.special_instructions)}</span></> : null}
                    </p>
                  </div>

                  <p className="font-bold text-gray-900 flex-shrink-0">{formatMoney(lineTotal)}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 border-t pt-5">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>Subtotal</span>
            <span className="font-medium">{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-700 mt-2">
            <span>Delivery fee</span>
            <span className="font-medium">{formatMoney(order.deliveryFee)}</span>
          </div>
          {(order.platformFee || 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-700 mt-2">
              <span>Platform fee</span>
              <span className="font-medium">{formatMoney(order.platformFee)}</span>
            </div>
          )}
          {(order.taxes || 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-700 mt-2">
              <span>Taxes</span>
              <span className="font-medium">{formatMoney(order.taxes)}</span>
            </div>
          )}
          {(order.discount || 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-700 mt-2">
              <span>Discount</span>
              <span className="font-medium">- {formatMoney(order.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base text-gray-900 mt-4">
            <span className="font-bold">Total</span>
            <span className="font-extrabold">{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Driver Details & OTP Card */}
      {(order.driverName || order.driverPhone || order.otp) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-600">🚗</span>
            Delivery Details
          </h2>
          
          <div className="space-y-4">
            {order.driverName && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">👤</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Driver Name</p>
                  <p className="text-base font-bold text-gray-900">{order.driverName}</p>
                </div>
              </div>
            )}
            
            {order.driverPhone && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">📞</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contact Number</p>
                  <p className="text-base font-bold text-gray-900">{order.driverPhone}</p>
                </div>
              </div>
            )}
            
            {order.otp && (
              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-yellow-300 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Delivery OTP</p>
                    <p className="text-sm text-gray-600 mb-2">Share this OTP with your driver for verification</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-yellow-400 px-4 py-3 rounded-lg">
                      <p className="text-3xl font-black text-gray-900 tracking-widest text-center">{order.otp}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold mb-6">Order Status</h2>
        
        {/* Show alert for rejected/cancelled orders */}
        {(currentStatus === 'rejected' || currentStatus === 'cancelled') && (
          <div className={`mb-6 p-4 rounded-lg ${
            currentStatus === 'cancelled' 
              ? 'bg-gray-100 border border-gray-300 text-gray-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="font-semibold">
              {currentStatus === 'cancelled' ? 'Order Cancelled' : 'Order Rejected'}
            </p>
            {order.cancellationReason && (
              <p className="text-sm mt-1">{order.cancellationReason}</p>
            )}
          </div>
        )}
        
        <div className="relative">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            
            return (
              <div key={step.status} className="flex gap-4 mb-8 last:mb-0 relative z-10">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isCompleted ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-300'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-current" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-full absolute top-8 left-4 -translate-x-1/2 ${
                      index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                    }`} style={{ height: 'calc(100% + 2rem)' }}></div>
                  )}
                </div>
                <div className={`${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                  <h3 className="font-bold">{step.label}</h3>
                  <p className="text-sm">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
