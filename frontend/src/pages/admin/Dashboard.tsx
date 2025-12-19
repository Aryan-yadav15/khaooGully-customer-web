import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, UtensilsCrossed, Users, ArrowRight, TrendingUp, Activity, ShieldCheck, Award } from 'lucide-react';
import { getCampuses, getPools, getRestaurants } from '../../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    campuses: 0,
    restaurants: 0,
    pools: 0,
    orders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [campuses, pools, restaurants] = await Promise.all([
          getCampuses(),
          getPools(),
          getRestaurants()
        ]);
        
        setStats({
          campuses: campuses.length,
          pools: pools.length,
          restaurants: restaurants.length,
          orders: 0 // Placeholder as we don't have an endpoint for total orders yet
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: 'Total Campuses', 
      value: stats.campuses, 
      icon: MapPin, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    { 
      label: 'Total Restaurants', 
      value: stats.restaurants, 
      icon: UtensilsCrossed, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      border: 'border-orange-100'
    },
    { 
      label: 'Active Pools', 
      value: stats.pools, 
      icon: Building2, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-green-100'
    },
    { 
      label: 'Total Orders', 
      value: '-', 
      icon: Users, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    },
  ];

  const actionCards = [
    {
      title: 'Manage Campuses',
      description: 'Add, edit, or view campus locations and delivery zones',
      icon: MapPin,
      link: '/admin/campuses',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      hover: 'group-hover:bg-blue-600 group-hover:text-white'
    },
    {
      title: 'Manage Restaurants',
      description: 'Add restaurants, update menus, and manage availability',
      icon: UtensilsCrossed,
      link: '/admin/restaurants',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      hover: 'group-hover:bg-orange-600 group-hover:text-white'
    },
    {
      title: 'Manage Pools',
      description: 'Create and monitor delivery pools for optimized logistics',
      icon: Building2,
      link: '/admin/pools',
      color: 'text-green-600',
      bg: 'bg-green-50',
      hover: 'group-hover:bg-green-600 group-hover:text-white'
    },
    {
      title: 'Manage Promotions',
      description: 'Create promotional banners and feature restaurants on homepage',
      icon: Award,
      link: '/admin/promotions',
      color: 'text-lime-600',
      bg: 'bg-lime-50',
      hover: 'group-hover:bg-lime-600 group-hover:text-white'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-10 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm font-medium uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-gray-400 max-w-xl">
              Welcome back! Here's what's happening across your campuses and restaurants today.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              Today
            </button>
            <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors text-gray-400 hover:text-white">
              Week
            </button>
            <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors text-gray-400 hover:text-white">
              Month
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, index) => (
          <div key={index} className={`bg-white rounded-3xl p-6 border ${stat.border} shadow-soft hover:shadow-lg transition-all duration-300 group`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${stat.bg} ${stat.color} flex items-center gap-1`}>
                <TrendingUp className="w-3 h-3" />
                +12%
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900">
                {loading ? <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg" /> : stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Quick Actions
      </h2>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actionCards.map((card, index) => (
          <Link 
            key={index}
            to={card.link} 
            className="group bg-white rounded-3xl p-1 shadow-soft hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
          >
            <div className="bg-white rounded-[20px] p-7 h-full flex flex-col">
              <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-6 transition-all duration-300 ${card.hover} shadow-sm`}>
                <card.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                {card.description}
              </p>
              
              <div className="flex items-center text-sm font-bold text-gray-900 group-hover:text-primary transition-colors mt-auto">
                Access Module <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
