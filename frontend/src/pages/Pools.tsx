import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Loader2, ArrowRight, MapPin, Store, Search } from 'lucide-react';
import { getPools, getCampuses, getPoolRestaurantList } from '../services/api';
import type { Pool, Campus, PoolRestaurantListItem } from '../types';
import { formatLocalTime } from '../utils/datetime';

const Pools: React.FC = () => {
  const { campusId } = useParams<{ campusId: string }>();
  const [pools, setPools] = useState<Pool[]>([]);
  const [campus, setCampus] = useState<Campus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantNamesByPoolId, setRestaurantNamesByPoolId] = useState<Record<string, string[]>>({});
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!campusId) return;
      try {
        const [poolsData, campusesData] = await Promise.all([
          getPools(campusId),
          getCampuses()
        ]);
        
        // Filter for open or scheduled pools
        const activePools = poolsData.filter((p: Pool) => {
          const status = (p.computed_status || p.manual_status || '').toLowerCase();
          return status === 'open' || status === 'scheduled';
        });
        setPools(activePools);

        setRestaurantsLoading(true);
        try {
          const poolRestaurantLists = await Promise.all(
            activePools.map(async (pool: Pool) => {
              const list = await getPoolRestaurantList(pool.id);
              return { poolId: pool.id, list };
            })
          );

          const nextMap: Record<string, string[]> = {};
          for (const item of poolRestaurantLists) {
            const names = (item.list || [])
              .filter((r: PoolRestaurantListItem) => r.active_in_pool !== false)
              .map((r: PoolRestaurantListItem) => r.restaurant_name)
              .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0);

            nextMap[item.poolId] = Array.from(new Set(names));
          }

          setRestaurantNamesByPoolId(nextMap);
        } finally {
          setRestaurantsLoading(false);
        }

        const currentCampus = campusesData.find((c: Campus) => c.id === campusId);
        setCampus(currentCampus || null);
      } catch (err) {
        console.error(err);
        setError('Failed to load pools.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campusId]);

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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPools = !normalizedSearch
    ? pools
    : pools.filter((pool) => {
        const nameMatch = (pool.name || '').toLowerCase().includes(normalizedSearch);
        const restaurants = restaurantNamesByPoolId[pool.id] || [];
        const restaurantMatch = restaurants.some((r) => r.toLowerCase().includes(normalizedSearch));
        return nameMatch || restaurantMatch;
      });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">
            Active Pools at {campus?.name || 'Campus'}
          </h2>
          <Link to="/" className="flex items-center text-gray-500 hover:text-primary text-sm font-medium transition-colors">
            <MapPin className="w-4 h-4 mr-1" />
            Change Location
          </Link>
        </div>
        <p className="text-gray-500 mb-8 max-w-2xl">Join a pool to save on delivery fees and unlock group discounts. Orders are batched together for efficiency.</p>

        <div className="relative group">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pools or restaurants..."
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
      
      {filteredPools.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-soft border border-gray-50">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-900 font-bold text-xl mb-2">No matching pools found</p>
          <p className="text-gray-500">
            {pools.length === 0 ? 'There are no active pools for this campus right now.' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {filteredPools.map((pool) => (
            <div key={pool.id} className="bg-white rounded-3xl shadow-soft border border-gray-50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary-light text-primary-dark px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    120 Minutes
                  </div>
                  <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {formatLocalTime(pool.collection_end)}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pool.name}</h3>
                
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                    Restaurants
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(restaurantNamesByPoolId[pool.id] || []).length > 0 ? (
                      (restaurantNamesByPoolId[pool.id] || []).map((name) => (
                        <span
                          key={`${pool.id}-${name}`}
                          className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium italic">
                        {restaurantsLoading ? 'Loading...' : 'No restaurants listed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Delivery Fee</span>
                  <span className="text-lg font-bold text-gray-900">₹{pool.delivery_fee_per_order / 100}</span>
                </div>

                <button
                  onClick={() => navigate(`/pool/${pool.id}`)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
                >
                  Browse Restaurants <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pools;
