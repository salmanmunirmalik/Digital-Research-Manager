import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  UserIcon,
  UsersIcon,
  HandshakeIcon,
  BookOpenIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  LinkIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  HeartIcon,
  GlobeAltIcon
} from '../components/icons';

interface MyNetwork {
  id: string;
  name: string;
  title: string;
  institution: string;
  connectionType: 'colleague' | 'mentor' | 'collaborator' | 'student';
  mutualConnections: number;
  lastInteraction: string;
  profileUrl: string;
}

interface MyCollaboration {
  id: string;
  title: string;
  description: string;
  collaborators: string[];
  institution: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'planned';
  projectType: 'research' | 'publication' | 'grant' | 'conference';
}

interface MyPublication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
  citations: number;
  impactFactor: number;
  type: 'journal' | 'conference' | 'book' | 'preprint';
  status: 'published' | 'submitted' | 'in_review' | 'draft';
}

interface MyReference {
  id: string;
  requesterName: string;
  requesterInstitution: string;
  position: string;
  company: string;
  relationship: string;
  status: 'pending' | 'completed' | 'declined';
  requestedDate: string;
  dueDate: string;
  referenceType: 'academic' | 'professional' | 'character';
}

const MyPortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const [myNetwork, setMyNetwork] = useState<MyNetwork[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      title: 'Professor of Molecular Biology',
      institution: 'Harvard University',
      connectionType: 'collaborator',
      mutualConnections: 12,
      lastInteraction: '2024-01-15',
      profileUrl: '/profile/sarah-johnson'
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      title: 'Research Director',
      institution: 'MIT',
      connectionType: 'mentor',
      mutualConnections: 8,
      lastInteraction: '2024-01-10',
      profileUrl: '/profile/michael-chen'
    }
  ]);

  const [myCollaborations, setMyCollaborations] = useState<MyCollaboration[]>([
    {
      id: '1',
      title: 'CRISPR Gene Editing in Cancer Cells',
      description: 'Collaborative research project investigating novel CRISPR applications in cancer treatment',
      collaborators: ['Dr. Sarah Johnson', 'Dr. Alex Rodriguez'],
      institution: 'Harvard University',
      startDate: '2023-06-01',
      endDate: '2024-12-31',
      status: 'active',
      projectType: 'research'
    },
    {
      id: '2',
      title: 'Machine Learning in Drug Discovery',
      description: 'Joint publication on AI applications in pharmaceutical research',
      collaborators: ['Prof. Michael Chen', 'Dr. Lisa Wang'],
      institution: 'MIT',
      startDate: '2023-09-01',
      endDate: '2024-03-31',
      status: 'completed',
      projectType: 'publication'
    }
  ]);

  const [myPublications, setMyPublications] = useState<MyPublication[]>([
    {
      id: '1',
      title: 'Novel Approaches to CRISPR-Based Gene Therapy',
      authors: ['John Doe', 'Dr. Sarah Johnson', 'Dr. Alex Rodriguez'],
      journal: 'Nature Biotechnology',
      year: 2024,
      doi: '10.1038/nbt.2024.001',
      citations: 45,
      impactFactor: 54.9,
      type: 'journal',
      status: 'published'
    },
    {
      id: '2',
      title: 'Machine Learning Applications in Drug Discovery',
      authors: ['John Doe', 'Prof. Michael Chen', 'Dr. Lisa Wang'],
      journal: 'Science',
      year: 2024,
      doi: '10.1126/science.2024.002',
      citations: 23,
      impactFactor: 47.7,
      type: 'journal',
      status: 'submitted'
    }
  ]);

  const [myReferences, setMyReferences] = useState<MyReference[]>([
    {
      id: '1',
      requesterName: 'Dr. Emily Davis',
      requesterInstitution: 'Stanford University',
      position: 'Postdoctoral Researcher',
      company: 'Stanford University',
      relationship: 'Former PhD student',
      status: 'pending',
      requestedDate: '2024-01-20',
      dueDate: '2024-02-15',
      referenceType: 'academic'
    },
    {
      id: '2',
      requesterName: 'James Wilson',
      requesterInstitution: 'Google Research',
      position: 'Research Scientist',
      company: 'Google',
      relationship: 'Research collaborator',
      status: 'completed',
      requestedDate: '2024-01-10',
      dueDate: '2024-01-25',
      referenceType: 'professional'
    }
  ]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'my-network', name: 'My Network', icon: UsersIcon },
    { id: 'my-collaborations', name: 'My Collaborations', icon: HandshakeIcon },
    { id: 'publications', name: 'Publications', icon: BookOpenIcon },
    { id: 'references', name: 'References', icon: StarIcon }
  ];

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'colleague':
        return 'bg-blue-100 text-blue-800';
      case 'mentor':
        return 'bg-green-100 text-green-800';
      case 'collaborator':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <BookOpenIcon className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New publication submitted</p>
                      <p className="text-xs text-gray-500">Machine Learning Applications in Drug Discovery</p>
                    </div>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <HandshakeIcon className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New collaboration started</p>
                      <p className="text-xs text-gray-500">CRISPR Gene Editing in Cancer Cells</p>
                    </div>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <StarIcon className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Reference request completed</p>
                      <p className="text-xs text-gray-500">For James Wilson at Google Research</p>
                    </div>
                    <span className="text-xs text-gray-500">2 weeks ago</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'my-network':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Network</h3>
              <Button variant="primary" className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myNetwork.map((connection) => (
                <Card key={connection.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{connection.name}</h4>
                          <p className="text-sm text-gray-600">{connection.title}</p>
                          <p className="text-xs text-gray-500">{connection.institution}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionTypeColor(connection.connectionType)}`}>
                        {connection.connectionType}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{connection.mutualConnections} mutual connections</span>
                      <span>Last interaction: {new Date(connection.lastInteraction).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <ShareIcon className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'my-collaborations':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Collaborations</h3>
              <Button variant="primary" className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Collaboration
              </Button>
            </div>
            
            <div className="space-y-4">
              {myCollaborations.map((collaboration) => (
                <Card key={collaboration.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{collaboration.title}</h4>
                        <p className="text-gray-600 mb-3">{collaboration.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                            {collaboration.institution}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {new Date(collaboration.startDate).toLocaleDateString()} - {new Date(collaboration.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {collaboration.collaborators.map((collaborator, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {collaborator}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(collaboration.status)}`}>
                        {collaboration.status}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'publications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Publications</h3>
              <Button variant="primary" className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Publication
              </Button>
            </div>
            
            <div className="space-y-4">
              {myPublications.map((publication) => (
                <Card key={publication.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{publication.title}</h4>
                        <p className="text-gray-600 mb-2">{publication.authors.join(', ')}</p>
                        <p className="text-sm text-gray-500 mb-3">{publication.journal} ({publication.year})</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-1" />
                            {publication.citations} citations
                          </span>
                          <span className="flex items-center">
                            <StarIcon className="w-4 h-4 mr-1" />
                            IF: {publication.impactFactor}
                          </span>
                          <span className="flex items-center">
                            <LinkIcon className="w-4 h-4 mr-1" />
                            DOI: {publication.doi}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(publication.status)}`}>
                        {publication.status}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <ShareIcon className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'references':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Reference Requests</h3>
              <Button variant="primary" className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                Request Reference
              </Button>
            </div>
            
            <div className="space-y-4">
              {myReferences.map((reference) => (
                <Card key={reference.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{reference.requesterName}</h4>
                        <p className="text-gray-600 mb-2">{reference.position} at {reference.company}</p>
                        <p className="text-sm text-gray-500 mb-3">Relationship: {reference.relationship}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Requested: {new Date(reference.requestedDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {new Date(reference.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reference.status)}`}>
                        {reference.status}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {reference.status === 'pending' && (
                        <Button variant="primary" size="sm" className="flex items-center">
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Write Reference
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-600">Your personal research portfolio and professional network</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" className="flex items-center">
            <ShareIcon className="w-5 h-5 mr-2" />
            Share Portfolio
          </Button>
          <Button variant="primary" className="flex items-center">
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MyPortfolioPage;
