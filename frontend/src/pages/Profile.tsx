import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, Calendar, Clock, ShoppingBag, ChevronRight, Edit2, Save, X, Loader2 } from 'lucide-react';
import type { CustomerOrderHistoryItem, CustomerProfileSummary } from '../types';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile } from '../services/api';
import { formatLocalTime } from '../utils/datetime';
import { useAuth } from '../context/AuthContext';

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
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
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
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="+91 9876543210"
                    autoFocus
                  />
                  <button
                    onClick={savePhone}
                    disabled={savingPhone}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors shadow-sm"
                    title="Save"
                  >
                    {savingPhone ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  </button>
                  {!canEditPhone && (
                    <button
                      onClick={() => setIsEditingPhone(false)}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
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
              <p className="text-lg font-semibold text-gray-900 pl-1">{formatLocalTime(profile.memberSince)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Previous Orders
          </h2>
          {orders.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
              {orders.length} Orders
            </span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((o) => (
              <div key={o.orderId} className="p-6 hover:bg-gray-50/50 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate text-lg">
                        {o.poolName}
                      </h3>
                      {o.restaurantName && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-600 truncate">{o.restaurantName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatLocalTime(o.orderedAt)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{o.itemCount} items</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">₹{(o.total / 100).toFixed(0)}</p>
                      <p className={`text-xs font-medium uppercase tracking-wide ${
                        o.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {o.paymentStatus}
                      </p>
                    </div>
                    <Link
                      to={`/order/${o.orderId}`}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
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
