import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  TrashIcon,
  EyeIcon,
  BookOpenIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  SparklesIcon,
  LightbulbIcon,
  CalendarIcon,
  StarIcon,
  ShareIcon,
  DownloadIcon,
  UploadIcon,
  LinkIcon,
  ImageIcon,
  FileTextIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  EditIcon,
  RefreshCwIcon,
  CopyIcon,
  MessageCircleIcon
} from '../components/icons';

interface LabNotebookEntry {
  id: string;
  title: string;
  content: string;
  entry_type: 'experiment' | 'observation' | 'protocol' | 'analysis' | 'idea' | 'meeting';
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  objectives: string;
  methodology: string;
  results: string;
  conclusions: string;
  next_steps: string;
  lab_id: string;
  project_id: string | null;
  tags: string[];
  privacy_level: 'private' | 'lab' | 'institution' | 'public';
  author_id: string;
  creator_name: string;
  lab_name: string;
  institution: string;
  created_at: string;
  updated_at: string;
  estimated_duration: number; // in hours
  actual_duration: number; // in hours
  cost: number;
  equipment_used: string[];
  materials_used: string[];
  safety_notes: string;
  references: string[];
  attachments: string[];
  collaborators: string[];
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    completed: boolean;
  }>;
}

interface LabNotebookComment {
  id: string;
  entry_id: string;
  user_id: string;
  comment_text: string;
  parent_comment_id: string | null;
  first_name: string;
  last_name: string;
  username: string;
  created_at: string;
}



