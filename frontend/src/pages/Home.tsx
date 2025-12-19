import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, Store, ArrowRight, Star, Search, 
  Sparkles, ChevronRight, UtensilsCrossed
} from 'lucide-react';
import { getRestaurants } from '../services/api';
import { promotionService } from '../services/promotions';
import type { Restaurant } from '../types';
import type { PromotionalBanner, PromotedRestaurant } from '../types/promotion';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [bannerRestaurants, setBannerRestaurants] = useState<Record<string, PromotedRestaurant[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading, customerProfile } = useAuth();
  const hasFetchedRef = React.useRef(false);

  // Redirect logged-in users with default campus to their campus page
  useEffect(() => {
    if (!authLoading && user && customerProfile?.defaultCampusId) {
      navigate(`/campus/${customerProfile.defaultCampusId}/restaurants`, { replace: true });
    }
  }, [authLoading, user, customerProfile, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch all restaurants and all promotional banners (no campus filter)
        const [restaurantsData, activeBanners] = await Promise.all([
          getRestaurants(),
          promotionService.getActiveBanners(), // No campus filter - get all banners
        ]);

        setRestaurants(restaurantsData || []);
        setBanners(activeBanners || []);

        // Fetch restaurants for each banner
        if (activeBanners && activeBanners.length > 0) {
          const bannerData: Record<string, PromotedRestaurant[]> = {};
          await Promise.all(
            activeBanners.map(async (banner) => {
              try {
                const restaurants = await promotionService.getBannerRestaurants(banner.id);
                bannerData[banner.id] = restaurants;
              } catch (err) {
                console.error(`Failed to fetch restaurants for banner ${banner.id}:`, err);
                bannerData[banner.id] = [];
              }
            })
          );
          setBannerRestaurants(bannerData);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load restaurants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRestaurants = useMemo(() => {
    if (!normalizedSearch) return restaurants;
    return restaurants.filter((r) => {
      const nameMatch = (r.name || '').toLowerCase().includes(normalizedSearch);
      const cuisineMatch = (r.cuisine || []).some((c) =>
        c.toLowerCase().includes(normalizedSearch)
      );
      return nameMatch || cuisineMatch;
    });
  }, [restaurants, normalizedSearch]);

  // Get restaurant by ID from main list
  const getRestaurantById = (restaurantId: string) => {
    return restaurants.find((r) => r.id === restaurantId);
  };

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper to mix colors
  const mixHex = (hexA: string, hexB: string, amount: number) => {
    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
    const t = clamp01(amount);

    const a = {
      r: parseInt(hexA.slice(1, 3), 16),
      g: parseInt(hexA.slice(3, 5), 16),
      b: parseInt(hexA.slice(5, 7), 16),
    };
    const b = {
      r: parseInt(hexB.slice(1, 3), 16),
      g: parseInt(hexB.slice(3, 5), 16),
      b: parseInt(hexB.slice(5, 7), 16),
    };

    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    const rVal = a.r + (b.r - a.r) * t;
    const gVal = a.g + (b.g - a.g) * t;
    const bVal = a.b + (b.b - a.b) * t;
    return `#${toHex(rVal)}${toHex(gVal)}${toHex(bVal)}`;
  };

  const handleRestaurantClick = (restaurantId: string) => {
    // Navigate to guest restaurant menu page
    navigate(`/restaurant/${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 md:py-8">
      {/* Hero Section */}
      <div className="mb-6 md:mb-10 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-3xl p-5 md:p-10 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                <UtensilsCrossed className="w-3 h-3 md:w-4 md:h-4" />
                Food Delivery
              </div>
              <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight">
                Discover <span className="text-primary-light">Delicious Food</span>
              </h1>
              <p className="text-gray-400 max-w-xl text-sm md:text-base">
                Browse restaurants, explore menus, and order your favorites. Sign in to unlock pooled delivery savings!
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group max-w-2xl">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary-light transition-colors" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search restaurants or cuisines..."
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 text-white placeholder-gray-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/20 transition-all text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      {/* Promotional Banner Sections */}
      {!searchTerm && banners.map((banner) => {
        const promotedRestaurants = bannerRestaurants[banner.id] || [];
        if (promotedRestaurants.length === 0) return null;

        const baseColor = banner.style_config?.backgroundColor || '#84CC16';
        const titleColor = mixHex(baseColor, '#000000', 0.65);
        const subtitleColor = mixHex(baseColor, '#000000', 0.45);
        const containerStyle = {
          background: `linear-gradient(135deg, ${hexToRgba(baseColor, 0.12)} 0%, ${hexToRgba(baseColor, 0.08)} 100%)`,
          borderColor: hexToRgba(baseColor, 0.25),
        };

        return (
          <div
            key={banner.id}
            className="rounded-[2rem] p-4 md:p-5 mb-8 relative overflow-hidden border shadow-sm"
            style={containerStyle}
          >
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-5 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="p-1 rounded-full">
                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h2
                    className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter"
                    style={{ color: titleColor }}
                  >
                    {banner.title}
                  </h2>
                </div>
                <p className="font-medium ml-1 text-sm" style={{ color: subtitleColor }}>
                  {banner.subtitle || 'Discover amazing restaurants!'}
                </p>
              </div>
            </div>

            {/* Horizontal Scroll Restaurant Cards */}
            <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
              <div className="flex gap-3">
                {promotedRestaurants.map((promo) => {
                  const fullRest = getRestaurantById(promo.restaurant_id);
                  const costForTwo = fullRest?.costForTwo || promo.cost_for_two || 20000;
                  const displayPrice = Math.round(costForTwo / 100);

                  return (
                    <div
                      key={promo.promotion_id}
                      className="min-w-[75vw] w-[75vw] max-w-[320px] sm:min-w-[280px] sm:w-[280px] md:min-w-[300px] md:w-[300px] flex flex-row gap-3 group cursor-pointer bg-white p-3 rounded-xl shadow-md"
                      onClick={() => handleRestaurantClick(promo.restaurant_id)}
                    >
                      {/* Image Card */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-sm bg-white flex-shrink-0">
                        <img
                          src={promo.restaurant_image || fullRest?.image || '/placeholder-restaurant.jpg'}
                          alt={promo.restaurant_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-restaurant.jpg';
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-bold text-gray-800 leading-tight line-clamp-2 text-sm mb-1 group-hover:opacity-80 transition-opacity">
                            {promo.restaurant_name}
                          </h3>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              {promo.rating.toFixed(1)}
                            </div>
                            <span className="text-xs text-gray-500">• 30 mins</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">
                            ₹{displayPrice} for two
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">
                            {fullRest?.cuisine?.[0] || 'Food'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Button */}
            <button
              className="w-full py-2.5 mt-2 font-bold rounded-xl flex items-center justify-center gap-1 transition-all text-sm md:text-base hover:brightness-95"
              style={{ backgroundColor: hexToRgba(baseColor, 0.12), color: titleColor }}
            >
              See All <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        );
      })}

      {/* All Restaurants Section */}
      {banners.some((b) => (bannerRestaurants[b.id] || []).length > 0) && !searchTerm && (
        <div className="flex items-center gap-2 mb-4 mt-2">
          <Store className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900">All Restaurants</h2>
        </div>
      )}

      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-50">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-900 font-bold text-xl mb-2">No restaurants found</p>
          <p className="text-gray-500">
            {searchTerm ? 'Try a different search term.' : 'No restaurants available at the moment.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((rest) => (
            <div
              key={rest.id}
              onClick={() => handleRestaurantClick(rest.id)}
              className="bg-white rounded-xl md:rounded-3xl shadow-soft border border-gray-50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-row md:flex-col h-full items-center md:items-stretch"
            >
              <div className="w-28 h-28 sm:w-32 sm:h-36 md:w-full md:h-48 overflow-hidden bg-gray-100 relative shrink-0 m-2 sm:m-3 md:m-0 rounded-xl md:rounded-none">
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
              </div>

              <div className="p-3 md:p-6 flex-grow flex flex-col justify-between h-full md:h-auto min-w-0">
                {/* Mobile Content Layout */}
                <div className="md:hidden flex flex-col gap-1 h-full justify-center">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight line-clamp-1">
                    {rest.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium">
                    <div className="flex items-center justify-center bg-green-600 text-white w-4 h-4 rounded-full">
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <span className="font-bold text-gray-900">
                      {Number(rest.rating) > 0 ? Number(rest.rating).toFixed(1) : 'New'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-bold text-gray-900">{rest.deliveryTime} mins</span>
                  </div>

                  <p className="text-sm text-gray-500 truncate">
                    {(rest.cuisine || []).join(', ')}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                    <span>₹{(rest.costForTwo || 0) / 100} for two</span>
                  </div>
                </div>

                {/* Desktop Content Layout */}
                <div className="hidden md:block">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-primary transition-colors">
                      {rest.name}
                    </h3>
                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                      {rest.deliveryTime} min
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar mask-fade-right">
                    {(rest.cuisine || []).map((c, i) => (
                      <span
                        key={i}
                        className="whitespace-nowrap px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100 flex-shrink-0"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                        <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
                        <span className="text-xs font-bold text-green-700">
                          {Number(rest.rating) > 0 ? Number(rest.rating).toFixed(1) : 'New'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">•</span>
                      <span className="text-xs text-gray-500 font-medium">
                        ₹{(rest.costForTwo || 0) / 100} for two
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Menu <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
