import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, UtensilsCrossed, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campuses</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
            </div>
            <MapPin className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Restaurants</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
            </div>
            <UtensilsCrossed className="w-12 h-12 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Pools</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
            </div>
            <Building2 className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">-</p>
            </div>
            <Users className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link 
          to="/admin/campuses" 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <MapPin className="w-10 h-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Campuses</h2>
          <p className="text-gray-600">Add, edit, or view campus locations</p>
        </Link>

        <Link 
          to="/admin/restaurants" 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <UtensilsCrossed className="w-10 h-10 text-orange-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Restaurants</h2>
          <p className="text-gray-600">Add restaurants and manage menus</p>
        </Link>

        <Link 
          to="/admin/pools" 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <Building2 className="w-10 h-10 text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Pools</h2>
          <p className="text-gray-600">Create and manage delivery pools</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
