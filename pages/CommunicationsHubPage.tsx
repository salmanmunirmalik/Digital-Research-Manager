import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BellIcon,
  EnvelopeIcon,
  UserGroupIcon,
  StarIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface Communication {
  id: string;
  communication_type: string;
  title: string;
  content: string;
  from_user_id?: string;
  from_first_name?: string;
  from_last_name?: string;
  to_user_id?: string;
  to_first_name?: string;
  to_last_name?: string;
  status: string;
  priority: string;
  created_at: string;
  read_at?: string;
  context_id?: string;
  action_url?: string;
  action_text?: string;
}

const CommunicationsHubPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'lab' | 'network' | 'events' | 'discussions' | 'references'>('all');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    lab: 0,
    network: 0,
    events: 0,
    discussions: 0,
    references: 0
  });

  useEffect(() => {
    fetchCommunications();
  }, [activeTab]);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const type = activeTab === 'all' ? undefined : getCommunicationType(activeTab);
      
      const response = await axios.get('/api/communications/inbox', {
        params: { type, limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCommunications(response.data.communications || []);
      if (response.data.counts) {
        setStats(response.data.counts);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCommunicationType = (tab: string): string => {
    const mapping: { [key: string]: string } = {
      'lab': 'lab_message',
      'network': 'connection_request',
      'events': 'event_message',
      'discussions': 'forum_discussion',
      'references': 'reference_request'
    };
    return mapping[tab] || '';
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/communications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCommunications(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'read', read_at: new Date().toISOString() } : c
      ));
      
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/communications/${id}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCommunications(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error archiving:', error);
    }
  };

  const handleNavigate = (comm: Communication) => {
    if (comm.action_url) {
      navigate(comm.action_url);
    } else {
      // Default navigation based on type
      switch (comm.communication_type) {
        case 'lab_message':
          navigate('/team-messaging');
          break;
        case 'connection_request':
          navigate('/collaboration-networking');
          break;
        case 'forum_discussion':
          navigate('/research-assistant');
          break;
        case 'reference_request':
          navigate('/scientist-passport');
          break;
        default:
          break;
      }
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'lab_message':
        return <EnvelopeIcon className="w-5 h-5" />;
      case 'connection_request':
        return <UserGroupIcon className="w-5 h-5" />;
      case 'event_message':
        return <CalendarIcon className="w-5 h-5" />;
      case 'forum_discussion':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      case 'reference_request':
        return <AcademicCapIcon className="w-5 h-5" />;
      default:
        return <BellIcon className="w-5 h-5" />;
    }
  };

  const getCommunicationColor = (type: string) => {
    switch (type) {
      case 'lab_message':
        return 'bg-blue-100 text-blue-700';
      case 'connection_request':
        return 'bg-green-100 text-green-700';
      case 'event_message':
        return 'bg-purple-100 text-purple-700';
      case 'forum_discussion':
        return 'bg-orange-100 text-orange-700';
      case 'reference_request':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Communications Hub</h1>
          <p className="text-gray-600 mt-2">Manage all your communications in one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BellIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread</p>
                <p className="text-3xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lab Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.lab}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Network</p>
                <p className="text-3xl font-bold text-gray-900">{stats.network}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex space-x-2 flex-wrap">
            {[
              { id: 'all', label: 'All', icon: BellIcon },
              { id: 'lab', label: 'Lab Messages', icon: EnvelopeIcon },
              { id: 'network', label: 'Network', icon: UserGroupIcon },
              { id: 'events', label: 'Events', icon: CalendarIcon },
              { id: 'discussions', label: 'Discussions', icon: QuestionMarkCircleIcon },
              { id: 'references', label: 'References', icon: AcademicCapIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Communications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading communications...</p>
            </div>
          ) : communications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Communications</h3>
              <p className="text-gray-600">You don't have any messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    comm.status === 'unread' ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => handleNavigate(comm)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${getCommunicationColor(comm.communication_type)}`}>
                        {getCommunicationIcon(comm.communication_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{comm.title || 'New Message'}</h4>
                          {comm.status === 'unread' && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                          {comm.priority === 'urgent' && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{comm.content}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {comm.from_first_name && (
                            <span>From: {comm.from_first_name} {comm.from_last_name}</span>
                          )}
                          <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {comm.status === 'unread' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(comm.id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(comm.id);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Archive"
                      >
                        <ArchiveBoxIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {comm.action_text && (
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(comm);
                        }}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <span>{comm.action_text}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationsHubPage;

