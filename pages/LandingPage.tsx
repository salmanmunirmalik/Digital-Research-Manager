import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Landing Page Test
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          If you can see this, the page is working!
        </p>
        <Link 
          to="/login" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Test Login Link
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
