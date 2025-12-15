import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingCart, User, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrders } from '../../services/api';
import type { CustomerOrderHistoryItem } from '../../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount, cartTotal } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeOrder, setActiveOrder] = useState<CustomerOrderHistoryItem | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isRestaurantMenuRoute = useMemo(() => {
    return /^\/pool\/[^/]+\/restaurant\/[^/]+$/.test(location.pathname);
  }, [location.pathname]);

  const cartSubtotalText = useMemo(() => {
    const rupees = cartTotal / 100;
    return `₹${rupees.toFixed(0)}`;
  }, [cartTotal]);

  const isUndeliveredOrder = (order: CustomerOrderHistoryItem) => {
    const status = (order.status || '').toLowerCase();
    if (!status) return false;
    return status !== 'delivered' && status !== 'cancelled' && status !== 'canceled' && status !== 'failed';
  };

  const orderStatusLabel = useMemo(() => {
    const status = (activeOrder?.status || '').toLowerCase();
    if (!status) return 'Incoming';
    if (status === 'pooling') return 'Order received';
    if (status === 'accepted') return 'Preparing';
    if (status === 'out_for_delivery') return 'On the way';
    return 'Incoming';
  }, [activeOrder?.status]);

  useEffect(() => {
    let mounted = true;
    let interval: number | undefined;

    const fetchActiveOrder = async () => {
      if (!user) {
        if (mounted) setActiveOrder(null);
        return;
      }
      try {
        const orders = await getCustomerOrders(10, 0);
        const next = (orders || []).find(isUndeliveredOrder) || null;
        if (mounted) setActiveOrder(next);
      } catch {
        // Ignore: footer is best-effort
      }
    };

    void fetchActiveOrder();
    interval = window.setInterval(fetchActiveOrder, 30000);

    return () => {
      mounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, [user]);

  const showIncomingOrderFooter = !!user && !!activeOrder;
  const showMenuCartFooter = isRestaurantMenuRoute && itemCount > 0;
  const menuCartFooterBottomClass = showIncomingOrderFooter ? 'bottom-24' : 'bottom-4';
  const needsBottomPadding = showIncomingOrderFooter || showMenuCartFooter;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-black rounded-md">
               <img src="/LogoCircle.svg" alt="Khao Gully" className="w-12 h-12" />
            </div>
            <span className="text-xl font-bold text-gray-900">Khao Gully</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {isAdmin && (
              <Link to="/admin" className="flex items-center text-black hover:text-gray-900 text-sm font-medium">
                <span className="w-4 h-4"></span>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium"
                >
                  {user.email?.charAt(0).toUpperCase()}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}

            <Link to="/cart" className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className={`flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full ${needsBottomPadding ? 'pb-32' : ''}`}>
        {children}
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} KhaoGully. All rights reserved.
        </div>
      </footer>

      {showMenuCartFooter && (
        <div className={`fixed inset-x-0 ${menuCartFooterBottomClass} z-40 px-4`}>
          <button
            onClick={() => navigate('/cart')}
            className="w-full max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3 hover:shadow-xl transition-shadow"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{itemCount} item{itemCount === 1 ? '' : 's'} added</p>
              <p className="text-xs text-gray-600 truncate">Subtotal {cartSubtotalText}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-2 rounded-xl bg-lime-600 text-white text-sm font-semibold">View cart</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {showIncomingOrderFooter && activeOrder && (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4">
          <button
            onClick={() => navigate(`/order/${activeOrder.orderId}`)}
            className="w-full max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center flex-shrink-0">
                <span className="text-lime-700 font-bold text-xs text-center leading-tight px-2">
                  {orderStatusLabel}
                </span>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">Order incoming!</p>
                <p className="text-xs text-gray-600 truncate">
                  {activeOrder.poolName || activeOrder.restaurantName}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
