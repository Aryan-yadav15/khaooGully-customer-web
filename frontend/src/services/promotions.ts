import api from './api';
import type { PromotionalBanner, PromotedRestaurant, RestaurantPromotionCreate } from '../types/promotion';

/**
 * Service for interacting with promotional banners API
 */
export const promotionService = {
  /**
   * Get all active promotional banners
   * @param campusId Optional campus filter
   */
  async getActiveBanners(campusId?: string): Promise<PromotionalBanner[]> {
    const params = new URLSearchParams();
    if (campusId) params.append('campus_id', campusId);
    
    const response = await api.get<PromotionalBanner[]>(
      `/promotions/banners/active${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data;
  },

  /**
   * Get all restaurants in a specific promotional banner
   * @param bannerId Banner ID
   */
  async getBannerRestaurants(bannerId: string): Promise<PromotedRestaurant[]> {
    const response = await api.get<PromotedRestaurant[]>(
      `/promotions/banners/${bannerId}/restaurants`
    );
    return response.data;
  },

  /**
   * Get all active promotions for a specific restaurant
   * @param restaurantId Restaurant ID
   */
  async getRestaurantPromotions(restaurantId: string): Promise<PromotedRestaurant[]> {
    const response = await api.get<PromotedRestaurant[]>(
      `/promotions/restaurants/${restaurantId}/promotions`
    );
    return response.data;
  },

  // Admin endpoints
  admin: {
    /**
     * Get all promotional banners (Admin only)
     */
    async getAllBanners(): Promise<PromotionalBanner[]> {
      const response = await api.get<PromotionalBanner[]>('/promotions/admin/banners');
      return response.data;
    },

    /**
     * Create a new promotional banner (Admin only)
     */
    async createBanner(data: any): Promise<PromotionalBanner> {
      const response = await api.post<PromotionalBanner>('/promotions/admin/banners', data);
      return response.data;
    },

    /**
     * Update a promotional banner (Admin only)
     */
    async updateBanner(bannerId: string, data: any): Promise<PromotionalBanner> {
      const response = await api.put<PromotionalBanner>(
        `/promotions/admin/banners/${bannerId}`,
        data
      );
      return response.data;
    },

    /**
     * Delete a promotional banner (Admin only)
     */
    async deleteBanner(bannerId: string): Promise<void> {
      await api.delete(`/promotions/admin/banners/${bannerId}`);
    },

    /**
     * Add a restaurant to a promotional banner (Admin only)
     */
    async addRestaurantToPromotion(data: RestaurantPromotionCreate): Promise<any> {
      const response = await api.post('/promotions/admin/restaurants/promotions', data);
      return response.data;
    },

    /**
     * Quick promote a restaurant to a banner (Admin only)
     */
    async quickPromoteRestaurant(restaurantId: string, bannerId: string): Promise<any> {
      const response = await api.post(
        `/promotions/admin/restaurants/${restaurantId}/promote/${bannerId}`
      );
      return response.data;
    },

    /**
     * Remove a restaurant from a promotional banner (Admin only)
     */
    async removeRestaurantFromPromotion(promotionId: string): Promise<void> {
      await api.delete(`/promotions/admin/restaurants/promotions/${promotionId}`);
    },

    /**
     * Update a restaurant promotion (Admin only)
     */
    async updateRestaurantPromotion(promotionId: string, data: any): Promise<any> {
      const response = await api.put(
        `/promotions/admin/restaurants/promotions/${promotionId}`,
        data
      );
      return response.data;
    },
  },
};
