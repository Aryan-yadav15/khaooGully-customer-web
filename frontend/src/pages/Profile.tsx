import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    return <div className="text-gray-600">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="text-gray-600">Profile not found.</div>;
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        {needsPhone && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            Please add your phone number to continue ordering.
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-gray-900 font-medium">{profile.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            {isEditingPhone || canEditPhone ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  type="tel"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
                <button
                  onClick={savePhone}
                  disabled={savingPhone}
                  className="px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {savingPhone ? 'Saving…' : 'Save'}
                </button>
                {!canEditPhone && (
                  <button
                    onClick={() => setIsEditingPhone(false)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-gray-900 font-medium">{profile.phone}</p>
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-gray-900 font-medium break-all">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="text-gray-900 font-medium">{formatLocalTime(profile.memberSince)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900">Previous Orders</h2>

        {orders.length === 0 ? (
          <p className="mt-4 text-gray-600">No previous orders yet.</p>
        ) : (
          <div className="mt-4 divide-y">
            {orders.map((o) => (
              <div key={o.orderId} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {o.poolName}{o.restaurantName ? ` • ${o.restaurantName}` : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatLocalTime(o.orderedAt)} • {o.itemCount} items • {o.status}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{(o.total / 100).toFixed(0)}</p>
                    <p className="text-xs text-gray-500">{o.paymentStatus}</p>
                  </div>
                  <Link
                    to={`/order/${o.orderId}`}
                    className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
