import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2, MapPin, Search, Store } from 'lucide-react';
import { getCampuses, getCampusRestaurants, getPoolDetails } from '../services/api';
import type { Campus, Restaurant } from '../types';
import { useCart } from '../context/CartContext';

type CampusRestaurantPoolMapping = {
  campusId: string;
  poolId: string;
  poolName: string;
  poolStatus?: string | null;
  restaurant: Restaurant;
};

const CampusRestaurants: React.FC = () => {
  const { campusId } = useParams<{ campusId: string }>();
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const [campus, setCampus] = useState<Campus | null>(null);
  const [rows, setRows] = useState<CampusRestaurantPoolMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [poolNameById, setPoolNameById] = useState<Record<string, string>>({});
  const [poolSwitchConfirm, setPoolSwitchConfirm] = useState<null | {
    fromPoolId: string;
    fromPoolName: string;
    toPoolId: string;
    toPoolName: string;
    restaurantId: string;
  }>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campusId) return;
      try {
        setLoading(true);
        setError(null);

        const [campusesData, campusRestaurants] = await Promise.all([
          getCampuses(),
          getCampusRestaurants(campusId),
        ]);

        const currentCampus = campusesData.find((c: Campus) => c.id === campusId) || null;
        setCampus(currentCampus);
        setRows((campusRestaurants || []) as CampusRestaurantPoolMapping[]);
      } catch (err) {
        console.error(err);
        setError('Failed to load restaurants for this campus.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campusId]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    const list = rows || [];
    if (!normalizedSearch) return list;
    return list.filter((r) => {
      const rest = r.restaurant;
      const nameMatch = (rest?.name || '').toLowerCase().includes(normalizedSearch);
      const cuisineMatch = (rest?.cuisine || []).some((c) => c.toLowerCase().includes(normalizedSearch));
      const poolMatch = (r.poolName || '').toLowerCase().includes(normalizedSearch);
      return nameMatch || cuisineMatch || poolMatch;
    });
  }, [rows, normalizedSearch]);

  const resolvePoolName = async (poolId: string) => {
    const fromRows = rows.find((r) => r.poolId === poolId)?.poolName;
    if (fromRows) return fromRows;

    const cached = poolNameById[poolId];
    if (cached) return cached;

    try {
      const pool = await getPoolDetails(poolId);
      const name = pool?.name || poolId;
      setPoolNameById((prev) => (prev[poolId] ? prev : { ...prev, [poolId]: name }));
      return name;
    } catch {
      return poolId;
    }
  };

  const handleRestaurantClick = (row: CampusRestaurantPoolMapping) => {
    const rest = row.restaurant;
    const isDifferentPool = !!cart.poolId && cart.poolId !== row.poolId && cart.items.length > 0;
    if (isDifferentPool && cart.poolId) {
      const fromPoolId = cart.poolId;
      void (async () => {
        const [fromName, toName] = await Promise.all([
          resolvePoolName(fromPoolId),
          resolvePoolName(row.poolId),
        ]);

        setPoolSwitchConfirm({
          fromPoolId,
          fromPoolName: fromName,
          toPoolId: row.poolId,
          toPoolName: toName,
          restaurantId: rest.id,
        });
      })();
      return;
    }

    navigate(`/pool/${row.poolId}/restaurant/${rest.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  if (!loading && filtered.length === 0 && !searchTerm) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Pools</h3>
        <p className="text-gray-500 mb-6">
          There are currently no active delivery pools for {campus?.name || 'this campus'}.
          <br />
          Pools may be scheduled or closed. Please check back later.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Choose Different Campus
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Restaurants delivering to {campus?.name || 'Campus'}
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-500">Pick a restaurant. Your cart will lock to its pool.</p>
          <Link to="/" className="flex items-center text-lime-600 hover:text-lime-700 text-sm font-medium">
            <MapPin className="w-4 h-4 mr-1" />
            Change Location
          </Link>
        </div>

        <div className="mt-6">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search restaurants or pools"
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500/40 focus:border-lime-300"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium text-lg mb-1">No restaurants found</p>
          <p className="text-gray-500">There are no active restaurants for this campus right now.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const rest = row.restaurant;
            const isDifferentPool = !!cart.poolId && cart.poolId !== row.poolId && cart.items.length > 0;

            return (
              <div
                key={`${row.poolId}-${rest.id}`}
                onClick={() => handleRestaurantClick(row)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="h-40 overflow-hidden bg-gray-200 relative">
                  {rest.image ? (
                    <img
                      src={rest.image}
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  <div className={`w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 ${rest.image ? 'hidden' : ''}`}>
                    <Store className="w-12 h-12 opacity-20" />
                  </div>

                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm text-xs font-bold text-gray-700">
                    Pool: {row.poolName || row.poolId}
                  </div>

                  {isDifferentPool && (
                    <div className="absolute top-3 right-3 bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg shadow-sm text-xs font-bold">
                      Different pool
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">{rest.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">{(rest.cuisine || []).join(', ')}</p>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-md">₹{(rest.costForTwo || 0) / 100} for two</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-md">{rest.deliveryTime} mins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {poolSwitchConfirm && (
        <div className="fixed inset-x-0 bottom-4 z-[60] px-4">
          <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg p-4 md:p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Switch pools and clear cart?
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Your cart is currently in <span className="font-medium text-gray-900">{poolSwitchConfirm.fromPoolName}</span>.
                  Opening <span className="font-medium text-gray-900">{poolSwitchConfirm.toPoolName}</span> will clear your cart.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setPoolSwitchConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const next = poolSwitchConfirm;
                  setPoolSwitchConfirm(null);
                  await clearCart(next.fromPoolId);
                  navigate(`/pool/${next.toPoolId}/restaurant/${next.restaurantId}`);
                }}
                className="px-4 py-2 rounded-xl bg-lime-600 text-white font-semibold hover:bg-lime-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusRestaurants;
