import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingCart, User, LogOut, Home, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrders } from '../../services/api';
import type { CustomerOrderHistoryItem } from '../../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount, cartTotal, syncing, hasPendingOperations } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeOrder, setActiveOrder] = useState<CustomerOrderHistoryItem | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
  const menuCartFooterBottomClass = showIncomingOrderFooter ? 'bottom-24 md:bottom-32' : 'bottom-4';
  const needsBottomPadding = showIncomingOrderFooter || showMenuCartFooter;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-primary-light selection:text-primary-dark">
      {/* Floating Navbar */}
      <header className="sticky top-2 md:top-4 z-50 px-2 md:px-6 mb-2">
        <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md border border-white/40 shadow-soft rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:bg-white/95">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-black text-white rounded-lg md:rounded-xl p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
               <img src="/LogoCircle.svg" alt="Khaoo Gully" className="w-7 h-7 md:w-9 md:h-9" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-primary transition-colors hidden md:block">
              Khaoo Gully
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                location.pathname === '/' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            {user && (
              <Link 
                to="/profile" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname === '/profile'
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Orders
              </Link>
            )}
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-black text-white shadow-sm' 
                    : 'text-gray-500 hover:text-black hover:bg-gray-200/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link 
              to="/cart" 
              className={`relative p-2.5 rounded-xl transition-all duration-200 group ${
                itemCount > 0 ? 'bg-primary-light/30 text-primary hover:bg-primary-light' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className={`w-5 h-5 ${hasPendingOperations() ? 'animate-pulse' : ''}`} />
              {itemCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-accent text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm ${syncing ? 'animate-pulse' : ''}`}>
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Profile / Sign In */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-40">
                      <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/"
                          onClick={() => setShowUserMenu(false)}
                          className="md:hidden w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-light hover:text-primary-dark flex items-center gap-3 transition-colors"
                        >
                          <Home className="w-4 h-4" />
                          Home
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="md:hidden w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-light hover:text-primary-dark flex items-center gap-3 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-light hover:text-primary-dark flex items-center gap-3 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-light hover:text-primary-dark flex items-center gap-3 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          My Orders
                        </Link>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown - Removed */}
      </header>

      <main className={`flex-grow max-w-7xl mx-auto w-full ${needsBottomPadding ? 'pb-32' : ''}`}>
        {children}
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
              <img src="/LogoCircle.svg" alt="Khaoo Gully" className="w-8 h-8" />
              <span className="font-bold text-gray-900">Khaoo Gully</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} KhaoGully. Made with ❤️ for foodies.
            </p>
          </div>
        </div>
      </footer>

      {showMenuCartFooter && (
        <div className={`fixed inset-x-0 ${menuCartFooterBottomClass} z-[60] px-2 md:px-4 animate-in slide-in-from-bottom-4 duration-300`}>
          <button
            onClick={() => navigate('/cart')}
            className="w-full max-w-3xl mx-auto bg-gray-900 text-white rounded-xl md:rounded-2xl shadow-xl shadow-gray-900/20 px-4 py-3 md:px-5 md:py-4 flex items-center justify-between gap-3 hover:bg-black hover:scale-[1.01] transition-all duration-300 border border-white/10"
          >
            <div className="min-w-0 flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white px-2 py-0.5 rounded text-xs font-bold">{itemCount} items</span>
                <p className="text-sm font-bold text-white truncate">View Cart</p>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">Subtotal {cartSubtotalText}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 bg-white/10 px-3 py-2 rounded-lg md:rounded-xl backdrop-blur-sm group">
              <span className="text-sm font-bold group-hover:text-primary transition-colors">Checkout</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {showIncomingOrderFooter && activeOrder && (
        <div className="fixed inset-x-0 bottom-4 md:bottom-6 z-[70] px-2 md:px-4 animate-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => navigate(`/order/${activeOrder.orderId}`)}
            className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-white/50 rounded-xl md:rounded-3xl shadow-2xl shadow-primary/20 p-3 md:p-4 flex items-center justify-between gap-3 md:gap-4 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-3 md:gap-4 min-w-0 relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 text-white">
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {orderStatusLabel}
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {activeOrder.poolName || activeOrder.restaurantName || 'Your Order'}
                </p>
              </div>
            </div>

            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md relative z-10">
               <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
