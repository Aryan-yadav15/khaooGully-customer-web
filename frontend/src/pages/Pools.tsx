import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Loader2, ArrowRight, MapPin, Store } from 'lucide-react';
import { getPools, getCampuses } from '../services/api';
import type { Pool, Campus } from '../types';
import { formatLocalTime } from '../utils/datetime';

const Pools: React.FC = () => {
  const { campusId } = useParams<{ campusId: string }>();
  const [pools, setPools] = useState<Pool[]>([]);
  const [campus, setCampus] = useState<Campus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!campusId) return;
      try {
        const [poolsData, campusesData] = await Promise.all([
          getPools(campusId),
          getCampuses()
        ]);
        
        // Filter for open or scheduled pools
        const activePools = poolsData.filter((p: Pool) => {
          const status = (p.computed_status || p.manual_status || '').toLowerCase();
          return status === 'open' || status === 'scheduled';
        });
        setPools(activePools);

        const currentCampus = campusesData.find((c: Campus) => c.id === campusId);
        setCampus(currentCampus || null);
      } catch (err) {
        console.error(err);
        setError('Failed to load pools.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campusId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Active Pools at {campus?.name || 'Campus'}
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-500">Join a pool to save on delivery fees and unlock group discounts.</p>
          <Link to="/" className="flex items-center text-lime-600 hover:text-lime-700 text-sm font-medium">
            <MapPin className="w-4 h-4 mr-1" />
            Change Location
          </Link>
        </div>
      </div>
      
      {pools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium text-lg mb-1">No active pools found</p>
          <p className="text-gray-500">There are no active pools for this campus right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pools.map((pool) => (
            <div key={pool.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-lime-50 px-6 py-3 flex items-center justify-between border-b border-lime-100">
                <span className="text-lime-800 text-xs font-bold tracking-wide uppercase">
                  120 Minutes
                </span>
                <Store className="w-5 h-5 text-lime-600 opacity-20" />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Pool - {pool.name}</h3>
                
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Restaurants Available
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* Placeholder for restaurant names since they are not in the pool object directly */}
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                      Multiple Restaurants
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end mb-6">
                  <div className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatLocalTime(pool.collection_end)}
                  </div>
                </div>

                <div className="bg-lime-50 rounded-xl p-4 mb-6 flex justify-between items-center">
                  <span className="text-sm text-lime-900 font-medium">Delivery Fee</span>
                  <span className="text-lg font-bold text-lime-700">₹{pool.delivery_fee_per_order / 100}</span>
                </div>

                <button
                  onClick={() => navigate(`/pool/${pool.id}`)}
                  className="w-full py-3.5 bg-lime-500 text-white rounded-xl font-bold hover:bg-lime-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-lime-200"
                >
                  Browse Restaurants <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pools;
