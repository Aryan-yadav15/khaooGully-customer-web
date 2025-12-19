import React, { useState, useEffect } from 'react';
import { X, MapPin, Check, Lock } from 'lucide-react';
import { getCampuses } from '../services/api';
import { useAuth } from '../context/useAuth';
import { isCampusServed } from '../config/servedCampuses';
import type { Campus } from '../types';

interface CampusSelectorProps {
  isOpen: boolean;
  onClose?: () => void;
  isFirstTime?: boolean;
}

const CampusSelector: React.FC<CampusSelectorProps> = ({ isOpen, onClose, isFirstTime = false }) => {
  const { setDefaultCampus } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCampuses();
    }
  }, [isOpen]);

  const loadCampuses = async () => {
    try {
      setLoading(true);
      const data = await getCampuses();
      setCampuses(data);
    } catch (error) {
      console.error('Failed to load campuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      await setDefaultCampus(selected);
      onClose?.();
    } catch (error) {
      console.error('Failed to set campus:', error);
      alert('Failed to set location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {isFirstTime ? 'Welcome! Choose Your Location' : 'Change Location'}
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                {isFirstTime 
                  ? 'Select your campus to see available restaurants'
                  : 'Select a different campus to browse'}
              </p>
            </div>
            {!isFirstTime && onClose && (
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Campus List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : campuses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No campuses available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campuses.map((campus) => {
                const isServed = isCampusServed(campus.code);
                const isSelected = selected === campus.id;
                
                return (
                  <button
                    key={campus.id}
                    onClick={() => isServed && setSelected(campus.id)}
                    disabled={!isServed}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden ${
                      !isServed
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'border-primary bg-primary/5 shadow-md hover:shadow-lg'
                        : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-lg'
                    }`}
                  >
                    {/* Locked overlay */}
                    {!isServed && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="text-center px-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Lock className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Coming Soon</p>
                          <p className="text-xs text-gray-500">Not serving yet</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{campus.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{campus.code}</p>
                      </div>
                      {isServed && isSelected && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{campus.hotspotLocation}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-4">
            {!isFirstTime && onClose && (
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSelect}
              disabled={!selected || saving}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusSelector;
