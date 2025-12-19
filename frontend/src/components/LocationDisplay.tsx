import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import CampusSelector from './CampusSelector';

const LocationDisplay: React.FC = () => {
  const { defaultCampus, user } = useAuth();
  const [showCampusSelector, setShowCampusSelector] = useState(false);

  // Don't show location display for non-logged-in users
  if (!user || !defaultCampus) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowCampusSelector(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-all shadow-sm hover:shadow-md group"
      >
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold leading-none">Location</div>
          <div className="text-sm font-bold text-gray-900 leading-tight mt-0.5 line-clamp-1">
            {defaultCampus.name}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block" />
      </button>

      <CampusSelector
        isOpen={showCampusSelector}
        onClose={() => setShowCampusSelector(false)}
        isFirstTime={false}
      />
    </>
  );
};

export default LocationDisplay;
