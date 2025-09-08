import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import researcherPortfolioService from '../services/researcherPortfolioService';
import {
  MagnifyingGlassIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  GlobeAltIcon,
  FunnelIcon,
  XMarkIcon
} from '../components/icons';

const CoSupervisorDiscoveryPage: React.FC = () => {
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [filteredSupervisors, setFilteredSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const researchDomains = [
    'biology', 'chemistry', 'physics', 'mathematics', 'computer_science',
    'engineering', 'medicine', 'psychology', 'environmental_science',
    'materials_science', 'biotechnology', 'neuroscience', 'genetics', 'pharmacology'
  ];

  useEffect(() => {
    loadSupervisors();
  }, []);

  useEffect(() => {
    filterSupervisors();
  }, [supervisors, searchQuery, selectedDomains, selectedInstitutions]);

  const loadSupervisors = async () => {
    setLoading(true);
    try {
      const result = await researcherPortfolioService.findSupervisors({
        max_results: 50
      });
      setSupervisors(result.supervisors);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSupervisors = () => {
    let filtered = supervisors;

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(supervisor => 
        supervisor.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supervisor.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supervisor.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supervisor.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supervisor.research_interests?.some((interest: string) => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Domain filter
    if (selectedDomains.length > 0) {
      filtered = filtered.filter(supervisor =>
        supervisor.research_domains?.some((domain: string) =>
          selectedDomains.includes(domain)
        )
      );
    }

    // Institution filter
    if (selectedInstitutions.length > 0) {
      filtered = filtered.filter(supervisor =>
        selectedInstitutions.includes(supervisor.institution)
      );
    }

    setFilteredSupervisors(filtered);
  };

  const getUniqueInstitutions = () => {
    return [...new Set(supervisors.map(s => s.institution).filter(Boolean))];
  };

  const handleSendRequest = async () => {
    if (!selectedSupervisor || !requestMessage.trim()) return;

    try {
      await researcherPortfolioService.sendSupervisorRequest(
        selectedSupervisor.id,
        requestMessage
      );
      setShowRequestModal(false);
      setRequestMessage('');
      setSelectedSupervisor(null);
      // Show success message
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Co-Supervisor Discovery</h1>
              <p className="text-gray-600 mt-2">Find the perfect co-supervisor for your research journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filteredSupervisors.length}</span> supervisors found
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
              >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, institution, position, or research interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Research Domains */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Research Domains</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {researchDomains.map((domain) => (
                      <label key={domain} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDomains.includes(domain)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDomains([...selectedDomains, domain]);
                            } else {
                              setSelectedDomains(selectedDomains.filter(d => d !== domain));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{domain.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Institutions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Institutions</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUniqueInstitutions().map((institution) => (
                      <label key={institution} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedInstitutions.includes(institution)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInstitutions([...selectedInstitutions, institution]);
                            } else {
                              setSelectedInstitutions(selectedInstitutions.filter(i => i !== institution));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{institution}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedDomains.length > 0 || selectedInstitutions.length > 0) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSelectedDomains([]);
                      setSelectedInstitutions([]);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Supervisors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupervisors.map((supervisor) => (
            <div key={supervisor.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">
                      {supervisor.first_name} {supervisor.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{supervisor.position}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(supervisor.compatibility_score)}`}>
                  {supervisor.compatibility_score}% match
                </div>
              </div>

              {/* Institution */}
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                <span>{supervisor.institution}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{supervisor.total_publications || 0}</div>
                  <div className="text-xs text-gray-500">Publications</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{supervisor.total_citations || 0}</div>
                  <div className="text-xs text-gray-500">Citations</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{supervisor.h_index || 0}</div>
                  <div className="text-xs text-gray-500">H-Index</div>
                </div>
              </div>

              {/* Research Domains */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {supervisor.research_domains?.slice(0, 3).map((domain: string) => (
                    <span key={domain} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {domain.replace('_', ' ')}
                    </span>
                  ))}
                  {supervisor.research_domains?.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{supervisor.research_domains.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Research Interests */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {supervisor.research_interests?.slice(0, 2).join(', ')}
                  {supervisor.research_interests?.length > 2 && '...'}
                </p>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm">
                  <UsersIcon className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="text-gray-600">
                    {supervisor.current_students}/{supervisor.max_students} students
                  </span>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  supervisor.availability_status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {supervisor.availability_status}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedSupervisor(supervisor);
                    setShowRequestModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Send Request
                </button>
                <button
                  onClick={() => {
                    setSelectedSupervisor(supervisor);
                    // Show detailed view
                  }}
                  className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSupervisors.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No supervisors found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find more supervisors.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomains([]);
                setSelectedInstitutions([]);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Request Modal */}
        {showRequestModal && selectedSupervisor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Send Co-Supervisor Request</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedSupervisor.first_name} {selectedSupervisor.last_name}</p>
                    <p className="text-sm text-gray-600">{selectedSupervisor.position} at {selectedSupervisor.institution}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why would you like to work with this supervisor?
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Describe your research interests, goals, and why you think this collaboration would be beneficial..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={!requestMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoSupervisorDiscoveryPage;
