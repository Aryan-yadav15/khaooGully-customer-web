import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProtectedAdminRouteProps {
    children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Shield className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-gray-600">You need admin privileges to access this page.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedAdminRoute;
