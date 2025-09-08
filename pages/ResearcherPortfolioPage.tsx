import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import researcherPortfolioService, { 
  Publication, 
  ResearcherProfile, 
  CoSupervisorMatch, 
  ExchangeOpportunity 
} from '../services/researcherPortfolioService';
import {
  DocumentArrowUpIcon,
  UserIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  StarIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  ChartBarIcon,
  UsersIcon,
  LightBulbIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '../components/icons';

const ResearcherPortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [exchangeOpportunities, setExchangeOpportunities] = useState<ExchangeOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await researcherPortfolioService.getDashboardData(user.id);
      setProfile(data.profile);
      setPublications(data.recentPublications);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicationUpload = async (publicationData: any) => {
    try {
      const result = await researcherPortfolioService.uploadPublication(publicationData);
      setPublications(prev => [result.publication, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading publication:', error);
    }
  };

  const findMatchingSupervisors = async () => {
    if (!profile) return;
    
    try {
      const result = await researcherPortfolioService.findSupervisors({
        research_interests: profile.research_interests,
        research_domains: profile.research_domains,
        max_results: 10
      });
      setSupervisors(result.supervisors);
    } catch (error) {
      console.error('Error finding supervisors:', error);
    }
  };

  const loadExchangeOpportunities = async () => {
    try {
      const result = await researcherPortfolioService.getExchangeOpportunities();
      setExchangeOpportunities(result.opportunities);
    } catch (error) {
      console.error('Error loading exchange opportunities:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'publications', name: 'Publications', icon: BookOpenIcon },
    { id: 'matching', name: 'Find Co-Supervisors', icon: UsersIcon },
    { id: 'exchange', name: 'Research Exchange', icon: GlobeAltIcon },
    { id: 'profile', name: 'Profile', icon: PencilIcon }
  ];

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
              <h1 className="text-3xl font-bold text-gray-900">Researcher Portfolio</h1>
              <p className="text-gray-600 mt-2">Manage your publications, find collaborators, and explore research opportunities</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                Upload Publication
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              profile={profile} 
              publications={publications} 
              onFindSupervisors={findMatchingSupervisors}
              onLoadExchange={loadExchangeOpportunities}
            />
          )}
          
          {activeTab === 'publications' && (
            <PublicationsTab 
              publications={publications} 
              onUpload={() => setShowUploadModal(true)}
            />
          )}
          
          {activeTab === 'matching' && (
            <MatchingTab 
              supervisors={supervisors} 
              onFindSupervisors={findMatchingSupervisors}
            />
          )}
          
          {activeTab === 'exchange' && (
            <ExchangeTab 
              opportunities={exchangeOpportunities} 
              onLoadOpportunities={loadExchangeOpportunities}
            />
          )}
          
          {activeTab === 'profile' && (
            <ProfileTab 
              profile={profile} 
              onEdit={() => setShowProfileModal(true)}
            />
          )}
        </div>

        {/* Modals */}
        {showUploadModal && (
          <UploadPublicationModal
            onClose={() => setShowUploadModal(false)}
            onUpload={handlePublicationUpload}
          />
        )}

        {showProfileModal && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowProfileModal(false)}
            onSave={(profileData) => {
              researcherPortfolioService.saveProfile(profileData);
              setShowProfileModal(false);
              loadDashboardData();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  profile: ResearcherProfile | null;
  publications: Publication[];
  onFindSupervisors: () => void;
  onLoadExchange: () => void;
}> = ({ profile, publications, onFindSupervisors, onLoadExchange }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <BookOpenIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-blue-100">Publications</p>
              <p className="text-2xl font-bold">{profile?.total_publications || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-green-100">Citations</p>
              <p className="text-2xl font-bold">{profile?.total_citations || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <StarIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-purple-100">H-Index</p>
              <p className="text-2xl font-bold">{profile?.h_index || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <UsersIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-orange-100">Students</p>
              <p className="text-2xl font-bold">{profile?.current_students || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Find Co-Supervisors</h3>
          <p className="text-gray-600 mb-4">Discover potential co-supervisors based on your research interests and expertise.</p>
          <button
            onClick={onFindSupervisors}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Find Matches
          </button>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Research Exchange</h3>
          <p className="text-gray-600 mb-4">Explore research exchange opportunities and collaborations worldwide.</p>
          <button
            onClick={onLoadExchange}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Browse Opportunities
          </button>
        </div>
      </div>

      {/* Recent Publications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Publications</h3>
        <div className="space-y-3">
          {publications.slice(0, 5).map((pub) => (
            <div key={pub.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{pub.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{pub.journal} • {pub.publication_date}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {pub.research_domains.map((domain) => (
                  <span key={domain} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Publications Tab Component
const PublicationsTab: React.FC<{
  publications: Publication[];
  onUpload: () => void;
}> = ({ publications, onUpload }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Publications</h3>
        <button
          onClick={onUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Publication
        </button>
      </div>

      <div className="space-y-4">
        {publications.map((pub) => (
          <div key={pub.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{pub.title}</h4>
                <p className="text-gray-600 mb-3">{pub.abstract}</p>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span>{pub.journal}</span>
                  {pub.publication_date && <span className="mx-2">•</span>}
                  <span>{pub.publication_date}</span>
                  {pub.doi && <span className="mx-2">•</span>}
                  <span>DOI: {pub.doi}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pub.research_domains.map((domain) => (
                    <span key={domain} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button className="text-gray-400 hover:text-gray-600">
                  <EyeIcon className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-red-600">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Matching Tab Component
const MatchingTab: React.FC<{
  supervisors: any[];
  onFindSupervisors: () => void;
}> = ({ supervisors, onFindSupervisors }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Co-Supervisor Matching</h3>
        <button
          onClick={onFindSupervisors}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Find Matches
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supervisors.map((supervisor) => (
          <div key={supervisor.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h4 className="font-medium">{supervisor.first_name} {supervisor.last_name}</h4>
                <p className="text-sm text-gray-600">{supervisor.position}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{supervisor.institution}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compatibility</span>
                <span className="text-lg font-bold text-green-600">{supervisor.compatibility_score}%</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {supervisor.research_domains?.slice(0, 3).map((domain: string) => (
                  <span key={domain} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Send Request
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Exchange Tab Component
const ExchangeTab: React.FC<{
  opportunities: ExchangeOpportunity[];
  onLoadOpportunities: () => void;
}> = ({ opportunities, onLoadOpportunities }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Research Exchange Opportunities</h3>
        <button
          onClick={onLoadOpportunities}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Load Opportunities
        </button>
      </div>

      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <div key={opportunity.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{opportunity.title}</h4>
                <p className="text-gray-600">{opportunity.description}</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                {opportunity.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span>{opportunity.duration_weeks} weeks</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span>Lab Location</span>
              </div>
              <div className="flex items-center text-sm">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span>{opportunity.funding_available ? 'Funded' : 'Self-funded'}</span>
              </div>
              <div className="flex items-center text-sm">
                <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span>{opportunity.current_applicants}/{opportunity.max_applicants}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {opportunity.research_domains.map((domain) => (
                <span key={domain} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {domain}
                </span>
              ))}
            </div>
            
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Apply Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab: React.FC<{
  profile: ResearcherProfile | null;
  onEdit: () => void;
}> = ({ profile, onEdit }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Profile</h3>
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Edit Profile
        </button>
      </div>

      {profile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Institution</label>
              <p className="mt-1 text-gray-900">{profile.institution || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <p className="mt-1 text-gray-900">{profile.position || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Research Interests</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.research_interests.map((interest) => (
                  <span key={interest} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Expertise Areas</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.expertise_areas.map((area) => (
                  <span key={area} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Research Domains</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {profile.research_domains.map((domain) => (
                  <span key={domain} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Availability</label>
              <p className="mt-1 text-gray-900">{profile.availability_status}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No profile information available. Create your profile to get started.</p>
        </div>
      )}
    </div>
  );
};

// Upload Publication Modal
const UploadPublicationModal: React.FC<{
  onClose: () => void;
  onUpload: (data: any) => void;
}> = ({ onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: '',
    journal: '',
    publication_date: '',
    doi: '',
    keywords: '',
    research_domains: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload({
      ...formData,
      authors: formData.authors.split(',').map(a => a.trim()),
      keywords: formData.keywords.split(',').map(k => k.trim()),
      research_domains: formData.research_domains.split(',').map(d => d.trim())
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Upload Publication</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
            <textarea
              value={formData.abstract}
              onChange={(e) => setFormData({...formData, abstract: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authors (comma-separated)</label>
              <input
                type="text"
                value={formData.authors}
                onChange={(e) => setFormData({...formData, authors: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Journal</label>
              <input
                type="text"
                value={formData.journal}
                onChange={(e) => setFormData({...formData, journal: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publication Date</label>
              <input
                type="date"
                value={formData.publication_date}
                onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DOI</label>
              <input
                type="text"
                value={formData.doi}
                onChange={(e) => setFormData({...formData, doi: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({...formData, keywords: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Domains (comma-separated)</label>
            <input
              type="text"
              value={formData.research_domains}
              onChange={(e) => setFormData({...formData, research_domains: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Profile Modal
const EditProfileModal: React.FC<{
  profile: ResearcherProfile | null;
  onClose: () => void;
  onSave: (data: any) => void;
}> = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    institution: profile?.institution || '',
    department: profile?.department || '',
    position: profile?.position || '',
    research_interests: profile?.research_interests?.join(', ') || '',
    expertise_areas: profile?.expertise_areas?.join(', ') || '',
    research_domains: profile?.research_domains?.join(', ') || '',
    years_of_experience: profile?.years_of_experience || '',
    max_students: profile?.max_students || 5,
    collaboration_preferences: profile?.collaboration_preferences || '',
    research_philosophy: profile?.research_philosophy || '',
    mentorship_style: profile?.mentorship_style || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      research_interests: formData.research_interests.split(',').map(i => i.trim()),
      expertise_areas: formData.expertise_areas.split(',').map(a => a.trim()),
      research_domains: formData.research_domains.split(',').map(d => d.trim())
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <input
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({...formData, years_of_experience: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Interests (comma-separated)</label>
            <textarea
              value={formData.research_interests}
              onChange={(e) => setFormData({...formData, research_interests: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Areas (comma-separated)</label>
            <textarea
              value={formData.expertise_areas}
              onChange={(e) => setFormData({...formData, expertise_areas: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Domains (comma-separated)</label>
            <input
              type="text"
              value={formData.research_domains}
              onChange={(e) => setFormData({...formData, research_domains: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
            <input
              type="number"
              value={formData.max_students}
              onChange={(e) => setFormData({...formData, max_students: parseInt(e.target.value)})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Philosophy</label>
            <textarea
              value={formData.research_philosophy}
              onChange={(e) => setFormData({...formData, research_philosophy: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mentorship Style</label>
            <textarea
              value={formData.mentorship_style}
              onChange={(e) => setFormData({...formData, mentorship_style: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResearcherPortfolioPage;