const LabNotebookPage: React.FC = () => {
  const { user, token } = useAuth();
  const [entries, setEntries] = useState<LabNotebookEntry[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [labMembers, setLabMembers] = useState<any[]>([]);
  
  // Ensure entries is always an array
  const safeEntries = Array.isArray(entries) ? entries : [];
  const [isLoading, setIsLoading] = useState(true);


  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LabNotebookEntry | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    lab_id: '',
    entry_type: '',
    status: '',
    priority: '',
    search: '',
    privacy: '',
    date_range: 'all'
  });

  // Form states
  const [entryForm, setEntryForm] = useState({
    title: '',
    content: '',
    entry_type: 'experiment',
    status: 'planning',
    priority: 'medium',
    objectives: '',
    methodology: '',
    results: '',
    conclusions: '',
    next_steps: '',
    lab_id: '',
    project_id: '',
    tags: [''],
    privacy_level: 'lab',
    estimated_duration: 0,
    cost: 0,
    equipment_used: [''],
    materials_used: [''],
    safety_notes: '',
    references: [''],
    collaborators: [''],
    milestones: [{
      id: Date.now().toString(),
      title: '',
      description: '',
      due_date: '',
      completed: false
    }]
  });

  // View modes
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'calendar' | 'list'>('timeline');
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'type' | 'lab'>('status');
  
  // Sharing states
  const [shareLinkType, setShareLinkType] = useState<'view' | 'edit' | 'comment'>('view');
  const [shareLink, setShareLink] = useState<string>('');

  useEffect(() => {
    fetchEntries();
    fetchLabs();
    fetchLabMembers();
  }, [filters]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });

      const response = await fetch(`http://localhost:5001/api/lab-notebooks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Entries data:', data);
        setEntries(data.entries || []);
      } else {
        throw new Error('Failed to fetch entries');
      }
    } catch (err) {
      setError(err instanceof Error ? (err.message || 'An error occurred') : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Labs data:', data);
        setLabs(data.labs || []);
      } else {
        console.error('Failed to fetch labs:', response.status, response.statusText);
        setLabs([]);
      }
    } catch (err) {
      console.error('Failed to fetch labs:', err);
      setLabs([]);
    }
  };

  const handleCreateEntry = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/lab-notebooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...entryForm,
          author_id: user?.id,
          lab_id: entryForm.lab_id || labs[0]?.id
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEntryForm({
          title: '',
          content: '',
          entry_type: 'experiment',
          status: 'planning',
          priority: 'medium',
          objectives: '',
          methodology: '',
          results: '',
          conclusions: '',
          next_steps: '',
          lab_id: '',
          project_id: '',
          tags: [''],
          privacy_level: 'lab',
          estimated_duration: 0,
          cost: 0,
          equipment_used: [''],
          materials_used: [''],
          safety_notes: '',
          references: [''],
          collaborators: [''],
          milestones: [{
            id: Date.now().toString(),
            title: '',
            description: '',
            due_date: '',
            completed: false
          }]
        });
        fetchEntries();
      }
    } catch (err) {
      setError('Failed to create entry');
    }
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryForm)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchEntries();
      }
    } catch (err) {
      setError('Failed to update entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchEntries();
      }
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const handleShareWithLab = async (labId: string, accessLevel: 'view' | 'edit') => {
    if (!selectedEntry) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${selectedEntry.id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lab_id: labId,
          access_level: accessLevel
        })
      });

      if (response.ok) {
        // Show success message
        alert(`Successfully shared with lab (${accessLevel} access)`);
      } else {
        setError('Failed to share entry');
      }
    } catch (err) {
      setError('Failed to share entry');
    }
  };

  const generateShareLink = () => {
    if (!selectedEntry) return;
    
    const baseUrl = window.location.origin;
    const entryId = selectedEntry.id;
    const accessLevel = shareLinkType;
    
    // Generate a unique share token (in production, this would be stored in the database)
    const shareToken = btoa(`${entryId}-${accessLevel}-${Date.now()}`);
    
    const shareUrl = `${baseUrl}/shared-entry/${entryId}?token=${shareToken}&access=${accessLevel}`;
    setShareLink(shareUrl);
  };

  const handleShareWithUser = async (userId: string, accessLevel: 'view' | 'edit' | 'comment') => {
    if (!selectedEntry) return;

    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${selectedEntry.id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          access_level: accessLevel
        })
      });

      if (response.ok) {
        // Show success message
        alert(`Successfully shared with user (${accessLevel} access)`);
      } else {
        setError('Failed to share entry');
      }
    } catch (err) {
      setError('Failed to share entry');
    }
  };

  const fetchLabMembers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/lab-members', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Lab members data:', data);
        setLabMembers(data.members || []);
      } else {
        console.error('Failed to fetch lab members:', response.status, response.statusText);
        setLabMembers([]);
      }
    } catch (err) {
      console.error('Failed to fetch lab members:', err);
      setLabMembers([]);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'principal_researcher':
        return 'bg-purple-100 text-purple-800';
      case 'co_supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'researcher':
        return 'bg-green-100 text-green-800';
      case 'student':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'principal_researcher':
        return 'Principal Investigator';
      case 'co_supervisor':
        return 'Co-Supervisor';
      case 'researcher':
        return 'Researcher';
      case 'student':
        return 'Student';
      case 'admin':
        return 'Admin';
      default:
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      experiment: '🧪',
      observation: '👁️',
      protocol: '📋',
      analysis: '📊',
      idea: '💡',
      meeting: '🤝'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const renderTimelineView = () => (
    <div className="space-y-6">
                  {safeEntries.map((entry) => (
        <Card key={entry.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {getTypeIcon(entry.entry_type)}
        </div>
      </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{entry.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                      {entry.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(entry.priority)}`}>
                      {entry.priority}
                    </span>
        </div>
        </div>
        
                <p className="text-gray-600 mb-3 line-clamp-2">{entry.content}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    {entry.creator_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    {entry.lab_name}
                  </span>
          </div>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {tag}
                      </span>
                    ))}
          </div>
                )}
                
                                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setShowViewModal(true);
                    }}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setEntryForm(entry);
                      setShowEditModal(true);
                    }}
                  >
                    <EditIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Navigate to results section with pre-filled data from this entry
                      window.open('/data-results?from-notebook=true&title=' + encodeURIComponent(entry.title), '_blank');
                    }}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Add Results</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setShowShareModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ShareIcon className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
          </div>
        </div>
      </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderKanbanView = () => {
    const statuses = ['planning', 'in_progress', 'completed', 'on_hold', 'failed'];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {statuses.map((status) => (
          <div key={status} className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 capitalize">{status.replace('_', ' ')}</h3>
              <span className="text-sm text-gray-500">
                {safeEntries.filter(e => e.status === status).length} entries
              </span>
              </div>
            
            <div className="space-y-3">
              {safeEntries
                .filter(entry => entry.status === status)
                .map((entry) => (
                  <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{entry.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{entry.content}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(entry.priority)}`}>
                          {entry.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowViewModal(true);
                          }}
                >
                  <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowEditModal(true);
                          }}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to results section with pre-filled data from this entry
                            window.open('/data-results?from-notebook=true&title=' + encodeURIComponent(entry.title), '_blank');
                          }}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Results</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowShareModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                      onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                        </Button>
              </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
                Lab Notebook
              </h1>
              <p className="text-gray-600 mt-2">Your digital research companion - track experiments, observations, and breakthroughs</p>
            </div>
            
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Entry
            </Button>
              </div>
              </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{safeEntries.length}</p>
              </div>
            </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {safeEntries.filter(e => e.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {safeEntries.filter(e => e.status === 'completed').length}
                  </p>
          </div>
      </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <LightbulbIcon className="h-6 w-6 text-purple-600" />
        </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ideas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {safeEntries.filter(e => e.entry_type === 'idea').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search entries..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
                <Select
                  value={filters.lab_id}
                  onChange={(e) => setFilters({...filters, lab_id: e.target.value})}
                >
                  <option value="">All Labs</option>
                  {labs.map((lab) => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <Select
                  value={filters.entry_type}
                  onChange={(e) => setFilters({...filters, entry_type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="experiment">Experiment</option>
                  <option value="observation">Observation</option>
                  <option value="protocol">Protocol</option>
                  <option value="analysis">Analysis</option>
                  <option value="idea">Idea</option>
                  <option value="meeting">Meeting</option>
                </Select>
              </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="failed">Failed</option>
                </Select>
                </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">View:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {(['timeline', 'kanban', 'calendar', 'list'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          viewMode === mode
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                </div>
              </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Group by:</span>
                  <Select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="w-32"
                  >
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="type">Type</option>
                    <option value="lab">Lab</option>
                  </Select>
                </div>
              </div>

              <Button variant="ghost" onClick={fetchEntries}>
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading entries...</p>
            </div>
          ) : safeEntries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
                <p className="text-gray-600 mb-6">Start documenting your research journey by creating your first entry.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'timeline' && renderTimelineView()}
              {viewMode === 'kanban' && renderKanbanView()}
              {viewMode === 'calendar' && (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-600">Calendar view coming soon...</p>
                  </CardContent>
                </Card>
              )}
              {viewMode === 'list' && (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-600">List view coming soon...</p>
                  </CardContent>
                </Card>
              )}
            </>
                    )}
                  </div>
              </div>

      {/* Create Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Entry</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <Input
                    placeholder="Enter entry title"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({...entryForm, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <Select
                    value={entryForm.entry_type}
                    onChange={(e) => setEntryForm({...entryForm, entry_type: e.target.value as any})}
                  >
                    <option value="experiment">Experiment</option>
                    <option value="observation">Observation</option>
                    <option value="protocol">Protocol</option>
                    <option value="analysis">Analysis</option>
                    <option value="idea">Idea</option>
                    <option value="meeting">Meeting</option>
                  </Select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select
                    value={entryForm.status}
                    onChange={(e) => setEntryForm({...entryForm, status: e.target.value as any})}
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="failed">Failed</option>
                  </Select>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <Select
                    value={entryForm.priority}
                    onChange={(e) => setEntryForm({...entryForm, priority: e.target.value as any})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Select>
              </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                    placeholder="Describe your entry..."
                    value={entryForm.content}
                    onChange={(e) => setEntryForm({...entryForm, content: e.target.value})}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
                <textarea
                    placeholder="What are you trying to achieve?"
                    value={entryForm.objectives}
                    onChange={(e) => setEntryForm({...entryForm, objectives: e.target.value})}
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    placeholder="Enter tags separated by commas"
                    value={entryForm.tags.join(', ')}
                    onChange={(e) => setEntryForm({...entryForm, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  />
                  </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEntry}>
                  Create Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {showViewModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedEntry.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Content</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedEntry.content}</p>
                  </div>
                </div>

                  {selectedEntry.objectives && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Objectives</h3>
                      <p className="text-gray-600">{selectedEntry.objectives}</p>
                    </div>
                  )}
                  
                  {selectedEntry.methodology && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Methodology</h3>
                      <p className="text-gray-600">{selectedEntry.methodology}</p>
                    </div>
                  )}

                {selectedEntry.results && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Results</h3>
                    <p className="text-gray-600">{selectedEntry.results}</p>
                  </div>
                )}

                {selectedEntry.conclusions && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Conclusions</h3>
                    <p className="text-gray-600">{selectedEntry.conclusions}</p>
                  </div>
                )}
                  
                  {selectedEntry.next_steps && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Next Steps</h3>
                      <p className="text-gray-600">{selectedEntry.next_steps}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Entry Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEntry.status)}`}>
                          {selectedEntry.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedEntry.priority)}`}>
                          {selectedEntry.priority}
                        </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedEntry.entry_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Privacy:</span>
                      <span className="font-medium capitalize">{selectedEntry.privacy_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedEntry.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium">{new Date(selectedEntry.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to results section with pre-filled data from this entry
                        window.open('/data-results?from-notebook=true&title=' + encodeURIComponent(selectedEntry.title), '_blank');
                      }}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 flex-1"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Results
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEntryForm(selectedEntry);
                        setShowViewModal(false);
                        setShowEditModal(true);
                      }}
                      className="flex-1"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteEntry(selectedEntry.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Entry</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <Input
                    placeholder="Enter entry title"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({...entryForm, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <Select
                    value={entryForm.entry_type}
                    onChange={(e) => setEntryForm({...entryForm, entry_type: e.target.value as any})}
                  >
                    <option value="experiment">Experiment</option>
                    <option value="observation">Observation</option>
                    <option value="protocol">Protocol</option>
                    <option value="analysis">Analysis</option>
                    <option value="idea">Idea</option>
                    <option value="meeting">Meeting</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select
                    value={entryForm.status}
                    onChange={(e) => setEntryForm({...entryForm, status: e.target.value as any})}
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="failed">Failed</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <Select
                    value={entryForm.priority}
                    onChange={(e) => setEntryForm({...entryForm, priority: e.target.value as any})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    placeholder="Describe your entry..."
                    value={entryForm.content}
                    onChange={(e) => setEntryForm({...entryForm, content: e.target.value})}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
                  <textarea
                    placeholder="What are you trying to achieve?"
                    value={entryForm.objectives}
                    onChange={(e) => setEntryForm({...entryForm, objectives: e.target.value})}
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    placeholder="Enter tags separated by commas"
                    value={entryForm.tags.join(', ')}
                    onChange={(e) => setEntryForm({...entryForm, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link to Results Section</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to results section with pre-filled data from this entry
                        window.open('/data-results?from-notebook=true&title=' + encodeURIComponent(entryForm.title), '_blank');
                      }}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Results
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Optionally create a results entry based on this notebook entry. This will open the Data & Results page in a new tab.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateEntry}>
                  Update Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Entry Modal */}
      {showShareModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Share Entry: {selectedEntry.title}</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* User Sharing by Role */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Share with Team Members</h3>
                  <div className="space-y-3">
                    {labMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{member.user?.first_name} {member.user?.last_name}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                              {formatRole(member.role)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{member.user?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareWithUser(member.user_id, 'view')}
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Only
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareWithUser(member.user_id, 'edit')}
                          >
                            <EditIcon className="w-4 h-4 mr-1" />
                            Edit Access
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareWithUser(member.user_id, 'comment')}
                          >
                            <MessageCircleIcon className="w-4 h-4 mr-1" />
                            Comment
                          </Button>
                        </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Share Link Generation */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Generate Share Link</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={shareLinkType}
                        onChange={(e) => setShareLinkType(e.target.value)}
                        className="flex-1"
                      >
                        <option value="view">View Only</option>
                        <option value="edit">Edit Access</option>
                        <option value="comment">Comment Access</option>
                      </Select>
                      <Button
                        onClick={generateShareLink}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Generate Link
                      </Button>
                    </div>
                    
                    {shareLink && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Share this link:</p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={shareLink}
                            readOnly
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(shareLink)}
                          >
                            <CopyIcon className="w-4 h-4" />
                          </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

                {/* Current Sharing Status */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Current Sharing Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Privacy Level:</span>
                      <span className="font-medium capitalize">{selectedEntry.privacy_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shared With:</span>
                      <span className="font-medium">
                        {selectedEntry.collaborators?.length || 0} collaborators
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="ghost" onClick={() => setShowShareModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabNotebookPage;
