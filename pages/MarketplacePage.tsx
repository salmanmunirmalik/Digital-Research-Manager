/**
 * Unified Marketplace Page
 * Combines Suppliers (products) and Services (expertise) into one marketplace
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  BriefcaseIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  BeakerIcon,
  ChartBarIcon,
  AcademicCapIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  PackageIcon,
  MapPinIcon,
  HeartIcon
} from '../components/icons';

interface ServiceListing {
  id: string;
  provider_id: string;
  service_title: string;
  service_description: string;
  service_type: string;
  pricing_model: string;
  base_price: number;
  currency: string;
  typical_turnaround_days: number;
  average_rating: number;
  total_ratings: number;
  total_projects_completed: number;
  provider_name: string;
  provider_position: string;
  provider_institution: string;
  expertise_areas: string[];
  techniques_offered: string[];
}

interface Supplier {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  specialization: string[];
  description: string;
}

const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'services'>('suppliers');
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Services filters
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'recent'>('rating');
  
  // Suppliers filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  
  // Mock suppliers data
  const suppliers: Supplier[] = [
    {
      id: '1',
      name: 'LabTech Solutions',
      location: 'Boston, USA',
      rating: 4.8,
      reviews: 127,
      verified: true,
      specialization: ['Laboratory Equipment', 'Analytical Tools'],
      description: 'Leading supplier of laboratory equipment and analytical instruments for research institutions.'
    },
    {
      id: '2',
      name: 'BioChem Supplies',
      location: 'Berlin, Germany',
      rating: 4.6,
      reviews: 94,
      verified: true,
      specialization: ['Chemical Reagents', 'Biological Materials'],
      description: 'Premier supplier of chemical reagents and biological materials for life sciences research.'
    },
    {
      id: '3',
      name: 'GlobalLab Materials',
      location: 'Seoul, South Korea',
      rating: 4.4,
      reviews: 156,
      verified: true,
      specialization: ['Consumables', 'Laboratory Equipment'],
      description: 'Comprehensive supplier of laboratory consumables and materials with global shipping.'
    }
  ];

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchTerm === '' || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      supplier.specialization.some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' && supplier.verified);
    
    return matchesSearch && matchesCategory && matchesVerification;
  });

  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices();
    }
  }, [activeTab, filterType, sortBy]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params: any = {
        sort_by: sortBy
      };
      
      if (filterType !== 'all') {
        params.service_type = filterType;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await axios.get('/api/service-marketplace', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'data_analysis', label: 'Data Analysis' },
    { value: 'statistical_consulting', label: 'Statistical Consulting' },
    { value: 'protocol_development', label: 'Protocol Development' },
    { value: 'training', label: 'Training & Workshops' },
    { value: 'troubleshooting', label: 'Troubleshooting' },
    { value: 'peer_review', label: 'Peer Review' },
    { value: 'manuscript_editing', label: 'Manuscript Editing' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600 mt-1">Find suppliers and services for your research needs</p>
            </div>
            {activeTab === 'services' && (
              <button
                onClick={() => {/* TODO: Open create service modal */}}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Offer a Service</span>
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'suppliers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PackageIcon className="w-4 h-4 inline mr-2" />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BriefcaseIcon className="w-4 h-4 inline mr-2" />
              Services
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'suppliers' ? 'Search suppliers...' : 'Search services...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {activeTab === 'suppliers' ? (
              <>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="equipment">Laboratory Equipment</option>
                    <option value="reagents">Chemical Reagents</option>
                    <option value="consumables">Consumables</option>
                    <option value="biological">Biological Materials</option>
                  </select>
                </div>
                
                <div>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Suppliers</option>
                    <option value="verified">Verified Only</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rating">Top Rated</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="recent">Most Recent</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'suppliers' ? (
          <div>
            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {filteredSuppliers.length} suppliers
              </p>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map(supplier => (
                <div
                  key={supplier.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {supplier.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {supplier.location}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <HeartIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {supplier.description}
                  </p>

                  {/* Specializations */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {supplier.specialization.map((spec, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rating and Verification */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium text-gray-900">
                          {supplier.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ({supplier.reviews} reviews)
                      </span>
                    </div>
                    {supplier.verified && (
                      <div className="flex items-center space-x-1">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Services Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or be the first to offer a service!</p>
                <button
                  onClick={() => {/* TODO: Open create service modal */}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Offer Your First Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Service Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {service.service_title}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserIcon className="w-4 h-4" />
                            <span>{service.provider_name}</span>
                          </div>
                        </div>
                        
                        {service.average_rating > 0 && (
                          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-700">
                              {service.average_rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {service.service_description}
                      </p>

                      {/* Expertise Areas */}
                      {service.expertise_areas && service.expertise_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {service.expertise_areas.slice(0, 3).map((area, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {area}
                            </span>
                          ))}
                          {service.expertise_areas.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{service.expertise_areas.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pricing & Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <div className="flex items-center space-x-1 text-lg font-bold text-gray-900">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                            <span>{service.base_price}</span>
                            <span className="text-sm font-normal text-gray-500">
                              {service.currency}/{service.pricing_model === 'hourly' ? 'hr' : 'project'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4 inline mr-1" />
                          {service.typical_turnaround_days}d
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Request Service
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;

