import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ClockIcon,
  BookOpenIcon,
  BeakerIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CircleStackIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ShareIcon,
  FireIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const CurrentTrendsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserProfile({
        specialization: response.data.specialization || 'General Research',
        department: response.data.department || 'Research',
        research_interests: response.data.research_interests || [],
        current_research_areas: response.data.current_research_areas || [],
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({
        specialization: 'General Research',
        department: 'Research',
        research_interests: [],
        current_research_areas: [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Current Research Trends
                </h1>
                <p className="text-gray-600 mt-1">Discover the latest developments and emerging areas in scientific research</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <button className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all flex items-center space-x-2">
                <ShareIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Share</span>
              </button>
            </div>
          </div>
          
          {/* User Profile Badge */}
          {userProfile && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <AcademicCapIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{userProfile.specialization}</span>
                {userProfile.research_interests.length > 0 && (
                  <span className="text-gray-500 ml-2">
                    • {userProfile.research_interests.slice(0, 2).join(', ')}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Trending Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trending Research Areas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BeakerIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Trending Research Areas</h4>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Single-cell multi-omics analysis</div>
                  <div className="text-sm text-gray-600">Rapid growth in understanding cellular heterogeneity</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">AI-driven drug discovery</div>
                  <div className="text-sm text-gray-600">Machine learning accelerating pharmaceutical research</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">CRISPR-based therapeutics</div>
                  <div className="text-sm text-gray-600">Gene editing moving to clinical applications</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Quantum computing in biology</div>
                  <div className="text-sm text-gray-600">Next-generation computing for complex simulations</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Organoid technology</div>
                  <div className="text-sm text-gray-600">3D cell cultures revolutionizing drug testing</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Methodology Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Methodology Trends</h4>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Reproducible research practices</div>
                  <div className="text-sm text-gray-600">Focus on transparency and data sharing</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Open science initiatives</div>
                  <div className="text-sm text-gray-600">Increased collaboration and open access</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Collaborative research networks</div>
                  <div className="text-sm text-gray-600">Cross-institutional partnerships</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Data sharing platforms</div>
                  <div className="text-sm text-gray-600">Standardized repositories and protocols</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Pre-registration of studies</div>
                  <div className="text-sm text-gray-600">Reducing publication bias and improving rigor</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Innovation Opportunities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Innovation Opportunities</h4>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Cross-disciplinary collaborations</div>
                  <div className="text-sm text-gray-600">Biology meets computer science and engineering</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Citizen science projects</div>
                  <div className="text-sm text-gray-600">Public engagement in research</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Open-source research tools</div>
                  <div className="text-sm text-gray-600">Community-driven software development</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Sustainable research practices</div>
                  <div className="text-sm text-gray-600">Eco-friendly laboratory operations</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Virtual and augmented reality</div>
                  <div className="text-sm text-gray-600">Enhanced visualization and training</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Research Challenges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Research Challenges</h4>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <ClockIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Data reproducibility issues</div>
                  <div className="text-sm text-gray-600">Need for standardized protocols</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ClockIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Publication bias</div>
                  <div className="text-sm text-gray-600">Negative results undervalued</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ClockIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Funding constraints</div>
                  <div className="text-sm text-gray-600">Competitive grant landscape</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ClockIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Ethical considerations</div>
                  <div className="text-sm text-gray-600">AI and gene editing ethics</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ClockIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">Time to publication</div>
                  <div className="text-sm text-gray-600">Extended peer review processes</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Emerging Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CircleStackIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Emerging Tools</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <FireIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">AI-powered microscopy</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <FireIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Cloud-based analysis</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <FireIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Automated lab workflows</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <FireIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Collaborative platforms</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Funding Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Funding Trends</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <StarIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">AI-healthcare grants</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <StarIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Climate research funding</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <StarIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Early career programs</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <StarIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Public-private partnerships</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Community Engagement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Community Engagement</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <GlobeAltIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Virtual conferences</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <GlobeAltIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Open Personal NoteBooks</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <GlobeAltIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Research transparency</div>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <GlobeAltIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">Peer-to-peer learning</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentTrendsPage;
