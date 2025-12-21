import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Loader2, MapPin, ArrowLeft, Search, Menu, X, ChevronDown, ShoppingBag, LogIn } from 'lucide-react';
import { getRestaurantDetails, getRestaurantMenu } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Restaurant, Dish } from '../types';

/**
 * Guest Restaurant Menu Page
 * - Allows anyone to browse restaurant menus without logging in
 * - Shows a login prompt when user tries to add to cart
 * - After login, redirects to the pool-specific restaurant page if restaurant serves their campus
 */
const RestaurantMenu: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Dish[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const toggleSection = (category: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;
      try {
        const [restData, menuData] = await Promise.all([
          getRestaurantDetails(restaurantId),
          getRestaurantMenu(restaurantId)
        ]);
        setRestaurant(restData);
        setMenu(menuData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  const normalizedMenuSearch = menuSearch.trim().toLowerCase();

  const filteredMenu = useMemo(() => {
    if (!normalizedMenuSearch) return menu;
    return menu.filter((dish) => {
      const nameMatch = (dish.name || '').toLowerCase().includes(normalizedMenuSearch);
      const descMatch = (dish.description || '').toLowerCase().includes(normalizedMenuSearch);
      const tagMatch = (dish.tags || []).some((t) => (t || '').toLowerCase().includes(normalizedMenuSearch));
      return nameMatch || descMatch || tagMatch;
    });
  }, [menu, normalizedMenuSearch]);

  const menuSections = useMemo(() => {
    const sections: Record<string, Dish[]> = {};
    let hasTags = false;

    filteredMenu.forEach(dish => {
      const category = (dish.tags && dish.tags.length > 0) ? dish.tags[0] : 'Other';
      if (dish.tags && dish.tags.length > 0) hasTags = true;
      
      if (!sections[category]) {
        sections[category] = [];
      }
      sections[category].push(dish);
    });

    // Sort each category: items with images first, then items without images
    Object.keys(sections).forEach(category => {
      sections[category].sort((a, b) => {
        const aHasImage = a.image && a.image.trim() !== '';
        const bHasImage = b.image && b.image.trim() !== '';
        
        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0;
      });
    });

    if (!hasTags) {
      const sortedItems = [...filteredMenu].sort((a, b) => {
        const aHasImage = a.image && a.image.trim() !== '';
        const bHasImage = b.image && b.image.trim() !== '';
        
        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0;
      });
      return { 'All Items': sortedItems };
    }

    return sections;
  }, [filteredMenu]);

  const scrollToCategory = (category: string) => {
    setShowCategoryModal(false);
    
    setTimeout(() => {
      const element = document.getElementById(`category-${category}`);
      if (element) {
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleAddToCart = () => {
    if (!user) {
      setShowLoginPrompt(true);
    }
    // If user is logged in, they will be redirected via AuthContext
    // to the appropriate pool-specific restaurant page
  };

  const handleLoginClick = () => {
    // Store the current restaurant ID to redirect back after login
    sessionStorage.setItem('pendingRestaurantId', restaurantId || '');
    navigate('/login');
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h3>
        <p className="text-gray-500 mb-8">The restaurant you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 md:mb-8 text-sm font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Restaurants
      </button>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Restaurant Info & Menu */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl md:rounded-3xl p-5 md:p-8 shadow-soft border border-gray-50 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="w-full md:w-auto">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">{restaurant.name}</h1>
                <p className="text-gray-500 mb-4 font-medium text-sm md:text-base">{(restaurant.cuisine || []).join(', ')}</p>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{restaurant.location || 'Infocity'}</span>
                </div>
              </div>

              <div className="w-full md:w-auto grid grid-cols-3 gap-2 md:flex md:gap-3 bg-gray-50 p-2 rounded-2xl">
                <div className="text-center px-2 md:px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="flex items-center justify-center gap-1 font-bold text-primary text-base md:text-lg">
                    {restaurant.rating} <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                  </div>
                  <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Rating</div>
                </div>
                <div className="text-center px-2 md:px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="font-bold text-gray-900 text-base md:text-lg">{restaurant.deliveryTime}</div>
                  <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Mins</div>
                </div>
                <div className="text-center px-2 md:px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="font-bold text-gray-900 text-base md:text-lg">₹{(restaurant.costForTwo || 0) / 100}</div>
                  <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">For Two</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8">
              <div className="relative group">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search for dishes..."
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {filteredMenu.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-soft border border-gray-50">
                <p className="text-gray-900 font-bold text-xl mb-2">No matching dishes</p>
                <p className="text-gray-500">Try searching for something else.</p>
                {normalizedMenuSearch && (
                  <button
                    onClick={() => setMenuSearch('')}
                    className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(menuSections).map(([category, items]) => {
                  const isCollapsed = collapsedSections[category];
                  return (
                    <div key={category} id={`category-${category}`} className="scroll-mt-28">
                      <div className="sticky top-[4.5rem] md:top-[6rem] z-20 -mx-0 px-12 md:mx-0 md:px-4 mb-4 bg-gray-500 backdrop-blur-sm py-2 border-[2px] rounded-2xl border-gray-200/50">
                        <button 
                          onClick={() => toggleSection(category)}
                          className="w-full flex justify-between items-center gap-3 group"
                        >
                          <h3 className="text-sm md:text-md font-bold text-gray-600">{category} ({items.length})</h3>
                          <div className={`text-gray-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                            <ChevronDown />
                          </div>
                        </button>
                      </div>
                      
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                          {items.map((dish) => (
                            <div key={dish.id} className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 flex flex-row md:flex-col gap-4 md:gap-0 h-full group">
                              {/* Image Container - Only show if image exists */}
                              {dish.image && dish.image.trim() !== '' && (
                                <div className="relative w-32 h-32 md:w-full md:aspect-[4/3] md:h-auto flex-shrink-0 rounded-xl md:rounded-2xl overflow-hidden bg-gray-50 md:mb-5">
                                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  {/* Rating Badge - Desktop Only */}
                                  {dish.rating && (
                                    <div className="hidden md:flex absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-bold items-center gap-1.5 shadow-sm">
                                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                      {dish.rating}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 flex flex-col min-w-0">
                                <div className="flex justify-between items-start gap-2 md:gap-3 mb-1 md:mb-3">
                                  <h3 className="font-bold text-gray-900 text-base md:text-2xl leading-tight line-clamp-2">{dish.name}</h3>
                                  {/* Veg/Non-veg Icon - Desktop Only */}
                                  <div className={`hidden md:block flex-shrink-0 mt-1.5 ${dish.veg ? 'border-green-600' : 'border-red-600'} border-2 rounded p-[2px]`}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${dish.veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                  </div>
                                </div>
                                
                                <p className="text-xs md:text-base text-gray-500 line-clamp-2 mb-2 md:mb-6 leading-relaxed">{dish.description}</p>
                                
                                <div className="mt-auto">
                                  <div className="flex items-center justify-between mb-2 md:mb-5">
                                    <span className="font-bold text-lg md:text-2xl text-gray-900">₹{dish.price / 100}</span>
                                  </div>

                                  <div className="flex items-center gap-3 md:block">
                                    {/* Mobile Rating & Veg */}
                                    <div className="flex items-center gap-2 md:hidden">
                                      {dish.rating && (
                                        <div className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                          {dish.rating}
                                        </div>
                                      )}
                                      <div className={`flex-shrink-0 ${dish.veg ? 'border-green-600' : 'border-red-600'} border rounded-sm p-[1px]`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${dish.veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                      </div>
                                    </div>

                                    {/* Add Button - Shows login prompt for guests */}
                                    <div className="flex-1 md:w-full">
                                      <button 
                                        onClick={handleAddToCart}
                                        className="w-full py-2 md:py-4 bg-gray-50 text-primary hover:bg-emerald-400 hover:text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-lg transition-all flex items-center justify-center gap-1.5 md:gap-2.5"
                                      >
                                        Add <span className="hidden md:inline">to Cart</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sign In Prompt (Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-50 sticky top-24">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-light to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Order?</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Sign in with your university email to start adding items to your cart and enjoy pooled delivery savings!
              </p>
              <button
                onClick={handleLoginClick}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Sign In to Order
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Only @kiit.ac.in and @kims.ac.in emails are accepted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Menu Button */}
      {filteredMenu.length > 0 && (
        <div className="fixed right-6 bottom-6 z-40">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold animate-in fade-in slide-in-from-bottom-4 hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
            Menu
          </button>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-300 sm:zoom-in-95 overflow-hidden flex flex-col max-h-[80vh] will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Browse Menu</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Select a category to jump to</p>
              </div>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 custom-scrollbar">
              <div className="grid gap-2">
                {Object.entries(menuSections).map(([category, items]) => (
                  <button
                    key={category}
                    onClick={() => scrollToCategory(category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 rounded-2xl transition-all group border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary transition-colors"></div>
                      <span className="font-bold text-gray-700 group-hover:text-gray-900 text-left text-base">{category}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold group-hover:bg-primary-light group-hover:text-primary-dark transition-colors">
                      {items.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-50 bg-gray-50/50 text-center">
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal (Mobile) */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-light to-primary/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h3>
              <p className="text-gray-500 mb-6">
                Sign in with your university email to add items to cart and enjoy pooled delivery savings!
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleLoginClick}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
              
              <p className="text-xs text-gray-400 mt-4">
                Only @kiit.ac.in and @kims.ac.in emails
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;
