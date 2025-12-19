// Promotional Banners and Restaurant Promotions Types

export interface BannerStyleConfig {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  gradient?: {
    from: string;
    to: string;
  };
  iconColor?: string;
  badgeStyle?: 'rounded' | 'square' | 'pill';
  glowEffect?: boolean;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  banner_type: string;
  category?: string;
  display_order: number;
  style_config: BannerStyleConfig;
  banner_image?: string;
  icon_url?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  campus_id?: string;
  max_restaurants?: number;
  display_layout: 'horizontal_scroll' | 'grid' | 'carousel';
  created_at: string;
  updated_at: string;
  restaurant_count?: number;
  campus_name?: string;
}

export interface PromotedRestaurant {
  promotion_id: string;
  banner_id: string;
  banner_title: string;
  banner_subtitle?: string;
  banner_type: string;
  style_config: BannerStyleConfig;
  banner_order: number;
  restaurant_order: number;
  promo_text?: string;
  discount_badge?: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_image?: string;
  rating: number;
  cuisine: string[];
  cost_for_two: number;
  delivery_time: number;
  restaurant_active: boolean;
}

export interface RestaurantPromotion {
  id: string;
  restaurant_id: string;
  banner_id: string;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  promo_text?: string;
  discount_badge?: string;
  created_at: string;
  updated_at: string;
}

// Admin Forms
export interface PromotionalBannerCreate {
  title: string;
  subtitle?: string;
  description?: string;
  banner_type: string;
  category?: string;
  display_order?: number;
  style_config?: BannerStyleConfig;
  banner_image?: string;
  icon_url?: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  campus_id?: string;
  max_restaurants?: number;
  display_layout?: 'horizontal_scroll' | 'grid' | 'carousel';
}

export interface RestaurantPromotionCreate {
  restaurant_id: string;
  banner_id: string;
  display_order?: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  promo_text?: string;
  discount_badge?: string;
}
