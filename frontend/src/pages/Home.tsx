import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Building2, ArrowRight } from 'lucide-react';
import { getCampuses } from '../services/api';
import type { Campus } from '../types';

const Home: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const data = await getCampuses();
        setCampuses(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load campuses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampuses();
  }, []);

  const handleCampusSelect = (campusId: string) => {
    navigate(`/campus/${campusId}/pools`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-lime-100 rounded-full mb-6">
          <MapPin className="w-6 h-6 text-lime-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Where are you <span className="text-lime-600">ordering from?</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Select your campus to join active food pools, save on delivery fees, and eat together.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {campuses.map((campus) => (
          <button
            key={campus.id}
            onClick={() => handleCampusSelect(campus.id)}
            className="flex items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all group text-left"
          >
            <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors mr-5">
              <Building2 className="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{campus.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="w-3 h-3 mr-1" />
                    {campus.hotspotLocation}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-lime-600 transition-colors" />
              </div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-lime-50 text-lime-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mr-1.5"></span>
                Active Pools
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
