import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  StarIcon,
  UserIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  HeartIcon,
  ShareIcon,
  LinkIcon,
  ClockIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '../components/icons';

interface UnifiedReference {
  id: string;
  type: 'peer' | 'platform' | 'comprehensive';
  title: string;
  description: string;
  skills: string[];
  context: string;
  relationship: string;
  duration: string;
  score: number;
  confidence: number;
  source: string;
  createdAt: string;
  verified: boolean;
  jobMatches: string[];
}

interface ReferenceRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  context: string;
  skills: string[];
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

const UnifiedReferenceSystem: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'peer' | 'platform' | 'requests' | 'settings'>('overview');
  const [references, setReferences] = useState<UnifiedReference[]>([]);
  const [requests, setRequests] = useState<ReferenceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferences();
      loadRequests();
    }
  }, [user]);

  const loadReferences = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockReferences: UnifiedReference[] = [
        {
          id: '1',
          type: 'peer',
          title: 'Conference Collaboration',
          description: 'Excellent collaborator during the International Research Conference 2024',
          skills: ['Research', 'Collaboration', 'Communication'],
          context: 'Conference',
          relationship: 'Colleague',
          duration: '3 days',
          score: 95,
          confidence: 90,
          source: 'Dr. Sarah Johnson',
          createdAt: '2024-01-15',
          verified: true,
          jobMatches: ['Research Scientist', 'Postdoc']
        },
        {
          id: '2',
          type: 'platform',
          title: 'Personal NoteBook Analysis',
          description: 'Consistent high-quality experimental work and documentation',
          skills: ['Experimental Design', 'Data Analysis', 'Documentation'],
          context: 'Platform Activity',
          relationship: 'System Generated',
          duration: '12 months',
          score: 88,
          confidence: 85,
          source: 'AI Analysis',
          createdAt: '2024-01-10',
          verified: true,
          jobMatches: ['Lab Manager', 'Research Assistant']
        },
        {
          id: '3',
          type: 'comprehensive',
          title: 'Comprehensive Research Profile',
          description: 'Combined peer and platform references for complete research assessment',
          skills: ['Research', 'Leadership', 'Innovation', 'Collaboration'],
          context: 'Combined',
          relationship: 'Multi-source',
          duration: '2 years',
          score: 92,
          confidence: 95,
          source: 'AI + Peer Review',
          createdAt: '2024-01-05',
          verified: true,
          jobMatches: ['Principal Investigator', 'Research Director']
        }
      ];
      setReferences(mockReferences);
    } catch (error) {
      console.error('Error loading references:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockRequests: ReferenceRequest[] = [
        {
          id: '1',
          fromUserId: 'user1',
          fromUserName: 'Dr. Michael Chen',
          toUserId: user?.id || '',
          context: 'Conference Collaboration',
          skills: ['Research', 'Collaboration'],
          message: 'Would you be willing to provide a reference for our collaboration at the recent conference?',
          status: 'pending',
          createdAt: '2024-01-20'
        }
      ];
      setRequests(mockRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      // Update request status
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status } : req
      ));
      
      if (status === 'accepted') {
        // Create reference
        const request = requests.find(req => req.id === requestId);
        if (request) {
          const newReference: UnifiedReference = {
            id: Date.now().toString(),
            type: 'peer',
            title: `${request.context} Reference`,
            description: request.message,
            skills: request.skills,
            context: request.context,
            relationship: 'Colleague',
            duration: 'Recent',
            score: 0, // To be filled by the person giving the reference
            confidence: 0,
            source: request.fromUserName,
            createdAt: new Date().toISOString(),
            verified: false,
            jobMatches: []
          };
          setReferences(prev => [newReference, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'peer', name: 'Peer References', icon: UsersIcon },
    { id: 'platform', name: 'Platform References', icon: DocumentTextIcon },
    { id: 'requests', name: 'Requests', icon: StarIcon },
    { id: 'settings', name: 'Settings', icon: PencilIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unified Reference System</h2>
          <p className="text-gray-600">Comprehensive references combining peer reviews and platform analysis</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="primary"
            className="flex items-center"
          >
            <StarIcon className="w-5 h-5 mr-2" />
            Request Reference
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="secondary"
            className="flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Reference
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
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
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab references={references} />}
        {activeTab === 'peer' && <PeerReferencesTab references={references.filter(r => r.type === 'peer')} />}
        {activeTab === 'platform' && <PlatformReferencesTab references={references.filter(r => r.type === 'platform')} />}
        {activeTab === 'requests' && <RequestsTab requests={requests} onResponse={handleRequestResponse} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

      {/* Modals */}
      {showRequestModal && (
        <RequestReferenceModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={(data) => {
            console.log('Request submitted:', data);
            setShowRequestModal(false);
          }}
        />
      )}

      {showCreateModal && (
        <CreateReferenceModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            console.log('Reference created:', data);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ references: UnifiedReference[] }> = ({ references }) => {
  const peerRefs = references.filter(r => r.type === 'peer');
  const platformRefs = references.filter(r => r.type === 'platform');
  const comprehensiveRefs = references.filter(r => r.type === 'comprehensive');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6 text-center">
            <UsersIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Peer References</h3>
            <p className="text-3xl font-bold text-blue-600">{peerRefs.length}</p>
            <p className="text-gray-600 text-sm">From colleagues</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform References</h3>
            <p className="text-3xl font-bold text-green-600">{platformRefs.length}</p>
            <p className="text-gray-600 text-sm">AI-generated</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <StarIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive</h3>
            <p className="text-3xl font-bold text-yellow-600">{comprehensiveRefs.length}</p>
            <p className="text-gray-600 text-sm">Combined analysis</p>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <ChartBarIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Score</h3>
            <p className="text-3xl font-bold text-purple-600">
              {references.length > 0 ? Math.round(references.reduce((sum, r) => sum + r.score, 0) / references.length) : 0}%
            </p>
            <p className="text-gray-600 text-sm">Overall rating</p>
          </div>
        </Card>
      </div>

      {/* Recent References */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent References</h3>
          <div className="space-y-4">
            {references.slice(0, 3).map((reference) => (
              <div key={reference.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{reference.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reference.type === 'peer' ? 'bg-blue-100 text-blue-800' :
                    reference.type === 'platform' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reference.type}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{reference.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Score: {reference.score}%</span>
                    <span className="text-sm text-gray-500">Confidence: {reference.confidence}%</span>
                    <span className="text-sm text-gray-500">Source: {reference.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {reference.verified && <CheckIcon className="w-4 h-4 text-green-600" />}
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Peer References Tab Component
const PeerReferencesTab: React.FC<{ references: UnifiedReference[] }> = ({ references }) => {
  return (
    <div className="space-y-4">
      {references.map((reference) => (
        <Card key={reference.id}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{reference.title}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{reference.score}%</span>
                {reference.verified && <CheckIcon className="w-5 h-5 text-green-600" />}
              </div>
            </div>
            <p className="text-gray-600 mb-4">{reference.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Context:</span>
                <p className="text-sm text-gray-600">{reference.context}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Relationship:</span>
                <p className="text-sm text-gray-600">{reference.relationship}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Duration:</span>
                <p className="text-sm text-gray-600">{reference.duration}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Source:</span>
                <p className="text-sm text-gray-600">{reference.source}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {reference.skills.map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Created: {new Date(reference.createdAt).toLocaleDateString()}</span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <ShareIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <PencilIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Platform References Tab Component
const PlatformReferencesTab: React.FC<{ references: UnifiedReference[] }> = ({ references }) => {
  return (
    <div className="space-y-4">
      {references.map((reference) => (
        <Card key={reference.id}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{reference.title}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{reference.score}%</span>
                <span className="text-sm text-gray-500">Confidence: {reference.confidence}%</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{reference.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Analysis Period:</span>
                <p className="text-sm text-gray-600">{reference.duration}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Context:</span>
                <p className="text-sm text-gray-600">{reference.context}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Source:</span>
                <p className="text-sm text-gray-600">{reference.source}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Verified:</span>
                <p className="text-sm text-gray-600">{reference.verified ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {reference.skills.map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Generated: {new Date(reference.createdAt).toLocaleDateString()}</span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <ShareIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChartBarIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Requests Tab Component
const RequestsTab: React.FC<{ 
  requests: ReferenceRequest[]; 
  onResponse: (requestId: string, status: 'accepted' | 'declined') => void;
}> = ({ requests, onResponse }) => {
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const respondedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h3>
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{request.fromUserName}</h4>
                  <span className="text-sm text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-600 mb-4">{request.message}</p>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Context: </span>
                  <span className="text-sm text-gray-600">{request.context}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => onResponse(request.id, 'accepted')}
                    variant="primary"
                    className="flex items-center"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => onResponse(request.id, 'declined')}
                    variant="secondary"
                    className="flex items-center"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Responded Requests */}
      {respondedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Responded Requests</h3>
          <div className="space-y-4">
            {respondedRequests.map((request) => (
              <Card key={request.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{request.fromUserName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{request.message}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reference Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Allow Reference Requests</h4>
                <p className="text-sm text-gray-600">Let others request references from you</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-generate Platform References</h4>
                <p className="text-sm text-gray-600">Automatically create references from your activities</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Public Reference Visibility</h4>
                <p className="text-sm text-gray-600">Make your references visible to others</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Modal Components
const RequestReferenceModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Request Reference</h3>
      <p className="text-gray-600 mb-4">Reference request functionality would be implemented here.</p>
      <div className="flex space-x-3">
        <Button onClick={() => onSubmit({})} variant="primary">Submit</Button>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
      </div>
    </div>
  </div>
);

const CreateReferenceModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Create Reference</h3>
      <p className="text-gray-600 mb-4">Reference creation functionality would be implemented here.</p>
      <div className="flex space-x-3">
        <Button onClick={() => onSubmit({})} variant="primary">Create</Button>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
      </div>
    </div>
  </div>
);

export default UnifiedReferenceSystem;
