import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, MapPin, Store, Clock, Receipt, Phone, User, ShieldCheck, ChevronLeft, AlertCircle } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Order not found</p>
      <Link to="/" className="text-primary font-bold hover:underline mt-2 inline-block">Go Home</Link>
    </div>
  );

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
    <div className="max-w-3xl mx-auto pb-12 px-4">
      <Link to="/profile" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      {/* Success Header */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-100 p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-light via-primary to-primary-light"></div>
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-light/30 rounded-full mb-4 shadow-sm animate-in zoom-in duration-500">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Order Placed Successfully!</h1>
        <p className="text-gray-500 font-medium mb-2">Order ID: <span className="font-mono text-gray-700">#{order.orderId.slice(0, 8)}</span></p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
          {order.deliveryWindow && (
            <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-gray-600">
                Estimated Delivery: <span className="font-bold text-gray-900">{order.deliveryWindow}</span>
              </p>
            </div>
          )}
          
          {order.deliveryHotspot && (
            <div className="inline-flex items-center gap-2 bg-primary-light/30 px-4 py-2 rounded-xl border border-primary/20">
              <MapPin className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-gray-600">
                Pickup Location: <span className="font-bold text-gray-900">{order.deliveryHotspot}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Details Card (Conditional) */}
      {(order.driverName || order.driverPhone || order.otp) && (
        <div className="bg-primary-light/20 rounded-xl md:rounded-3xl shadow-soft border border-primary/10 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="bg-white p-1.5 rounded-lg shadow-sm">🚚</span>
            Delivery Details
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.driverName && (
                <div className="flex items-center gap-4 bg-white/60 p-3 rounded-xl md:rounded-2xl border border-white/50">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Driver Name</p>
                    <p className="text-base font-bold text-gray-900">{order.driverName}</p>
                  </div>
                </div>
              )}
              
              {order.driverPhone && (
                <div className="flex items-center gap-4 bg-white/60 p-3 rounded-xl md:rounded-2xl border border-white/50">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Contact Number</p>
                    <p className="text-base font-bold text-gray-900">{order.driverPhone}</p>
                  </div>
                </div>
              )}
            </div>
            
            {order.otp && (
              <div className="mt-4 p-5 bg-white rounded-xl md:rounded-2xl border-2 border-accent/30 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-accent"></div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1">
                      <ShieldCheck className="w-3 h-3" /> Delivery OTP
                    </p>
                    <p className="text-sm text-gray-600 font-medium">Share this OTP with your driver for verification</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-accent text-black px-6 py-2 rounded-xl shadow-sm transform rotate-1 hover:rotate-0 transition-transform">
                      <p className="text-3xl font-black tracking-[0.2em]">{order.otp}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Status Timeline */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-100 p-8 mb-6">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Order Status
        </h2>
        
        {/* Show alert for rejected/cancelled orders */}
        {(currentStatus === 'rejected' || currentStatus === 'cancelled') && (
          <div className={`mb-8 p-4 rounded-2xl flex items-start gap-3 ${
            currentStatus === 'cancelled' 
              ? 'bg-gray-50 border border-gray-200 text-gray-700' 
              : 'bg-red-50 border border-red-100 text-red-700'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-lg">
                {currentStatus === 'cancelled' ? 'Order Cancelled' : 'Order Rejected'}
              </p>
              {order.cancellationReason && (
                <p className="text-sm mt-1 opacity-90">{order.cancellationReason}</p>
              )}
            </div>
          </div>
        )}
        
        <div className="relative pl-2">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.status} className="flex gap-6 mb-10 last:mb-0 relative z-10 group">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110' 
                      : 'bg-white border-gray-100 text-gray-300'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-gray-200" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-1 absolute top-10 left-5 -translate-x-1/2 transition-all duration-700 ${
                      index < currentStepIndex ? 'bg-primary h-[calc(100%+2.5rem)]' : 'bg-gray-100 h-[calc(100%+2.5rem)]'
                    }`}></div>
                  )}
                </div>
                <div className={`pt-1 transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-50'} ${isCurrent ? 'transform translate-x-1' : ''}`}>
                  <h3 className={`font-bold text-lg ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Order Summary
          </h2>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{paymentLabel}</p>
            <p className={`text-xs font-bold uppercase tracking-wide mt-0.5 ${
              order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
            }`}>{order.paymentStatus}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl md:rounded-2xl p-5 mb-6 space-y-3 text-sm">
          {order.poolName && (
            <div className="flex items-start gap-3">
              <Store className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">Pool</span>
                <span className="text-gray-600">{order.poolName}</span>
              </div>
            </div>
          )}
          {(order.campusName || order.deliveryHotspot) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">Location</span>
                <span className="text-gray-600">{order.campusName} {order.deliveryHotspot ? `• ${order.deliveryHotspot}` : ''}</span>
              </div>
            </div>
          )}
          {order.restaurantName && (
            <div className="flex items-start gap-3">
              <Store className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">Restaurant</span>
                <span className="text-gray-600">{order.restaurantName}</span>
              </div>
            </div>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center italic">No items found for this order.</p>
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
                <div key={`${idx}-${String(name)}`} className="py-4 flex items-start justify-between gap-4 group hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isVeg ? (
                        <span className="w-4 h-4 border border-green-600 flex items-center justify-center p-0.5 rounded-sm flex-shrink-0" title="Veg">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        </span>
                      ) : (
                        <span className="w-4 h-4 border border-red-600 flex items-center justify-center p-0.5 rounded-sm flex-shrink-0" title="Non-Veg">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                        </span>
                      )}
                      <p className="font-bold text-gray-900 truncate">{name}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-medium pl-6">
                      {quantity} × {formatMoney(unitPrice)}
                      {it.special_instructions ? <> • <span className="italic text-gray-400">{String(it.special_instructions)}</span></> : null}
                    </p>
                  </div>

                  <p className="font-bold text-gray-900 flex-shrink-0">{formatMoney(lineTotal)}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 border-t border-dashed border-gray-200 pt-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Delivery fee</span>
            <span className="font-medium text-gray-900">{formatMoney(order.deliveryFee)}</span>
          </div>
          {(order.platformFee || 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Platform fee</span>
              <span className="font-medium text-gray-900">{formatMoney(order.platformFee)}</span>
            </div>
          )}
          {(order.taxes || 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Taxes</span>
              <span className="font-medium text-gray-900">{formatMoney(order.taxes)}</span>
            </div>
          )}
          {(order.discount || 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount</span>
              <span className="font-bold">- {formatMoney(order.discount)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-primary">{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
