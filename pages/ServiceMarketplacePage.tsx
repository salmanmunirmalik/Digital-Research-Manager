/**
 * Service Provider Marketplace Page
 * Revolutionary feature: Enables researchers to monetize their expertise
 * Offers services like data analysis, consulting, training, protocol development
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
  PencilIcon
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

interface MyService {
  id: string;
  service_title: string;
  service_type: string;
  base_price: number;
  currently_accepting_projects: boolean;
  is_active: boolean;
  average_rating: number;
  total_projects_completed: number;
  pending_requests: number;
}

const ServiceMarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'browse' | 'my-services' | 'my-requests'>('browse');
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [myServices, setMyServices] = useState<MyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'recent'>('rating');
  
  // Modals
  const [showCreateService, setShowCreateService] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const [showRequestService, setShowRequestService] = useState(false);

  useEffect(() => {
    if (view === 'browse') {
      fetchServices();
    } else if (view === 'my-services') {
      fetchMyServices();
    }
  }, [view, filterType, sortBy]);

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

      const response = await axios.get('/api/services/listings', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/services/my-listings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyServices(response.data);
    } catch (error) {
      console.error('Error fetching my services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewService = (service: ServiceListing) => {
    setSelectedService(service);
    setShowServiceDetail(true);
  };

  const handleRequestService = (service: ServiceListing) => {
    setSelectedService(service);
    setShowRequestService(true);
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
              <h1 className="text-3xl font-bold text-gray-900">Service Marketplace</h1>
              <p className="text-gray-600 mt-1">Find expert researchers or offer your services</p>
            </div>
            <button
              onClick={() => setShowCreateService(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Offer a Service</span>
            </button>
          </div>

          {/* View Tabs */}
          <div className="mt-6 flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setView('browse')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Browse Services
            </button>
            <button
              onClick={() => setView('my-services')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'my-services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Services
            </button>
            <button
              onClick={() => setView('my-requests')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'my-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>

        {/* Browse Services View */}
        {view === 'browse' && (
          <div>
            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && fetchServices()}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
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
              </div>
            </div>

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
                  onClick={() => setShowCreateService(true)}
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
                          <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{service.typical_turnaround_days} days</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => handleViewService(service)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                          >
                            View Details
                          </button>
                          {service.total_projects_completed > 0 && (
                            <span className="text-xs text-gray-500 mt-1">
                              {service.total_projects_completed} projects
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Services View */}
        {view === 'my-services' && (
          <div>
            {myServices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't created any services yet</h3>
                <p className="text-gray-600 mb-4">
                  Start offering your expertise! Create services for data analysis, consulting, training, and more.
                </p>
                <button
                  onClick={() => setShowCreateService(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Service
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.service_title}
                          </h3>
                          {service.is_active && service.currently_accepting_projects && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          )}
                          {!service.currently_accepting_projects && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              Not Accepting
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span>{service.average_rating > 0 ? service.average_rating.toFixed(1) : 'No ratings'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <span>{service.total_projects_completed} completed</span>
                          </div>
                          {service.pending_requests > 0 && (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <ClockIcon className="w-4 h-4" />
                              <span>{service.pending_requests} pending requests</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Requests View */}
        {view === 'my-requests' && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Service Requests</h3>
            <p className="text-gray-600">Coming soon: Track your service requests and proposals</p>
          </div>
        )}
      </div>

      {/* Create Service Modal */}
      {showCreateService && (
        <CreateServiceModal
          onClose={() => setShowCreateService(false)}
          onSuccess={() => {
            setShowCreateService(false);
            if (view === 'my-services') fetchMyServices();
          }}
        />
      )}

      {/* Service Detail Modal */}
      {showServiceDetail && selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setShowServiceDetail(false)}
          onRequest={() => {
            setShowServiceDetail(false);
            setShowRequestService(true);
          }}
        />
      )}

      {/* Request Service Modal */}
      {showRequestService && selectedService && (
        <RequestServiceModal
          service={selectedService}
          onClose={() => setShowRequestService(false)}
          onSuccess={() => {
            setShowRequestService(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

// Create Service Modal
const CreateServiceModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    service_title: '',
    service_description: '',
    service_type: 'data_analysis',
    pricing_model: 'hourly',
    base_price: 0,
    currency: 'USD',
    typical_turnaround_days: 7,
    requirements_description: '',
    deliverables_description: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      
      await axios.post('/api/services/listings', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create service');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Offer a Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              value={formData.service_title}
              onChange={(e) => setFormData({ ...formData, service_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Statistical Data Analysis for Biology Research"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe your service in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="data_analysis">Data Analysis</option>
                <option value="statistical_consulting">Statistical Consulting</option>
                <option value="protocol_development">Protocol Development</option>
                <option value="training">Training & Workshops</option>
                <option value="troubleshooting">Troubleshooting</option>
                <option value="peer_review">Peer Review</option>
                <option value="manuscript_editing">Manuscript Editing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Model
              </label>
              <select
                value={formData.pricing_model}
                onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">Hourly Rate</option>
                <option value="project_based">Per Project</option>
                <option value="per_sample">Per Sample</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price ({formData.currency}) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typical Turnaround (days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.typical_turnaround_days}
                onChange={(e) => setFormData({ ...formData, typical_turnaround_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirements (What clients need to provide)
            </label>
            <textarea
              value={formData.requirements_description}
              onChange={(e) => setFormData({ ...formData, requirements_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Raw data files in CSV format, experimental design details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deliverables (What you'll provide)
            </label>
            <textarea
              value={formData.deliverables_description}
              onChange={(e) => setFormData({ ...formData, deliverables_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Statistical analysis report, publication-ready figures, R code..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., statistics, R, python, bioinformatics"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Service Detail Modal
const ServiceDetailModal: React.FC<{
  service: ServiceListing;
  onClose: () => void;
  onRequest: () => void;
}> = ({ service, onClose, onRequest }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 my-8">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{service.service_title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <UserIcon className="w-4 h-4" />
                  <span>{service.provider_name}</span>
                </div>
                <div>{service.provider_position}</div>
                <div>{service.provider_institution}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Ratings & Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {service.average_rating > 0 ? service.average_rating.toFixed(1) : 'New'}
                </span>
              </div>
              <div className="text-sm text-gray-600">{service.total_ratings} reviews</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {service.total_projects_completed}
              </div>
              <div className="text-sm text-gray-600">Projects Completed</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {service.typical_turnaround_days}
              </div>
              <div className="text-sm text-gray-600">Days Turnaround</div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">About This Service</h3>
            <p className="text-gray-700">{service.service_description}</p>
          </div>

          {/* Expertise Areas */}
          {service.expertise_areas && service.expertise_areas.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Expertise Areas</h3>
              <div className="flex flex-wrap gap-2">
                {service.expertise_areas.map((area, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Techniques */}
          {service.techniques_offered && service.techniques_offered.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Techniques Offered</h3>
              <div className="flex flex-wrap gap-2">
                {service.techniques_offered.map((tech, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">${service.base_price}</span>
              <span className="text-gray-600">
                {service.currency} / {service.pricing_model === 'hourly' ? 'hour' : 'project'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onRequest}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <span>Request This Service</span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Request Service Modal
const RequestServiceModal: React.FC<{
  service: ServiceListing;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ service, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_title: '',
    project_description: '',
    specific_requirements: '',
    desired_completion_date: '',
    urgency_level: 'medium',
    budget_range_min: 0,
    budget_range_max: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/services/requests', {
        ...formData,
        service_id: service.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Service request sent successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error requesting service:', error);
      alert('Failed to send request');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Request Service: {service.service_title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.project_title}
              onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Analysis of RNA-seq data from cancer samples"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description *
            </label>
            <textarea
              required
              value={formData.project_description}
              onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe your project, goals, and expected outcomes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific Requirements
            </label>
            <textarea
              value={formData.specific_requirements}
              onChange={(e) => setFormData({ ...formData, specific_requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any specific methods, software, or approaches you need..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desired Completion Date
              </label>
              <input
                type="date"
                value={formData.desired_completion_date}
                onChange={(e) => setFormData({ ...formData, desired_completion_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <select
                value={formData.urgency_level}
                onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Flexible timeline</option>
                <option value="medium">Medium - Standard</option>
                <option value="high">High - Need soon</option>
                <option value="urgent">Urgent - ASAP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Min ($)
              </label>
              <input
                type="number"
                min="0"
                value={formData.budget_range_min}
                onChange={(e) => setFormData({ ...formData, budget_range_min: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Max ($)
              </label>
              <input
                type="number"
                min="0"
                value={formData.budget_range_max}
                onChange={(e) => setFormData({ ...formData, budget_range_max: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceMarketplacePage;

