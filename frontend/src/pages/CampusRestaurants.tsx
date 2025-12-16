import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2, MapPin, Search, Store, ArrowRight, Star } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  if (!loading && filtered.length === 0 && !searchTerm) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Pools</h3>
        <p className="text-gray-500 mb-8">
          There are currently no active delivery pools for {campus?.name || 'this campus'}.
          <br />
          Pools may be scheduled or closed. Please check back later.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
        >
          <MapPin className="w-5 h-5 mr-2" />
          Choose Different Campus
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-10 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-3xl p-5 md:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                <Store className="w-3 h-3 md:w-4 md:h-4" />
                Campus Dining
              </div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                Restaurants at <span className="text-primary-light">{campus?.name || 'Campus'}</span>
              </h1>
              <p className="text-gray-400 max-w-xl text-sm md:text-base">
                Select a restaurant to start. You can mix and match items from different restaurants in the same Pool!
              </p>
            </div>
            <Link 
              to="/" 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 text-xs md:text-sm font-medium transition-all text-white hover:scale-105 w-full md:w-auto"
            >
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              Change Location
            </Link>
          </div>

          <div className="relative group max-w-2xl">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary-light transition-colors" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search restaurants, cuisines, or pools..."
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 text-white placeholder-gray-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/20 transition-all text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-50">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-900 font-bold text-xl mb-2">No restaurants found</p>
          <p className="text-gray-500">There are no active restaurants matching your search right now.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const rest = row.restaurant;
            const isDifferentPool = !!cart.poolId && cart.poolId !== row.poolId && cart.items.length > 0;

            return (
              <div
                key={`${row.poolId}-${rest.id}`}
                onClick={() => handleRestaurantClick(row)}
                className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-row md:flex-col h-full items-center md:items-stretch"
              >
                <div className="w-32 h-36 md:w-full md:h-48 overflow-hidden bg-gray-100 relative shrink-0 m-3 md:m-0 rounded-xl md:rounded-none">
                  {rest.image ? (
                    <img
                      src={rest.image}
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  <div className={`w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 ${rest.image ? 'hidden' : ''}`}>
                    <Store className="w-10 h-10 md:w-16 md:h-16 opacity-20" />
                  </div>

                  <div className="hidden md:block absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg md:rounded-xl shadow-sm text-xs font-bold text-gray-800 border border-gray-100">
                    Pool: {row.poolName || row.poolId}
                  </div>

                  {isDifferentPool && (
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-red-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl shadow-sm text-[10px] md:text-xs font-bold animate-pulse">
                      Different Pool
                    </div>
                  )}
                </div>

                <div className="p-3 md:p-6 flex-grow flex flex-col justify-between h-full md:h-auto min-w-0">
                  {/* Mobile Content Layout */}
                  <div className="md:hidden flex flex-col gap-1 h-full justify-center">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1">{rest.name}</h3>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                         <div className="flex items-center justify-center bg-green-600 text-white w-4 h-4 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-current" />
                         </div>
                         <span className="font-bold text-gray-900">{Number(rest.rating) > 0 ? Number(rest.rating).toFixed(1) : 'New'}</span>
                         <span className="text-gray-400">•</span>
                         <span className="font-bold text-gray-900">{rest.deliveryTime} mins</span>
                    </div>

                    <p className="text-sm text-gray-500 truncate">
                        {(rest.cuisine || []).join(', ')}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                         <span>₹{(rest.costForTwo || 0) / 100} for two</span>
                    </div>
                    <div className="mt-2">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 border border-green-100 shadow-sm">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 mr-1.5">Pool</span>
                         <span className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{row.poolName || row.poolId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Content Layout */}
                  <div className="hidden md:block">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-primary transition-colors">{rest.name}</h3>
                      <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                        {rest.deliveryTime} min
                      </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar mask-fade-right">
                      {(rest.cuisine || []).map((c, i) => (
                        <span key={i} className="whitespace-nowrap px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100 flex-shrink-0">
                          {c}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                          <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
                          <span className="text-xs font-bold text-green-700">{Number(rest.rating) > 0 ? Number(rest.rating).toFixed(1) : 'New'}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">•</span>
                        <span className="text-xs text-gray-500 font-medium">₹{(rest.costForTwo || 0) / 100} for two</span>
                      </div>
                      <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View Menu <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {poolSwitchConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl md:rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl md:rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Switch pools?
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your cart currently has items from <span className="font-semibold text-gray-900">{poolSwitchConfirm.fromPoolName}</span>.
                  Switching to <span className="font-semibold text-gray-900">{poolSwitchConfirm.toPoolName}</span> will clear your cart.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPoolSwitchConfirm(null)}
                className="px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
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
                className="px-4 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusRestaurants;
