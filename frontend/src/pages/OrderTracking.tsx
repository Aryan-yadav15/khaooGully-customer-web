import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getOrderDetails } from '../services/api';
import type { Order } from '../types';

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
    { status: 'accepted', label: 'Order Accepted', description: 'Restaurant is preparing your food' },
    { status: 'out_for_delivery', label: 'Out for Delivery', description: 'On the way to hotspot' },
    { status: 'delivered', label: 'Delivered', description: 'Enjoy your meal!' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.orderStatus);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500">Order ID: #{order.orderId.slice(0, 8)}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold mb-6">Order Status</h2>
        
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
