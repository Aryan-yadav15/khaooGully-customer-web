import React, { useEffect, useState } from 'react';
import { MapPin, Loader2, Building2, Check, Sparkles, X } from 'lucide-react';
import { getCampuses } from '../services/api';
import type { Campus } from '../types';

interface CampusSelectorModalProps {
  isOpen: boolean;
  onSelect: (campusId: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

// Campuses that are operationally active
const OPERATIONAL_CAMPUS_CODES = ['C5-1'];

const CampusSelectorModal: React.FC<CampusSelectorModalProps> = ({
  isOpen,
  onSelect,
  onClose,
  title = 'Set Your Delivery Location',
  subtitle = 'Select your campus to start ordering with pooled delivery',
}) => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCampuses();
    }
  }, [isOpen]);

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const data = await getCampuses();
      setCampuses(data);
    } catch (err) {
      console.error('Failed to fetch campuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCampusId) return;
    setSaving(true);
    try {
      await onSelect(selectedCampusId);
    } finally {
      setSaving(false);
    }
  };

  // Sort campuses: operational first, then by name
  const sortedCampuses = [...campuses].sort((a, b) => {
    const aIsOperational = OPERATIONAL_CAMPUS_CODES.includes(a.code);
    const bIsOperational = OPERATIONAL_CAMPUS_CODES.includes(b.code);
    const aHasPools = aIsOperational || (a.activePoolCount || 0) > 0;
    const bHasPools = bIsOperational || (b.activePoolCount || 0) > 0;
    if (aHasPools === bHasPools) return a.name.localeCompare(b.name);
    return aHasPools ? -1 : 1;
  });

  // Filter to only show active campuses
  const activeCampuses = sortedCampuses.filter((campus) => {
    const isOperational = OPERATIONAL_CAMPUS_CODES.includes(campus.code);
    return isOperational || (campus.activePoolCount || 0) > 0;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => onClose?.()}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="absolute right-0 top-0 -mt-1 -mr-1 p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors disabled:opacity-50"
                aria-label="Close"
                title="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <MapPin className="w-6 h-6 text-primary-light" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm text-gray-400">{subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <Sparkles className="w-4 h-4 text-primary-light" />
              <p className="text-xs text-gray-300">
                Pool with others to save on delivery fees!
              </p>
            </div>
          </div>
        </div>

        {/* Campus List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeCampuses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No active campuses available</p>
              <p className="text-sm text-gray-400 mt-1">Please check back later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCampuses.map((campus) => {
                const isSelected = selectedCampusId === campus.id;
                
                return (
                  <button
                    key={campus.id}
                    onClick={() => setSelectedCampusId(campus.id)}
                    className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                      isSelected 
                        ? 'border-primary bg-primary-light/50 shadow-lg shadow-primary/10' 
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mr-4 transition-colors ${
                      isSelected 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                    }`}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-primary-dark' : 'text-gray-900'}`}>
                        {campus.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{campus.hotspotLocation}</span>
                      </div>
                      {(campus.activePoolCount || 0) > 0 && (
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          {campus.activePoolCount} Active Pool{campus.activePoolCount === 1 ? '' : 's'}
                        </div>
                      )}
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                      isSelected 
                        ? 'bg-primary text-white scale-100' 
                        : 'bg-gray-100 text-transparent scale-90'
                    }`}>
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleConfirm}
            disabled={!selectedCampusId || saving}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              selectedCampusId && !saving
                ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting Location...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Location
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            You can change your delivery location anytime from settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampusSelectorModal;
