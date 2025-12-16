import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Plus, Minus, Loader2, MapPin, ArrowLeft, Search } from 'lucide-react';
import { getRestaurantDetails, getRestaurantMenu } from '../services/api';
import { useCart } from '../context/CartContext';
import type { Restaurant, Dish } from '../types';

const RestaurantDetails: React.FC = () => {
  const { poolId, restaurantId } = useParams<{ poolId: string; restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Dish[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const { addToCart, cart, updateQuantity, removeFromCart, refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || !poolId) return;
      try {
        const [restData, menuData] = await Promise.all([
          getRestaurantDetails(restaurantId),
          getRestaurantMenu(restaurantId)
        ]);
        setRestaurant(restData);
        setMenu(menuData);
        
        // Refresh cart for this pool
        await refreshCart(poolId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, poolId]);

  const getQuantityInCart = (dishId: string) => {
    const item = cart.items.find(item => item.dishId === dishId && item.restaurantId === restaurantId);
    return item ? item.quantity : 0;
  };

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

  const handleAdd = async (dish: Dish) => {
    if (poolId && restaurantId) {
      await addToCart(poolId, restaurantId, dish, 1, restaurant?.name);
    }
  };

  const handleIncrement = async (dishId: string) => {
    const item = cart.items.find(item => item.dishId === dishId && item.restaurantId === restaurantId);
    if (item) {
      await updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecrement = async (dishId: string) => {
    const item = cart.items.find(item => item.dishId === dishId && item.restaurantId === restaurantId);
    if (item) {
      if (item.quantity > 1) {
        await updateQuantity(item.id, item.quantity - 1);
      } else {
        await removeFromCart(item.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) return <div>Restaurant not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <button 
        onClick={() => navigate(-1)}
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

            <div className="flex gap-8 border-b border-gray-100 mt-8">
              <button 
                onClick={() => setActiveTab('menu')}
                className={`pb-4 font-bold text-sm transition-all relative ${
                  activeTab === 'menu' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Menu
                {activeTab === 'menu' && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 font-bold text-sm transition-all relative ${
                  activeTab === 'reviews' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Reviews (0)
                {activeTab === 'reviews' && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></span>
                )}
              </button>
            </div>
          </div>

          {activeTab === 'menu' && (
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
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  {filteredMenu.map((dish) => {
                  const quantity = getQuantityInCart(dish.id);
                  
                  return (
                    <div key={dish.id} className="bg-white p-4 md:p-5 rounded-xl md:rounded-3xl shadow-soft border border-gray-50 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="flex gap-3 md:gap-4 mb-3 md:mb-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 relative">
                          {dish.image ? (
                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                              <div className="w-8 h-8 rounded-full border-2 border-current opacity-20"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 leading-tight truncate">{dish.name}</h3>
                          <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mb-2 h-8 md:h-10">{dish.description}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-base md:text-lg font-bold text-gray-900">₹{dish.price / 100}</span>
                             
                             {dish.rating && (
                               <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border border-amber-100">
                                 <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-amber-400 text-amber-400" />
                                 <span className="text-[9px] md:text-[10px] font-bold text-amber-700">{dish.rating}</span>
                               </div>
                             )}
                             
                             <div className={`flex items-center justify-center px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border ${dish.veg ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                               {dish.veg ? (
                                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
                                    <div className="w-full h-full bg-green-600 rounded-full"></div>
                                  </div>
                                ) : (
                                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 border border-red-600 rounded-sm flex items-center justify-center p-0.5">
                                    <div className="w-full h-full bg-red-600 rounded-full"></div>
                                  </div>
                                )}
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 md:pt-4 border-t border-gray-50">
                        {quantity === 0 ? (
                          <button
                            onClick={() => handleAdd(dish)}
                            className="w-full bg-primary-light text-primary-dark font-bold py-2.5 md:py-3 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20 text-sm md:text-base"
                          >
                            Add to Cart <Plus className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-900 text-white rounded-xl p-1 shadow-lg shadow-gray-900/20">
                            <button 
                              onClick={() => handleDecrement(dish.id)} 
                              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <Minus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <span className="font-bold text-base md:text-lg w-6 md:w-8 text-center">{quantity}</span>
                            <button 
                              onClick={() => handleIncrement(dish.id)} 
                              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Cart Summary (Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-50 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Current Order</h3>
            
            {cart.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-2 border-gray-300 rounded-lg border-dashed"></div>
                </div>
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Add items from the menu to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                         {/* Placeholder for item image if available in cart context later */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.dish.name}</p>
                        <p className="text-xs text-gray-500">₹{(item.price * item.quantity) / 100}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <button 
                          onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-600 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0) / 100}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0) / 100}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/cart')}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
                >
                  Proceed to Checkout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
