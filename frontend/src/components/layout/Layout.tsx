import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lime-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🍱</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Khao Gully</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 px-3 py-1.5 bg-lime-50 text-lime-700 rounded-lg text-sm font-medium">
              <span className="w-4 h-4">🏠</span>
              Home
            </Link>
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium">
              <span className="w-4 h-4">👥</span>
              Pooling
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium">
                <span className="w-4 h-4">⚙️</span>
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

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} KhaoGully. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
