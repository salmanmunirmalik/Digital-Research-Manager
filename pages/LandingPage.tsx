import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BeakerIcon, 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoMode = () => {
    demoLogin();
    navigate('/dashboard');
  };

  const features = [
    {
      icon: BeakerIcon,
      title: 'Lab Management',
      description: 'Streamline your research operations with comprehensive lab management tools.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: DocumentTextIcon,
      title: 'Protocol Management',
      description: 'Create, organize, and share research protocols with your team.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Data Analytics',
      description: 'Advanced data analysis tools for research insights and visualization.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Foster collaboration with real-time sharing and communication tools.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: CogIcon,
      title: 'Research Tools',
      description: 'Access to specialized tools for molecular biology and bioinformatics.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control.',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Research Protocols' },
    { number: '500+', label: 'Lab Members' },
    { number: '50+', label: 'Research Institutions' },
    { number: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">DR</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Research Lab</h1>
                <p className="text-xs text-gray-500 -mt-1">Digital Research Manager</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Research Lab</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
              The comprehensive digital platform that streamlines lab operations, 
              enhances collaboration, and accelerates scientific discovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center"
              >
                Sign Up
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 inline-flex items-center"
              >
                Sign In
                <RocketLaunchIcon className="w-5 h-5 ml-2" />
              </Link>
              <button
                onClick={handleDemoMode}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center"
              >
                Demo Mode
                <StarIcon className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12 text-center">
            Expected Target 2026
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Modern Research
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From protocol management to data analysis, our platform provides the tools 
              researchers need to work efficiently and collaboratively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Research Lab?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of researchers who are already using our platform 
            to accelerate their scientific discoveries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center justify-center"
            >
              Sign Up Now
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">DR</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Research Lab</h3>
                  <p className="text-sm text-gray-400">Digital Research Manager</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering researchers with the tools they need to accelerate 
                scientific discovery and collaboration.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Digital Research Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
