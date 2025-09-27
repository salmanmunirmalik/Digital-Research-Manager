import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  TrashIcon,
  ShareIcon,
  LinkIcon
} from '../components/icons';
import LinkedInStyleNetworking from '../components/LinkedInStyleNetworking';
import EventsAndOpportunities from '../components/EventsAndOpportunities';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const SimplifiedResearcherPortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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


  // Simplified tabs - only 4 core tabs
  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'publications', name: 'Publications & References', icon: BookOpenIcon },
    { id: 'collaboration', name: 'Collaboration & Networking', icon: UsersIcon },
    { id: 'opportunities', name: 'Events & Opportunities', icon: GlobeAltIcon }
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
              <Button
                onClick={() => setShowUploadModal(true)}
                variant="primary"
                className="flex items-center"
              >
                <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                Upload Publication
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="secondary"
                className="flex items-center"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
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

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab 
                profile={profile} 
                publications={publications} 
                onGoToReferences={() => setActiveTab('publications')}
                onGoToCollaboration={() => setActiveTab('collaboration')}
                onGoToOpportunities={() => setActiveTab('opportunities')}
              />
            )}
            
            {activeTab === 'publications' && (
              <PublicationsAndReferencesTab 
                publications={publications} 
                onUpload={() => setShowUploadModal(true)}
              />
            )}
            
            {activeTab === 'collaboration' && (
              <LinkedInStyleNetworking />
            )}
            
            {activeTab === 'opportunities' && (
              <EventsAndOpportunities />
            )}
          </div>
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
            onSave={(updatedProfile) => {
              setProfile(updatedProfile);
              setShowProfileModal(false);
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
  onGoToReferences: () => void;
  onGoToCollaboration: () => void;
  onGoToOpportunities: () => void;
}> = ({ profile, publications, onGoToReferences, onGoToCollaboration, onGoToOpportunities }) => {
  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile?.first_name?.charAt(0) || 'R'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-gray-600">{profile?.institution}</p>
              <p className="text-blue-600">{profile?.position}</p>
            </div>
          </div>
          <p className="text-gray-700">{profile?.bio}</p>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onGoToReferences}>
          <div className="p-6 text-center">
            <BookOpenIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Publications</h3>
            <p className="text-3xl font-bold text-blue-600">{publications.length}</p>
            <p className="text-gray-600 text-sm">Total publications</p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onGoToReferences}>
          <div className="p-6 text-center">
            <StarIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">References</h3>
            <p className="text-3xl font-bold text-yellow-600">12</p>
            <p className="text-gray-600 text-sm">Peer references</p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onGoToCollaboration}>
          <div className="p-6 text-center">
            <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connections</h3>
            <p className="text-3xl font-bold text-green-600">45</p>
            <p className="text-gray-600 text-sm">Professional connections</p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onGoToOpportunities}>
          <div className="p-6 text-center">
            <GlobeAltIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Opportunities</h3>
            <p className="text-3xl font-bold text-purple-600">8</p>
            <p className="text-gray-600 text-sm">Research opportunities</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={onGoToReferences}
              variant="primary"
              className="flex items-center justify-center"
            >
              <BookOpenIcon className="w-5 h-5 mr-2" />
              Manage Publications
            </Button>
            <Button
              onClick={onGoToReferences}
              variant="secondary"
              className="flex items-center justify-center"
            >
              <StarIcon className="w-5 h-5 mr-2" />
              View References
            </Button>
            <Button
              onClick={onGoToCollaboration}
              variant="secondary"
              className="flex items-center justify-center"
            >
              <UsersIcon className="w-5 h-5 mr-2" />
              Social Network
            </Button>
            <Button
              onClick={onGoToOpportunities}
              variant="secondary"
              className="flex items-center justify-center"
            >
              <AcademicCapIcon className="w-5 h-5 mr-2" />
              Find Collaborators
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Publications and References Tab Component
const PublicationsAndReferencesTab: React.FC<{
  publications: Publication[];
  onUpload: () => void;
}> = ({ publications, onUpload }) => {
  const [activeSubTab, setActiveSubTab] = useState<'publications' | 'references'>('publications');

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab('publications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'publications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Publications
          </button>
          <button
            onClick={() => setActiveSubTab('references')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'references'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            References
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeSubTab === 'publications' && (
        <PublicationsTab publications={publications} onUpload={onUpload} />
      )}
      
      {activeSubTab === 'references' && (
        <UnifiedReferenceSystem />
      )}
    </div>
  );
};

// Collaboration and Networking Tab Component
const CollaborationAndNetworkingTab: React.FC = () => {
  return <LinkedInStyleNetworking />;
};

// Events and Opportunities Tab Component
const EventsAndOpportunitiesTab: React.FC = () => {
  return <EventsAndOpportunities />;
};

// Placeholder components (these would be imported from existing files or created)
const PublicationsTab: React.FC<{ publications: Publication[]; onUpload: () => void }> = ({ publications, onUpload }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Publications</h3>
      <Button onClick={onUpload} variant="primary">
        <PlusIcon className="w-4 h-4 mr-2" />
        Upload Publication
      </Button>
    </div>
    <div className="space-y-4">
      {publications.map((pub, index) => (
        <Card key={index}>
          <div className="p-4">
            <h4 className="font-semibold text-gray-900">{pub.title}</h4>
            <p className="text-gray-600 text-sm">{pub.journal} - {pub.year}</p>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const ExchangeTab: React.FC<{ opportunities: ExchangeOpportunity[]; onLoadOpportunities: () => void }> = ({ opportunities, onLoadOpportunities }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Research Exchange Opportunities</h3>
      <Button onClick={onLoadOpportunities} variant="primary">
        <GlobeAltIcon className="w-4 h-4 mr-2" />
        Load Opportunities
      </Button>
    </div>
    <div className="space-y-4">
      {opportunities.map((opp, index) => (
        <Card key={index}>
          <div className="p-4">
            <h4 className="font-semibold text-gray-900">{opp.title}</h4>
            <p className="text-gray-600 text-sm">{opp.institution}</p>
            <p className="text-green-600 text-sm">Duration: {opp.duration}</p>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// Placeholder modal components
const UploadPublicationModal: React.FC<{ onClose: () => void; onUpload: (data: any) => void }> = ({ onClose, onUpload }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Upload Publication</h3>
      <p className="text-gray-600 mb-4">Publication upload functionality would be implemented here.</p>
      <div className="flex space-x-3">
        <Button onClick={() => onUpload({})} variant="primary">Upload</Button>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
      </div>
    </div>
  </div>
);

const EditProfileModal: React.FC<{ profile: any; onClose: () => void; onSave: (profile: any) => void }> = ({ profile, onClose, onSave }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
      <p className="text-gray-600 mb-4">Profile editing functionality would be implemented here.</p>
      <div className="flex space-x-3">
        <Button onClick={() => onSave(profile)} variant="primary">Save</Button>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
      </div>
    </div>
  </div>
);


export default SimplifiedResearcherPortfolioPage;
