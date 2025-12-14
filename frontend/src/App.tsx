import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import Pools from './pages/Pools';
import PoolDetails from './pages/PoolDetails';
import RestaurantDetails from './pages/RestaurantDetails';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/admin/Dashboard';
import PoolsManagement from './pages/admin/PoolsManagement';
import CampusesManagement from './pages/admin/CampusesManagement';
import RestaurantsManagement from './pages/admin/RestaurantsManagement';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
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
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
