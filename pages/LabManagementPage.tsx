import React, { useState } from 'react';
import { 
  PlusIcon, 
  UsersIcon, 
  CogIcon, 
  PencilIcon, 
  TrashIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  SaveIcon,
  BeakerIcon
} from '../components/icons';

interface LabMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  joinedDate: string;
}

interface LabProject {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
}

const LabManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for demo
  const mockMembers: LabMember[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'Principal Investigator',
      email: 'sarah.johnson@lab.com',
      status: 'Active',
      joinedDate: '2023-01-15'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      role: 'Postdoctoral Researcher',
      email: 'michael.chen@lab.com',
      status: 'Active',
      joinedDate: '2023-03-20'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'Graduate Student',
      email: 'emily.rodriguez@lab.com',
      status: 'Active',
      joinedDate: '2023-09-01'
    },
    {
      id: '4',
      name: 'Alex Thompson',
      role: 'Research Assistant',
      email: 'alex.thompson@lab.com',
      status: 'Active',
      joinedDate: '2024-01-10'
    }
  ];

  const mockProjects: LabProject[] = [
    {
      id: '1',
      name: 'CRISPR Gene Editing Optimization',
      description: 'Improving efficiency and accuracy of CRISPR-Cas9 gene editing in mammalian cells',
      status: 'In Progress',
      progress: 75,
      startDate: '2023-06-01',
      endDate: '2024-12-31'
    },
    {
      id: '2',
      name: 'Protein Structure Analysis',
      description: 'Structural characterization of novel proteins using X-ray crystallography',
      status: 'Planning',
      progress: 25,
      startDate: '2024-03-01',
      endDate: '2025-06-30'
    },
    {
      id: '3',
      name: 'Drug Discovery Pipeline',
      description: 'High-throughput screening for novel therapeutic compounds',
      status: 'Active',
      progress: 60,
      startDate: '2023-09-01',
      endDate: '2024-08-31'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'principal investigator':
        return 'bg-purple-100 text-purple-800';
      case 'postdoctoral researcher':
        return 'bg-blue-100 text-blue-800';
      case 'graduate student':
        return 'bg-green-100 text-green-800';
      case 'research assistant':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Management</h1>
          <p className="text-gray-600">Manage your research lab, team members, and projects</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Member
          </button>
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'members', name: 'Team Members', icon: UsersIcon },
            { id: 'projects', name: 'Projects', icon: BuildingOfficeIcon },
            { id: 'administration', name: 'Administration', icon: ShieldCheckIcon },
            { id: 'supervision', name: 'Supervision', icon: UsersIcon },
            { id: 'settings', name: 'Settings', icon: CogIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{mockMembers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{mockProjects.filter(p => p.status === 'In Progress' || p.status === 'Active').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Updates</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Issues</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Updates & Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Team Updates & Achievements</h2>
                <p className="text-gray-600">Share your daily progress, achievements, and experiment updates</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Share Update
              </button>
            </div>

            {/* Mock Team Updates */}
            <div className="space-y-4">
              {[
                {
                  id: '1',
                  member: 'Dr. Sarah Johnson',
                  role: 'Principal Investigator',
                  avatar: 'SJ',
                  update: 'Successfully completed CRISPR-Cas9 gene editing optimization experiment. Achieved 85% efficiency in mammalian cells. Ready for next phase testing.',
                  type: 'achievement',
                  timestamp: '2 hours ago',
                  reactions: { '🎉': 3, '👏': 2, '🔬': 1 },
                  comments: 2
                },
                {
                  id: '2',
                  member: 'Dr. Michael Chen',
                  role: 'Postdoctoral Researcher',
                  avatar: 'MC',
                  update: 'Started live cell imaging session for drug response study. Using confocal microscope to track cellular changes over 24 hours.',
                  type: 'experiment',
                  timestamp: '4 hours ago',
                  reactions: { '🔬': 2, '📊': 1 },
                  comments: 1
                },
                {
                  id: '3',
                  member: 'Emily Rodriguez',
                  role: 'Graduate Student',
                  avatar: 'ER',
                  update: 'Encountered unexpected results in PCR amplification. Getting multiple bands instead of single target. Will troubleshoot tomorrow.',
                  type: 'issue',
                  timestamp: '6 hours ago',
                  reactions: { '🤔': 2, '💪': 1 },
                  comments: 4
                },
                {
                  id: '4',
                  member: 'Alex Thompson',
                  role: 'Research Assistant',
                  avatar: 'AT',
                  update: 'Completed protein extraction protocol optimization. Reduced processing time by 30% while maintaining yield quality.',
                  type: 'achievement',
                  timestamp: '8 hours ago',
                  reactions: { '🎯': 2, '⚡': 1, '👏': 1 },
                  comments: 1
                }
              ].map((update) => (
                <div key={update.id} className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                  update.type === 'achievement' ? 'bg-green-50 border-green-400' :
                  update.type === 'experiment' ? 'bg-blue-50 border-blue-400' :
                  'bg-yellow-50 border-yellow-400'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">{update.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{update.member}</h4>
                        <span className="text-sm text-gray-500">{update.role}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          update.type === 'achievement' ? 'bg-green-100 text-green-800' :
                          update.type === 'experiment' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {update.type}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{update.update}</p>
                      
                      {/* Reactions */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          {Object.entries(update.reactions).map(([emoji, count]) => (
                            <button key={emoji} className="hover:scale-110 transition-transform">
                              <span className="text-lg">{emoji}</span>
                              <span className="ml-1 text-gray-600">{count}</span>
                            </button>
                          ))}
                        </div>
                        <span className="text-gray-500">{update.timestamp}</span>
                        <button className="text-blue-600 hover:text-blue-700">
                          {update.comments} comments
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment Discussion & Problem Solving */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Experiment Discussion & Problem Solving</h2>
                <p className="text-gray-600">Collaborate on experimental challenges and share solutions</p>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Post Issue
              </button>
            </div>

            {/* Mock Discussion Threads */}
            <div className="space-y-4">
              {[
                {
                  id: '1',
                  title: 'PCR Multiple Bands Issue - Need Help!',
                  author: 'Emily Rodriguez',
                  status: 'open',
                  priority: 'medium',
                  description: 'Getting multiple bands in PCR instead of single target. Using standard protocol with 60°C annealing temp.',
                  replies: 3,
                  lastActivity: '1 hour ago',
                  tags: ['PCR', 'Troubleshooting', 'Molecular Biology']
                },
                {
                  id: '2',
                  title: 'Cell Culture Contamination Solution',
                  author: 'Dr. Michael Chen',
                  status: 'resolved',
                  priority: 'high',
                  description: 'Found effective method to prevent mycoplasma contamination using regular testing and antibiotics.',
                  replies: 5,
                  lastActivity: '3 hours ago',
                  tags: ['Cell Culture', 'Contamination', 'Solutions']
                },
                {
                  id: '3',
                  title: 'Protein Concentration Measurement',
                  author: 'Alex Thompson',
                  status: 'open',
                  priority: 'low',
                  description: 'Looking for alternative methods to BCA assay for protein concentration measurement.',
                  replies: 2,
                  lastActivity: '5 hours ago',
                  tags: ['Protein Analysis', 'BCA Assay', 'Alternatives']
                }
              ].map((thread) => (
                <div key={thread.id} className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  thread.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{thread.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          thread.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {thread.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          thread.priority === 'high' ? 'bg-red-100 text-red-800' :
                          thread.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {thread.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{thread.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>By {thread.author}</span>
                        <span>{thread.replies} replies</span>
                        <span>Last activity: {thread.lastActivity}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        {thread.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                        View Discussion
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Schedule Team Meeting</p>
                    <p className="text-sm text-blue-700">Coordinate with team members</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BeakerIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Report Experiment Issue</p>
                    <p className="text-sm text-green-700">Get help from the team</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-all text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900">Share Achievement</p>
                    <p className="text-sm text-purple-700">Celebrate team success</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <p className="text-gray-600">Manage your research team and their roles</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          {mockProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Progress</p>
                      <p className="text-sm text-gray-900">{project.progress}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Start Date</p>
                      <p className="text-sm text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">End Date</p>
                      <p className="text-sm text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-900">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'administration' && (
        <div className="space-y-6">
          {/* User Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lab Members & Roles</p>
                    <p className="text-sm text-gray-600">Manage lab member access and permissions</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  Manage Users
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CogIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lab Configuration</p>
                    <p className="text-sm text-gray-600">Configure lab settings and preferences</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  Configure
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Security Settings</p>
                    <p className="text-sm text-gray-600">Manage security and privacy settings</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                  Security
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'supervision' && (
        <div className="space-y-6">
          {/* Team Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Active Members</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{mockMembers.length}</p>
                <p className="text-sm text-blue-700">Currently active in lab</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ChartBarIcon className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Active Projects</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{mockProjects.filter(p => p.status === 'In Progress' || p.status === 'Active').length}</p>
                <p className="text-sm text-green-700">Currently in progress</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CalendarIcon className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Pending Approvals</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">2</p>
                <p className="text-sm text-orange-700">Awaiting review</p>
              </div>
            </div>
          </div>

          {/* Project Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Research Projects</p>
                    <p className="text-sm text-gray-600">Monitor and manage ongoing research</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  View Projects
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Approvals & Reviews</p>
                    <p className="text-sm text-gray-600">Review and approve team requests</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lab Name</label>
              <input
                type="text"
                defaultValue="Advanced Research Laboratory"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <input
                type="text"
                defaultValue="University of Science & Technology"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                defaultValue="Department of Molecular Biology"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                defaultValue="lab@university.edu"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="pt-4">
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabManagementPage;
