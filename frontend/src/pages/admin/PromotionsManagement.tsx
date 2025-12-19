import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, Star, Users, 
  Award, Sparkles, ChevronRight, ChevronDown, Eye, EyeOff 
} from 'lucide-react';
import { promotionService } from '../../services/promotions';
import { getRestaurants } from '../../services/api';
import type { BannerStyleConfig, PromotionalBanner, PromotedRestaurant } from '../../types/promotion';
import type { Restaurant } from '../../types';

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  banner_type: string;
  category: string;
  display_order: number;
  is_active: boolean;
  max_restaurants: number;
  display_layout: string;
  style_config: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    gradient?: BannerStyleConfig['gradient'];
    badgeStyle: NonNullable<BannerStyleConfig['badgeStyle']>;
    glowEffect: boolean;
  };
}

const defaultFormData: BannerFormData = {
  title: '',
  subtitle: '',
  description: '',
  banner_type: 'powered',
  category: 'partnership',
  display_order: 0,
  is_active: true,
  max_restaurants: 10,
  display_layout: 'horizontal_scroll',
  style_config: {
    backgroundColor: '#84CC16',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
    badgeStyle: 'rounded',
    glowEffect: false
  }
};

const bannerTypeOptions = [
  { value: 'powered', label: '⚡ Powered by KhaaoGully' },
  { value: 'approved', label: '✓ KhaaoGully Approved' },
  { value: 'featured', label: '🌟 Featured' },
  { value: 'trending', label: '🔥 Trending' },
  { value: 'new', label: '✨ New on KhaaoGully' },
  { value: 'deal', label: '💰 Special Deals' }
];

const categoryOptions = [
  { value: 'partnership', label: 'Partnership' },
  { value: 'quality_badge', label: 'Quality Badge' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'featured', label: 'Featured' },
  { value: 'seasonal', label: 'Seasonal' }
];

