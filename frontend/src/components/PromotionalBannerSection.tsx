import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Sparkles, Plus, ChevronRight } from 'lucide-react';
import { promotionService } from '../services/promotions';
import type { PromotionalBanner, PromotedRestaurant } from '../types/promotion';

interface Props {
  banner: PromotionalBanner;
  poolId?: string;
}

const PromotionalBannerSection: React.FC<Props> = ({ banner, poolId }) => {
  const [restaurants, setRestaurants] = useState<PromotedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, [banner.id]);

  const loadRestaurants = async () => {
    try {
      const data = await promotionService.getBannerRestaurants(banner.id);
      const limitedData = banner.max_restaurants 
        ? data.slice(0, banner.max_restaurants) 
        : data;
      setRestaurants(limitedData);
    } catch (error) {
      console.error('Failed to load banner restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || restaurants.length === 0) return null;

  // Create a soft gradient like the Deal Rush purple style
  const baseColor = banner.style_config.gradient?.from || banner.style_config.backgroundColor || '#84CC16';
  const textColor = banner.style_config.textColor || '#1a1a1a';

  return (
    <div 
      className="mb-8 rounded-3xl p-5 md:p-6 relative overflow-hidden from-red-400 to-transparent"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/60 rounded-full backdrop-blur-sm">
            <Sparkles className="w-5 h-5" style={{ color: baseColor }} fill="currentColor" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black italic tracking-tight uppercase" style={{ color: textColor }}>
            {banner.title}
          </h2>
        </div>
        {banner.subtitle && (
          <span className="text-sm font-medium opacity-70" style={{ color: textColor }}>
            {banner.subtitle}
          </span>
        )}
      </div>

      {/* Horizontal Scroll Restaurant Cards */}
      <div className="overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2">
        <div className="flex gap-4">
          {restaurants.map((restaurant) => {
            const displayPrice = Math.round(restaurant.cost_for_two / 100);
            const originalPrice = Math.round(displayPrice * 1.4);

            return (
              <Link
                key={restaurant.promotion_id}
                to={poolId ? `/pool/${poolId}/restaurant/${restaurant.restaurant_id}` : `/restaurant/${restaurant.restaurant_id}`}
                className="min-w-[36vw] w-[36vw] max-w-[180px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] flex flex-col gap-2 group"
              >
                {/* Image Card */}
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-white">
                  <img
                    src={restaurant.restaurant_image || '/placeholder-restaurant.jpg'}
                    alt={restaurant.restaurant_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-restaurant.jpg';
                    }}
                  />
                  
                  {/* Add Button Overlay */}
                  <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-green-600 hover:scale-110 hover:bg-green-50 transition-all z-10">
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>

                  {/* Discount Badge */}
                  {(restaurant.discount_badge || restaurant.promo_text) && (
                    <div 
                      className="absolute top-0 left-0 text-white text-[10px] font-bold px-2 py-1 rounded-br-xl shadow-md z-10"
                      style={{ backgroundColor: baseColor }}
                    >
                      {restaurant.discount_badge || restaurant.promo_text}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-start gap-1.5 mb-1">
                    <div className="mt-1 w-3 h-3 border border-green-600 flex items-center justify-center rounded-[2px] flex-shrink-0 bg-white">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    </div>
                    <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2 text-xs group-hover:text-primary transition-colors">
                      {restaurant.restaurant_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-gray-400 line-through">₹{originalPrice}</span>
                    <span className="text-xs font-bold text-gray-900">₹{displayPrice}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {restaurant.rating.toFixed(1)}
                    </div>
                    <span className="text-[10px] text-gray-500 truncate">
                      {restaurant.cuisine[0] || 'Food'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* See All Button */}
      <div className="mt-4">
        <button 
          className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1 transition-all hover:gap-2"
          style={{ 
            backgroundColor: `${baseColor}20`,
            color: textColor 
          }}
        >
          See All Live Deals
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PromotionalBannerSection;
