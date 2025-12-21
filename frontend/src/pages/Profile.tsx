import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, Calendar, Clock, ShoppingBag, ChevronRight, Edit2, Save, X, Loader2 } from 'lucide-react';
import type { CustomerOrderHistoryItem, CustomerProfileSummary } from '../types';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile } from '../services/api';
import { formatLocalTime, formatLocalDate } from '../utils/datetime';
import { useAuth } from '../context/AuthContext';

// Group orders by orderGroupId for display
interface OrderGroup {
  orderGroupId: string | null;
  orders: CustomerOrderHistoryItem[];
  poolName: string;
  orderedAt: string;
  totalAmount: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  restaurantNames: string[];
}

export default function Profile() {
  const { needsPhone, markPhoneCompleted } = useAuth();
  const [profile, setProfile] = useState<CustomerProfileSummary | null>(null);
  const [orders, setOrders] = useState<CustomerOrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [profileRes, ordersRes] = await Promise.all([
          getCustomerProfile(),
          getCustomerOrders(20, 0),
        ]);

        if (!mounted) return;
        setProfile(profileRes);
        setPhoneDraft(profileRes.phone || '');
        setOrders(ordersRes);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load profile');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center text-gray-500 mt-12">Profile not found.</div>;
  }

  // Group orders by orderGroupId
  const groupedOrders: OrderGroup[] = [];
  const processedGroupIds = new Set<string>();
  
  orders.forEach((order) => {
    const groupId = order.orderGroupId || order.orderId; // Use orderId as fallback for old orders
    
    if (processedGroupIds.has(groupId)) {
      return; // Already processed this group
    }
    
    // Find all orders with same groupId
    const groupOrders = order.orderGroupId 
      ? orders.filter(o => o.orderGroupId === order.orderGroupId)
      : [order]; // Old orders without groupId are displayed individually
    
    const restaurantNames = groupOrders
      .map(o => o.restaurantName)
      .filter((name): name is string => !!name);
    
    // Check if all orders have same status
    const statuses = [...new Set(groupOrders.map(o => o.status))];
    const hasRejectedOrders = groupOrders.some(o => 
      o.status === 'rejected' || o.status === 'auto_rejected'
    );
    const allRejected = groupOrders.every(o => 
      o.status === 'rejected' || o.status === 'auto_rejected' || o.status === 'cancelled'
    );
    
    // Calculate total excluding rejected orders
    const activeOrders = groupOrders.filter(o => 
      o.status !== 'rejected' && o.status !== 'auto_rejected' && o.status !== 'cancelled'
    );
    const totalAmount = activeOrders.length > 0 
      ? activeOrders.reduce((sum, o) => sum + o.total, 0)
      : groupOrders.reduce((sum, o) => sum + o.total, 0); // Show full amount if all rejected
    
    const displayStatus = statuses.length > 1 && hasRejectedOrders
      ? (allRejected ? 'rejected' : 'mixed')
      : order.status;
    
    groupedOrders.push({
      orderGroupId: order.orderGroupId || null,
      orders: groupOrders,
      poolName: order.poolName,
      orderedAt: order.orderedAt,
      totalAmount: totalAmount,
      itemCount: activeOrders.reduce((sum, o) => sum + o.itemCount, 0) || groupOrders.reduce((sum, o) => sum + o.itemCount, 0),
      status: displayStatus,
      paymentStatus: order.paymentStatus,
      restaurantNames: restaurantNames,
    });
    
    processedGroupIds.add(groupId);
  });

  const hasValidPhone = (value: string) => value.replace(/\D/g, '').length >= 10;

  const canEditPhone = needsPhone || !hasValidPhone(profile.phone);

  const savePhone = async () => {
    const trimmed = phoneDraft.trim();
    if (!hasValidPhone(trimmed)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setSavingPhone(true);
      setError(null);
      await updateCustomerProfile({ phone: trimmed });
      setProfile((p) => (p ? { ...p, phone: trimmed } : p));
      markPhoneCompleted();
      setIsEditingPhone(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update phone');
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="bg-primary-light/30 px-8 py-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20">
            {profile.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm">Manage your account details</p>
          </div>
        </div>

        <div className="p-8">
          {needsPhone && (
            <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-accent/20 rounded-full text-yellow-700">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Phone Number Required</h3>
                <p className="text-gray-600 text-sm mt-1">Please add your phone number to continue ordering food.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="group">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                Name
              </div>
              <p className="text-lg font-semibold text-gray-900 pl-1">{profile.fullName}</p>
            </div>

            <div className="group">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5" />
                Phone
              </div>
              
              {isEditingPhone || canEditPhone ? (
                <div className="flex items-center gap-2">
                  <input
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    type="tel"
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="+91 9876543210"
                    autoFocus
                  />
                  <button
                    onClick={savePhone}
                    disabled={savingPhone}
                    className="p-2.5 rounded-lg md:rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors shadow-sm"
                    title="Save"
                  >
                    {savingPhone ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  </button>
                  {!canEditPhone && (
                    <button
                      onClick={() => setIsEditingPhone(false)}
                      className="p-2.5 rounded-lg md:rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between group/edit pl-1">
                  <p className="text-lg font-semibold text-gray-900">{profile.phone}</p>
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-sm font-medium text-primary hover:text-primary-dark opacity-0 group-hover/edit:opacity-100 transition-all flex items-center gap-1 px-3 py-1 rounded-full hover:bg-primary-light/50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="group">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                Email
              </div>
              <p className="text-lg font-semibold text-gray-900 pl-1 break-all">{profile.email}</p>
            </div>

            <div className="group">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                Member Since
              </div>
              <p className="text-lg font-semibold text-gray-900 pl-1">{formatLocalDate(profile.memberSince)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Card */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Previous Orders
          </h2>
          {groupedOrders.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
              {groupedOrders.length} {groupedOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
          )}
        </div>

        {groupedOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg md:rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {groupedOrders.map((group) => (
              <div key={group.orders[0].orderId} className="p-6 hover:bg-gray-50/50 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate text-lg">
                        {group.poolName}
                      </h3>
                      {group.restaurantNames.length > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-600 truncate">
                            {group.restaurantNames.length === 1 
                              ? group.restaurantNames[0] 
                              : `${group.restaurantNames.length} restaurants`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatLocalTime(group.orderedAt)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{group.itemCount} items</span>
                      {group.orders.length > 1 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{group.orders.length} orders</span>
                        </>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                        group.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        group.status === 'cancelled' || group.status === 'rejected' || group.status === 'auto_rejected' ? 'bg-red-100 text-red-700' :
                        group.status === 'mixed' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {group.status === 'mixed' ? 'Partial' : group.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">₹{(group.totalAmount / 100).toFixed(0)}</p>
                      {/* <p className={`text-xs font-medium uppercase tracking-wide ${
                        group.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {group.paymentStatus}
                      </p> */}
                    </div>
                    <Link
                      to={`/order/${group.orders[0].orderId}`}
                      className="px-5 py-2.5 rounded-lg md:rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