const PromotionsManagement: React.FC = () => {
  // State
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  
  // Restaurant assignment state
  const [expandedBanner, setExpandedBanner] = useState<string | null>(null);
  const [bannerRestaurants, setBannerRestaurants] = useState<Record<string, PromotedRestaurant[]>>({});
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBanners();
    fetchRestaurants();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await promotionService.admin.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    }
  };

  const fetchBannerRestaurants = async (bannerId: string) => {
    try {
      const data = await promotionService.getBannerRestaurants(bannerId);
      setBannerRestaurants(prev => ({ ...prev, [bannerId]: data }));
    } catch (error) {
      console.error('Failed to fetch banner restaurants:', error);
    }
  };

  const toggleBannerExpand = (bannerId: string) => {
    if (expandedBanner === bannerId) {
      setExpandedBanner(null);
    } else {
      setExpandedBanner(bannerId);
      if (!bannerRestaurants[bannerId]) {
        fetchBannerRestaurants(bannerId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await promotionService.admin.updateBanner(editingBanner.id, formData);
      } else {
        await promotionService.admin.createBanner(formData);
      }
      setIsModalOpen(false);
      setEditingBanner(null);
      setFormData(defaultFormData);
      fetchBanners();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Failed to save banner. Please try again.');
    }
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      banner_type: banner.banner_type,
      category: banner.category || 'partnership',
      display_order: banner.display_order,
      is_active: banner.is_active,
      max_restaurants: banner.max_restaurants || 10,
      display_layout: banner.display_layout,
      style_config: {
        backgroundColor: banner.style_config?.backgroundColor || banner.style_config?.gradient?.from || '#84CC16',
        textColor: banner.style_config?.textColor || '#FFFFFF',
        accentColor: banner.style_config?.accentColor || '#FFFFFF',
        gradient: banner.style_config?.gradient,
        badgeStyle: banner.style_config?.badgeStyle || 'rounded',
        glowEffect: banner.style_config?.glowEffect || false
      }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (window.confirm('Are you sure you want to delete this banner? All restaurant associations will be removed.')) {
      try {
        await promotionService.admin.deleteBanner(bannerId);
        fetchBanners();
      } catch (error) {
        console.error('Failed to delete banner:', error);
        alert('Failed to delete banner.');
      }
    }
  };

  const openAssignModal = (bannerId: string) => {
    setSelectedBannerId(bannerId);
    setSearchQuery('');
    setIsAssignModalOpen(true);
  };

  const assignRestaurantToBanner = async (restaurantId: string) => {
    if (!selectedBannerId) return;
    
    try {
      await promotionService.admin.quickPromoteRestaurant(restaurantId, selectedBannerId);
      fetchBannerRestaurants(selectedBannerId);
      fetchBanners(); // Refresh counts
    } catch (error) {
      console.error('Failed to assign restaurant:', error);
      alert('Failed to assign restaurant to banner.');
    }
  };

  const removeRestaurantFromBanner = async (promotionId: string, bannerId: string) => {
    if (window.confirm('Remove this restaurant from the banner?')) {
      try {
        await promotionService.admin.removeRestaurantFromPromotion(promotionId);
        fetchBannerRestaurants(bannerId);
        fetchBanners();
      } catch (error) {
        console.error('Failed to remove restaurant:', error);
      }
    }
  };

  const getAssignedRestaurantIds = (): string[] => {
    if (!selectedBannerId || !bannerRestaurants[selectedBannerId]) return [];
    return bannerRestaurants[selectedBannerId].map(r => r.restaurant_id);
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getBannerTypeStyle = (type: string) => {
    switch (type) {
      case 'powered': return 'bg-lime-100 text-lime-700 border-lime-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'featured': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'trending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'new': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'deal': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-lime-500" />
            Promotional Banners
          </h1>
          <p className="text-gray-500 mt-2">
            Create promotional sections and assign restaurants to feature them on the homepage
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(null);
            setFormData(defaultFormData);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-lime-500 text-white rounded-xl hover:bg-lime-600 transition-colors font-semibold shadow-lg shadow-lime-500/25"
        >
          <Plus className="w-5 h-5" />
          New Banner
        </button>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Promotional Banners Yet</h3>
          <p className="text-gray-500 mb-6">Create your first promotional banner to feature restaurants on the homepage.</p>
          <button
            onClick={() => {
              setEditingBanner(null);
              setFormData(defaultFormData);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-lime-500 text-white rounded-xl hover:bg-lime-600 transition-colors font-semibold"
          >
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Banner Header */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleBannerExpand(banner.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Color Preview */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner"
                      style={{ 
                        background: banner.style_config?.gradient?.from
                          ? `linear-gradient(to bottom, ${banner.style_config.gradient.from} 0%, ${banner.style_config.gradient.from}99 25%, transparent 100%)`
                          : (banner.style_config?.backgroundColor || '#84CC16')
                      }}
                    >
                      {banner.banner_type === 'powered' ? '⚡' : 
                       banner.banner_type === 'approved' ? '✓' :
                       banner.banner_type === 'featured' ? '🌟' :
                       banner.banner_type === 'trending' ? '🔥' :
                       banner.banner_type === 'new' ? '✨' : '💰'}
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-gray-500 text-sm">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      banner.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                    
                    {/* Type Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBannerTypeStyle(banner.banner_type)}`}>
                      {banner.banner_type}
                    </span>
                    
                    {/* Restaurant Count */}
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Users className="w-4 h-4" />
                      {banner.restaurant_count || 0}
                    </span>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openAssignModal(banner.id); }}
                        className="p-2 text-lime-600 hover:bg-lime-50 rounded-lg transition-colors"
                        title="Assign Restaurants"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(banner); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(banner.id); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Expand Arrow */}
                    <div className="ml-2">
                      {expandedBanner === banner.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expanded Restaurants */}
              {expandedBanner === banner.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-700">Assigned Restaurants</h4>
                    <button
                      onClick={() => openAssignModal(banner.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-lime-500 text-white rounded-lg text-sm hover:bg-lime-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Restaurant
                    </button>
                  </div>
                  
                  {bannerRestaurants[banner.id]?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {bannerRestaurants[banner.id].map((promo) => (
                        <div 
                          key={promo.promotion_id}
                          className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200"
                        >
                          <img 
                            src={promo.restaurant_image || '/placeholder.jpg'}
                            alt={promo.restaurant_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{promo.restaurant_name}</h5>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {promo.rating}
                              </span>
                              {promo.discount_badge && (
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  {promo.discount_badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeRestaurantFromBanner(promo.promotion_id, banner.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No restaurants assigned yet. Click "Add Restaurant" to get started.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Preview */}
              <div 
                className="p-4 rounded-xl text-center"
                style={{ 
                  background: formData.style_config.gradient?.from
                    ? `linear-gradient(to bottom, ${formData.style_config.gradient.from} 0%, ${formData.style_config.gradient.from}99 25%, transparent 100%)`
                    : formData.style_config.backgroundColor,
                  color: formData.style_config.textColor
                }}
              >
                <h3 className="font-bold text-lg">{formData.title || 'Banner Preview'}</h3>
                {formData.subtitle && <p className="text-sm opacity-90">{formData.subtitle}</p>}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="⚡ Powered by KhaaoGully"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Premium Partners"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of this promotional section..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>

              {/* Type & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type *</label>
                  <select
                    required
                    value={formData.banner_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  >
                    {bannerTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Display Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Restaurants</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.max_restaurants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_restaurants: parseInt(e.target.value) || 10 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`w-full px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      formData.is_active 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                    }`}
                  >
                    {formData.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Style Config */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lime-500" />
                  Style Configuration
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.style_config.backgroundColor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          style_config: { ...prev.style_config, backgroundColor: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.style_config.backgroundColor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          style_config: { ...prev.style_config, backgroundColor: e.target.value }
                        }))}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.style_config.textColor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          style_config: { ...prev.style_config, textColor: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.style_config.textColor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          style_config: { ...prev.style_config, textColor: e.target.value }
                        }))}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-lime-500 text-white rounded-xl hover:bg-lime-600 transition-colors font-medium"
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Restaurant Modal */}
      {isAssignModalOpen && selectedBannerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Restaurant to Banner</h2>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>
            </div>
            
            {/* Restaurant List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredRestaurants.map((restaurant) => {
                const isAssigned = getAssignedRestaurantIds().includes(restaurant.id);
                return (
                  <div 
                    key={restaurant.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isAssigned 
                        ? 'bg-lime-50 border-lime-200' 
                        : 'bg-white border-gray-200 hover:border-lime-300'
                    }`}
                  >
                    <img 
                      src={restaurant.image || '/placeholder.jpg'}
                      alt={restaurant.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900">{restaurant.name}</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {restaurant.rating}
                        </span>
                        <span>•</span>
                        <span className="truncate">{restaurant.cuisine?.join(', ')}</span>
                      </div>
                    </div>
                    {isAssigned ? (
                      <span className="px-3 py-1.5 bg-lime-100 text-lime-700 rounded-lg text-sm font-medium">
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => assignRestaurantToBanner(restaurant.id)}
                        className="px-3 py-1.5 bg-lime-500 text-white rounded-lg text-sm font-medium hover:bg-lime-600 transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-full px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManagement;
