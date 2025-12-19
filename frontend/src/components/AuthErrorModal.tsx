import React from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import { AlertTriangle } from 'lucide-react';

const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError } = useAuth();

  const formatErrorMessage = (message: string) => {
    // Split by the domains we want to bold
    const parts = message.split(/(@kiit\.ac\.in|@kims\.ac\.in)/gi);
    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase();
      if (lowerPart === '@kiit.ac.in' || lowerPart === '@kims.ac.in') {
        return (
          <span key={i} className="font-bold text-gray-900 bg-lime-100 px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <Modal
      isOpen={!!authError}
      onClose={clearAuthError}
      title="Authentication Error"
    >
      <div className="text-center px-2 pb-2">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="mb-8">
          <p className="text-gray-600 text-lg leading-relaxed">
            {authError && formatErrorMessage(authError)}
          </p>
        </div>

        <button
          onClick={clearAuthError}
          className="w-full py-3.5 px-4 bg-lime-500 hover:bg-lime-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-lime-200 hover:shadow-lime-300 active:scale-[0.98]"
        >
          Understood
        </button>
      </div>
    </Modal>
  );
};

export default AuthErrorModal;
