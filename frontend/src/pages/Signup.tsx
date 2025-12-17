import React, { useState } from 'react';
import { Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-[400px] w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-lime-100 to-lime-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-lime-100">
            <span className="text-4xl">🍱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Join KhaoGully</h1>
          <p className="text-gray-500">Create your account and start ordering delicious food</p>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
          >
            <Chrome className="w-6 h-6 text-gray-900" />
            Continue with Google
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Your account will be created automatically when you sign in with Google
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
