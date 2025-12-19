import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import Pools from './pages/Pools';
import PoolDetails from './pages/PoolDetails';
import RestaurantDetails from './pages/RestaurantDetails';
import RestaurantMenu from './pages/RestaurantMenu';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CampusRestaurants from './pages/CampusRestaurants';
import Dashboard from './pages/admin/Dashboard';
import PoolsManagement from './pages/admin/PoolsManagement';
import CampusesManagement from './pages/admin/CampusesManagement';
import RestaurantsManagement from './pages/admin/RestaurantsManagement';
import PromotionsManagement from './pages/admin/PromotionsManagement';
import CampusSelectorModal from './components/CampusSelectorModal';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthErrorModal from './components/AuthErrorModal';
import { useNavigate } from 'react-router-dom';

// Inner component that has access to auth context and router
function AppContent() {
  const { user, needsCampusSelection, setDefaultCampus, loading } = useAuth();
  const navigate = useNavigate();

  const handleCampusSelect = async (campusId: string) => {
    const result = await setDefaultCampus(campusId);
    if (result.success) {
      // Check if there's a pending restaurant from before login
      const pendingRestaurantId = sessionStorage.getItem('pendingRestaurantId');
      if (pendingRestaurantId) {
        sessionStorage.removeItem('pendingRestaurantId');
        // Navigate to campus restaurants - the restaurant redirect will be handled there
        navigate(`/campus/${campusId}/restaurants`);
      } else {
        navigate(`/campus/${campusId}/restaurants`);
      }
    }
  };

  return (
    <>
      <AuthErrorModal />
      <CampusSelectorModal
        isOpen={!loading && !!user && needsCampusSelection}
        onSelect={handleCampusSelect}
        title="Welcome to KhaaoGully! 🍕"
        subtitle="Select your campus to start ordering delicious food"
      />
      <Layout>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/restaurant/:restaurantId' element={<RestaurantMenu />} />
          <Route path='/campus/:campusId/restaurants' element={<CampusRestaurants />} />
          <Route path='/campus/:campusId/pools' element={<Pools />} />
          <Route path='/pool/:poolId' element={<PoolDetails />} />
          <Route path='/pool/:poolId/restaurant/:restaurantId' element={<RestaurantDetails />} />
          <Route path='/cart' element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/order/:orderId' element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path='/admin' element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
          <Route path='/admin/pools' element={<ProtectedAdminRoute><PoolsManagement /></ProtectedAdminRoute>} />
          <Route path='/admin/campuses' element={<ProtectedAdminRoute><CampusesManagement /></ProtectedAdminRoute>} />
          <Route path='/admin/restaurants' element={<ProtectedAdminRoute><RestaurantsManagement /></ProtectedAdminRoute>} />
          <Route path='/admin/promotions' element={<ProtectedAdminRoute><PromotionsManagement /></ProtectedAdminRoute>} />
        </Routes>
      </Layout>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
