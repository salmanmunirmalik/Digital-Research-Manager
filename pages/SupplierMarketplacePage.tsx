import React, { useState } from 'react';
import { PackageIcon, SearchIcon, StarIcon, MapPinIcon, CheckCircleIcon, HeartIcon } from '../components/icons';

const SupplierMarketplacePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Mock suppliers data
  const suppliers = [
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
    
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' && supplier.verified);
    
    return matchesSearch && matchesVerification;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <PackageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Supplier Marketplace
              </h1>
              <p className="text-gray-600">
                Find trusted suppliers for your research needs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Suppliers
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
              >
                <option value="all">All Categories</option>
                <option value="equipment">Laboratory Equipment</option>
                <option value="reagents">Chemical Reagents</option>
                <option value="consumables">Consumables</option>
              </select>
            </div>

            {/* Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Status
              </label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
              >
                <option value="all">All Suppliers</option>
                <option value="verified">Verified Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found {filteredSuppliers.length} suppliers
          </p>
        </div>

        {/* Supplier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <div
              key={supplier.id}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
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
                <button className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium shadow-sm">
                  View Details
                </button>
                <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSuppliers.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageIcon className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No suppliers found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierMarketplacePage;

