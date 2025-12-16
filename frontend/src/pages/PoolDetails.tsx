import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Loader2, Search, Sparkles, MapPin, X, Store } from 'lucide-react';
import { getPoolDetails, getPoolRestaurants } from '../services/api';
import type { Pool, Restaurant } from '../types';

const PoolDetails: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!poolId) return;
      try {
        const [poolData, restaurantsData] = await Promise.all([
          getPoolDetails(poolId),
          getPoolRestaurants(poolId)
        ]);
        setPool(poolData);
        setRestaurants(restaurantsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
      </div>
    );
  }

  if (!pool) return <div>Pool not found</div>;

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
      {/* Pool Header Card */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 mb-6 md:mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="px-2 py-1 md:px-3 bg-lime-100 text-lime-800 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide">
                Active Pool
              </span>
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span>Ends in <span className="font-bold text-gray-900">115m 5s</span></span>
              </div>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs md:text-sm"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
              Leave Pool
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
            Pool - {pool.name}
          </h1>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Delivering to</p>
                <p className="font-semibold text-gray-900">Main Gate</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <span className="font-bold">₹</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Delivery Fee</p>
                <p className="font-semibold text-gray-900">₹{pool.delivery_fee_per_order / 100}</p>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-gray-500 text-sm">
            You are browsing restaurants available for this pool. All orders will be delivered together to the hotspot.
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-12">
        <div className="flex gap-4 mb-6">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Describe your craving (e.g., 'Spicy paneer under $20')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button className="px-6 py-3 bg-lime-500 text-white rounded-lg md:rounded-xl font-bold hover:bg-lime-600 transition-colors flex items-center gap-2 shadow-lg shadow-lime-200">
            <Sparkles className="w-5 h-5" />
            AI Search
          </button>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            Filters
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Top Rated
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Budget Friendly
          </button>
        </div>
      </div>

      {/* Restaurant List */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Infocity</h2>
          <p className="text-gray-500 text-sm">{filteredRestaurants.length} curated spots near you</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <div 
              key={restaurant.id}
              onClick={() => navigate(`/pool/${poolId}/restaurant/${restaurant.id}`)}
              className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="h-48 overflow-hidden bg-gray-200 relative">
                {restaurant.image ? (
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <Store className="w-12 h-12 opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  {restaurant.rating}
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm text-xs font-bold text-gray-700">
                  {restaurant.deliveryTime} mins
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{restaurant.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">{restaurant.cuisine.join(', ')}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded-md">₹{restaurant.costForTwo / 100} for two</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-md">Free Delivery</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoolDetails;
