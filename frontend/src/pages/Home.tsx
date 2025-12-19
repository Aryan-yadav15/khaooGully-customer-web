import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Building2, ArrowRight, Lock } from 'lucide-react';
import { getCampuses } from '../services/api';
import type { Campus } from '../types';

// Campuses that are operationally active (always show as active even if no pools currently)
const OPERATIONAL_CAMPUS_CODES = ['C5-1'];

const Home: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campusesData = await getCampuses();
        setCampuses(campusesData);
      } catch (err) {
        console.error(err);
        setError('Failed to load campuses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCampusSelect = (campusId: string) => {
    navigate(`/campus/${campusId}/restaurants`);
  };

  const sortedCampuses = [...campuses].sort((a, b) => {
    const aIsOperational = OPERATIONAL_CAMPUS_CODES.includes(a.code);
    const bIsOperational = OPERATIONAL_CAMPUS_CODES.includes(b.code);
    const aHasPools = aIsOperational || (a.activePoolCount || 0) > 0;
    const bHasPools = bIsOperational || (b.activePoolCount || 0) > 0;
    if (aHasPools === bHasPools) return a.name.localeCompare(b.name);
    return aHasPools ? -1 : 1;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-12">
      <div className="mb-6 md:mb-16 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-3xl p-5 md:p-12 shadow-xl text-white text-center">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-full mb-4 md:mb-6 shadow-inner border border-white/10 animate-in zoom-in duration-500">
            <MapPin className="w-6 h-6 md:w-8 md:h-8 text-primary-light" />
          </div>
          <h1 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
            Where are you <span className="text-primary-light">ordering from?</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Select your campus to join active food pools, save on delivery fees, and eat together.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedCampuses.map((campus) => {
          const isOperational = OPERATIONAL_CAMPUS_CODES.includes(campus.code);
          const hasActivePools = isOperational || (campus.activePoolCount || 0) > 0;

          if (hasActivePools) {
            return (
              <button
                key={campus.id}
                onClick={() => handleCampusSelect(campus.id)}
                className="flex items-center p-4 md:p-6 bg-gradient-to-br from-white to-green-50/50 rounded-xl md:rounded-3xl shadow-md hover:shadow-xl border border-green-200 hover:border-green-500 transition-all duration-300 group text-left hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-green-100/40 transition-colors"></div>
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-2xl group-hover:bg-primary-light group-hover:text-primary transition-colors mr-4 md:mr-5 flex-shrink-0">
                  <Building2 className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{campus.name}</h3>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 transform group-hover:translate-x-1" />
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mb-4 truncate">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{campus.hotspotLocation}</span>
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-light text-primary-dark text-xs font-bold uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                    {campus.activePoolCount && campus.activePoolCount > 0 
                      ? `${campus.activePoolCount} Active Pool${campus.activePoolCount === 1 ? '' : 's'}`
                      : 'Pools Active'}
                  </div>
                </div>
              </button>
            );
          }

          return (
            <div
              key={campus.id}
              className="relative flex items-center p-4 md:p-6 bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-50 text-left opacity-70 hover:opacity-100 transition-opacity"
              aria-disabled="true"
            >
              <div className="flex items-center w-full opacity-40 blur-[1px]">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-2xl mr-4 md:mr-5 flex-shrink-0">
                  <Building2 className="w-6 h-6 md:w-8 md:h-8 text-gray-300" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{campus.name}</h3>
                    <ArrowRight className="w-5 h-5 text-gray-200" />
                  </div>
                  <div className="flex items-center text-gray-400 text-sm truncate">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{campus.hotspotLocation}</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 text-gray-500 text-xs font-bold shadow-sm">
                  <Lock className="w-3.5 h-3.5" />
                  Coming soon
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
