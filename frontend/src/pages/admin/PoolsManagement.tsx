import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Filter, ChevronDown, Clock, MapPin, Truck, Ban, Eye, User, Phone, Package, ChevronRight, ChevronUp } from 'lucide-react';
import { getPools, getCampuses, getRestaurants, admin } from '../../services/api';
import type { Pool, Campus, Restaurant, AdminPoolOrder } from '../../types';
import { dateTimeLocalToIso, isoToDateTimeLocalValue, parseDateTimeLocal } from '../../utils/datetime';

const PoolsManagement: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedPoolOrders, setSelectedPoolOrders] = useState<AdminPoolOrder[]>([]);
  const [selectedPoolName, setSelectedPoolName] = useState<string>('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    campusId: '',
    name: '',
    description: '',
    deliveryFeePerOrder: 0,
    collectionStart: '',
    collectionEnd: '',
    expectedDeliveryTime: '',
    participatingRestaurants: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poolsData, campusesData, restaurantsData] = await Promise.all([
        getPools(),
        getCampuses(),
        getRestaurants()
      ]);
      setPools(poolsData);
      setCampuses(campusesData);
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate delivery window (±10 minutes from expected delivery time)
      const deliveryTime = parseDateTimeLocal(formData.expectedDeliveryTime);
      if (!deliveryTime) {
        throw new Error('Invalid expected delivery time');
      }
      const startWindow = new Date(deliveryTime.getTime() - 10 * 60000); // -10 minutes
      const endWindow = new Date(deliveryTime.getTime() + 10 * 60000); // +10 minutes
      
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      };
      
      const deliveryWindow = `${formatTime(startWindow)} - ${formatTime(endWindow)}`;
      
      // Convert to snake_case for backend
      const payload = {
        name: formData.name,
        campus_id: formData.campusId,
        description: formData.description,
        delivery_fee_per_order: formData.deliveryFeePerOrder,
        collection_start: dateTimeLocalToIso(formData.collectionStart),
        collection_end: dateTimeLocalToIso(formData.collectionEnd),
        expected_delivery_time: dateTimeLocalToIso(formData.expectedDeliveryTime),
        delivery_window: deliveryWindow,
        participating_restaurants: formData.participatingRestaurants,
      };

      if (editingPool) {
        await admin.updatePool(editingPool.id, payload);
      } else {
        await admin.createPool(payload);
      }
      setIsModalOpen(false);
      setEditingPool(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save pool:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this pool?')) {
      try {
        await admin.deletePool(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete pool:', error);
      }
    }
  };

  const handleViewOrders = async (pool: Pool) => {
    setLoadingOrders(true);
    setSelectedPoolName(pool.name || pool.id);
    setIsOrdersModalOpen(true);
    try {
      const orders = await admin.getPoolOrders(pool.id);
      setSelectedPoolOrders(orders);
    } catch (error) {
      console.error('Failed to fetch pool orders:', error);
      setSelectedPoolOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleClosePool = async (pool: Pool) => {
    const label = pool.name?.trim() ? pool.name : pool.id;
    if (!window.confirm(`Mark pool "${label}" as CLOSED? This will set manual_status to closed so backend sync can pick it up.`)) {
      return;
    }
    try {
      await admin.closePool(pool.id);
      fetchData();
    } catch (error) {
      console.error('Failed to close pool:', error);
      alert('Failed to close pool. Please try again.');
    }
  };

  const handleEdit = (pool: Pool) => {
    setEditingPool(pool);
    setFormData({
      campusId: pool.campus_id,
      name: pool.name,
      description: pool.description || '',
      deliveryFeePerOrder: pool.delivery_fee_per_order,
      collectionStart: isoToDateTimeLocalValue(pool.collection_start),
      collectionEnd: isoToDateTimeLocalValue(pool.collection_end),
      expectedDeliveryTime: isoToDateTimeLocalValue(pool.expected_delivery_time),
      participatingRestaurants: pool.participating_restaurants || []
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      campusId: '',
      name: '',
      description: '',
      deliveryFeePerOrder: 0,
      collectionStart: '',
      collectionEnd: '',
      expectedDeliveryTime: '',
      participatingRestaurants: []
    });
  };

  const toggleRestaurant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      participatingRestaurants: prev.participatingRestaurants.includes(id)
        ? prev.participatingRestaurants.filter(rId => rId !== id)
        : [...prev.participatingRestaurants, id]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pools Management</h1>
          <p className="text-gray-500 mt-1">Manage active food pools and deliveries</p>
        </div>
        <button
          onClick={() => {
            setEditingPool(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-lime-500/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Create Pool
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search pools..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all"
            />
          </div>
          <button className="px-6 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-5">Pool Name</th>
                <th className="px-6 py-5">Campus</th>
                <th className="px-6 py-5">Timing</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pools.map((pool) => (
                <tr key={pool.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-900 text-base">{pool.name}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">{(pool.participating_restaurants || []).length} Restaurants</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {campuses.find(c => c.id === pool.campus_id)?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Ends: {new Date(pool.collection_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Truck className="w-3.5 h-3.5" />
                        Delivers: {new Date(pool.expected_delivery_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide border ${
                      (pool.computed_status || pool.manual_status) === 'open' ? 'bg-green-100 text-green-700 border-green-200' :
                      (pool.computed_status || pool.manual_status) === 'closed' ? 'bg-red-50 text-red-600 border-red-100' :
                      (pool.computed_status || pool.manual_status) === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {(pool.computed_status || pool.manual_status || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewOrders(pool)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="View Orders"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(pool.computed_status === 'closed' && pool.manual_status !== 'closed' && pool.manual_status !== 'synced') && (
                        <button
                          onClick={() => handleClosePool(pool)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Persist CLOSED status"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(pool)}
                        className="p-2 text-gray-400 hover:text-lime-600 hover:bg-lime-50 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pool.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPool ? 'Update Pool Settings' : 'Create New Pool'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form id="poolForm" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Basic Info */}
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pool Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Lunch Pool"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Campus</label>
                    <div className="relative">
                      <select
                        value={formData.campusId}
                        onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none appearance-none transition-all"
                        required
                      >
                        <option value="">Select Campus</option>
                        {campuses.map((campus) => (
                          <option key={campus.id} value={campus.id}>{campus.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.collectionStart}
                        onChange={(e) => setFormData({ ...formData, collectionStart: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={formData.collectionEnd}
                        onChange={(e) => setFormData({ ...formData, collectionEnd: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expected Delivery</label>
                    <input
                      type="datetime-local"
                      value={formData.expectedDeliveryTime}
                      onChange={(e) => setFormData({ ...formData, expectedDeliveryTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      value={formData.deliveryFeePerOrder}
                      onChange={(e) => setFormData({ ...formData, deliveryFeePerOrder: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Right Column: Restaurants Selection */}
                <div className="flex-1 border-l border-gray-100 pl-0 lg:pl-8">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Select Restaurants</label>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {restaurants.map((restaurant) => (
                      <div 
                        key={restaurant.id}
                        onClick={() => toggleRestaurant(restaurant.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                          formData.participatingRestaurants.includes(restaurant.id)
                            ? 'bg-lime-50 border-lime-500 ring-1 ring-lime-500'
                            : 'bg-white border-gray-200 hover:border-lime-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          formData.participatingRestaurants.includes(restaurant.id)
                            ? 'bg-lime-500 border-lime-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {formData.participatingRestaurants.includes(restaurant.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{restaurant.name}</div>
                          <div className="text-xs text-gray-500">{restaurant.cuisine.join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="poolForm"
                className="px-6 py-3 bg-lime-500 text-white rounded-xl font-bold hover:bg-lime-600 transition-colors shadow-lg shadow-lime-200"
              >
                {editingPool ? 'Update Pool' : 'Create Pool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pool Orders</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedPoolName}</p>
              </div>
              <button 
                onClick={() => {
                  setIsOrdersModalOpen(false);
                  setExpandedOrderId(null);
                }} 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
                </div>
              ) : selectedPoolOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No orders in this pool yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPoolOrders.map((order) => (
                    <div 
                      key={order.orderId} 
                      className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
                    >
                      {/* Order Header - Always Visible */}
                      <div 
                        className="p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedOrderId(
                          expandedOrderId === order.orderId ? null : order.orderId
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            {/* Customer Info */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {order.customerName || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                <span>{order.customerPhone || (order as any).customer_phone || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Restaurant */}
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Restaurant</div>
                              <div className="font-medium text-gray-900">
                                {order.restaurantName || (order as any).restaurant_name || 'N/A'}
                              </div>
                            </div>

                            {/* Total */}
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                              <div className="font-bold text-lime-600 text-lg">
                                ₹{Math.round((order.total || 0) / 100)}
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Status</div>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status?.toUpperCase() || 'POOLING'}
                              </span>
                            </div>
                          </div>

                          {/* Expand Icon */}
                          <div className="ml-4">
                            {expandedOrderId === order.orderId ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items Section */}
                      {expandedOrderId === order.orderId && order.items && order.items.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Order Items ({order.items.length})
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => {
                              // Handle different field name formats from backend
                              const dishName = item.dish_name || item.dishName || item.name || 'Unknown Item';
                              const unitPrice = item.unit_price || item.price || 0;
                              const quantity = item.quantity || 1;
                              const isVeg = item.veg !== undefined ? item.veg : true;
                              const instructions = item.special_instructions || item.specialInstructions;
                              const itemTotal = item.subtotal || (unitPrice * quantity);
                              
                              return (
                                <div 
                                  key={idx} 
                                  className="bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                      isVeg ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>
                                    <div>
                                      <div className="font-medium text-gray-900">{dishName}</div>
                                      {instructions && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Note: {instructions}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                      Qty: <span className="font-semibold">{quantity}</span>
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      ₹{Math.round(itemTotal / 100)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Order Summary */}
                          {order.subtotal !== undefined && (
                            <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{Math.round(order.subtotal / 100)}</span>
                              </div>
                              {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Delivery Fee</span>
                                  <span>₹{Math.round(order.deliveryFee / 100)}</span>
                                </div>
                              )}
                              {order.platformFee !== undefined && order.platformFee > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Platform Fee</span>
                                  <span>₹{Math.round(order.platformFee / 100)}</span>
                                </div>
                              )}
                              {order.taxes !== undefined && order.taxes > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Taxes</span>
                                  <span>₹{Math.round(order.taxes / 100)}</span>
                                </div>
                              )}
                              {order.discount !== undefined && order.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Discount</span>
                                  <span>-₹{Math.round(order.discount / 100)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>₹{Math.round((order.total || 0) / 100)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total Orders: <span className="font-bold text-gray-900">{selectedPoolOrders.length}</span>
                {selectedPoolOrders.length > 0 && (
                  <span className="ml-4">
                    Total Revenue: <span className="font-bold text-lime-600">
                      ₹{Math.round(selectedPoolOrders.reduce((sum, order) => sum + (order.total || 0), 0) / 100)}
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsOrdersModalOpen(false);
                  setExpandedOrderId(null);
                }}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolsManagement;
