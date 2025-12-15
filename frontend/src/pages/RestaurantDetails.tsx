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
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!restaurant) return <div>Restaurant not found</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Restaurants
      </button>

      <div className="bg-white rounded-none md:rounded-3xl p-0 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
            <p className="text-gray-500 mb-2">{restaurant.cuisine.join(', ')}</p>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.location || 'Infocity'}</span>
            </div>
          </div>

          <div className="flex gap-4 bg-gray-50 p-4 rounded-2xl">
            <div className="text-center px-4 border-r border-gray-200">
              <div className="flex items-center justify-center gap-1 font-bold text-green-600 text-lg">
                {restaurant.rating} <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Rating</div>
            </div>
            <div className="text-center px-4 border-r border-gray-200">
              <div className="font-bold text-gray-900 text-lg">{restaurant.deliveryTime}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Delivery</div>
            </div>
            <div className="text-center px-4">
              <div className="font-bold text-gray-900 text-lg">{restaurant.costForTwo}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">For Two</div>
            </div>
          </div>
        </div>

        <div className="flex gap-8 border-b border-gray-100 mt-8">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`pb-3 font-bold text-sm transition-colors relative ${
              activeTab === 'menu' ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Menu
            {activeTab === 'menu' && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-t-full"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 font-bold text-sm transition-colors relative ${
              activeTab === 'reviews' ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Reviews (0)
            {activeTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-t-full"></span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'menu' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Recommended ({filteredMenu.length}{normalizedMenuSearch ? `/${menu.length}` : ''})
            </h2>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search dishes (name, category, etc.)"
                className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-300"
              />
            </div>
          </div>

          {filteredMenu.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-900 font-medium text-lg mb-1">No matching dishes</p>
              <p className="text-gray-500">Try a different search.</p>
              {normalizedMenuSearch && (
                <button
                  onClick={() => setMenuSearch('')}
                  className="mt-4 text-green-600 font-medium hover:text-green-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredMenu.map((dish) => {
              const quantity = getQuantityInCart(dish.id);
              
              return (
                <div key={dish.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between gap-6 group hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {dish.veg ? (
                        <span
                          aria-label="Veg"
                          title="Veg"
                          className="w-4 h-4 border border-green-600 flex items-center justify-center p-0.5 rounded-sm"
                        >
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        </span>
                      ) : (
                        <span
                          aria-label="Non-veg"
                          title="Non-veg"
                          className="w-4 h-4 border border-red-600 flex items-center justify-center p-0.5 rounded-sm"
                        >
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                        </span>
                      )}
                      <span className={dish.veg ? 'text-xs font-semibold text-green-700' : 'text-xs font-semibold text-red-700'}>
                        {dish.veg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{dish.name}</h3>
                    <p className="text-gray-900 font-medium mb-3">₹{dish.price / 100}</p>
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-bold w-fit mb-4">
                      <Star className="w-3 h-3 fill-current" /> 4
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{dish.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 w-36 relative">
                    <div className="w-36 h-32 bg-gray-100 rounded-xl overflow-hidden relative">
                      {dish.image ? (
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover mix-blend-multiply" />
                      ) : (
                        <div className="w-full h-full bg-gray-50"></div>
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28">
                      {quantity === 0 ? (
                        <button
                          onClick={() => handleAdd(dish)}
                          className="w-full bg-white text-green-600 font-bold py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-sm uppercase tracking-wide hover:shadow-md transition-all"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="w-full bg-white text-green-600 font-bold py-2 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between px-3 text-sm">
                          <button onClick={() => handleDecrement(dish.id)} className="hover:text-green-800">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span>{quantity}</span>
                          <button onClick={() => handleIncrement(dish.id)} className="hover:text-green-800">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;
