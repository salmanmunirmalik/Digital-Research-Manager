import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { 
  BookOpenIcon,
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  CalendarIcon,
  UserIcon,
  TagIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightbulbIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  StarIcon,
  ArrowRightIcon,
  SaveIcon,
  XMarkIcon,
  ShareIcon,
  DownloadIcon,
  PrinterIcon,
  TrendingUpIcon,
  BellIcon,
  SparklesIcon,
  BrainIcon,
  TargetIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardListIcon,
  DocumentIcon,
  PresentationChartLineIcon,
  HomeIcon,
  CogIcon,
  BuildingOfficeIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  Squares2X2Icon
} from '../components/icons';

// Simplified Lab Notebook Entry Interface
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
  lab_name: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: 'private' | 'lab' | 'institution' | 'public';
  estimated_duration: number;
  actual_duration: number;
  cost: number;
  equipment_used: string[];
  materials_used: string[];
  safety_notes: string;
  references: string[];
  collaborators: string[];
}

// Simplified interfaces for essential features only
interface QuickNote {
  id: string;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'pink';
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: 'entry_created' | 'entry_updated' | 'experiment_completed' | 'collaboration_added';
  description: string;
  user_name: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface SmartSuggestion {
  id: string;
  type: 'protocol' | 'collaboration' | 'equipment' | 'safety' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
}

const LabNotebookPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LabNotebookEntry[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  
  // Simplified state management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [activeView, setActiveView] = useState<'entries' | 'overview' | 'tools'>('overview');
  
  // Simplified entry form
  const [entryForm, setEntryForm] = useState({
    title: '',
    content: '',
    entry_type: 'experiment' as const,
    status: 'planning' as const,
    priority: 'medium' as const,
    objectives: '',
    methodology: '',
    results: '',
    conclusions: '',
    next_steps: '',
    lab_id: 'lab1',
    lab_name: 'Main Lab',
    creator_name: user?.username || 'Unknown',
    tags: [] as string[],
    privacy_level: 'lab' as const,
    estimated_duration: 0,
    actual_duration: 0,
    cost: 0,
    equipment_used: [] as string[],
    materials_used: [] as string[],
    safety_notes: '',
    references: [] as string[],
    collaborators: [] as string[]
  });

  const [quickNoteForm, setQuickNoteForm] = useState({
    content: '',
    color: 'yellow' as const
  });

  // Load mock data
  useEffect(() => {
    // Mock lab notebook entries
    const mockEntries: LabNotebookEntry[] = [
      {
        id: '1',
        title: 'Protein Purification Protocol',
        content: 'Developed a new protocol for purifying recombinant proteins using affinity chromatography.',
        entry_type: 'protocol',
        status: 'completed',
        priority: 'high',
        objectives: 'Purify recombinant GFP protein',
        methodology: 'Ni-NTA affinity chromatography',
        results: '95% purity achieved',
        conclusions: 'Protocol is effective and reproducible',
        next_steps: 'Scale up for production',
        lab_id: 'lab1',
        lab_name: 'Main Lab',
        creator_name: 'Dr. Smith',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        tags: ['protein', 'purification', 'chromatography'],
        privacy_level: 'lab',
        estimated_duration: 4,
        actual_duration: 3.5,
        cost: 150,
        equipment_used: ['centrifuge', 'chromatography column'],
        materials_used: ['Ni-NTA resin', 'buffer solutions'],
        safety_notes: 'Wear gloves when handling chemicals',
        references: ['Nature Methods 2023'],
        collaborators: ['Dr. Johnson']
      },
      {
        id: '2',
        title: 'Cell Viability Assay',
        content: 'Testing the effect of new compound on cancer cell viability.',
        entry_type: 'experiment',
        status: 'in_progress',
        priority: 'medium',
        objectives: 'Determine IC50 of compound X',
        methodology: 'MTT assay',
        results: 'Preliminary data shows 60% viability at 10μM',
        conclusions: 'Compound shows promising activity',
        next_steps: 'Complete dose-response curve',
        lab_id: 'lab1',
        lab_name: 'Main Lab',
        creator_name: 'Dr. Smith',
        created_at: '2024-01-14T14:30:00Z',
        updated_at: '2024-01-14T14:30:00Z',
        tags: ['cell', 'viability', 'cancer'],
        privacy_level: 'lab',
        estimated_duration: 2,
        actual_duration: 1.5,
        cost: 75,
        equipment_used: ['plate reader', 'incubator'],
        materials_used: ['MTT reagent', 'cell culture media'],
        safety_notes: 'Work in biosafety cabinet',
        references: ['Cancer Research 2023'],
        collaborators: []
      }
    ];

    // Mock quick notes
    const mockQuickNotes: QuickNote[] = [
      {
        id: '1',
        content: 'Order more MTT reagent for next week',
        color: 'yellow',
        created_at: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        content: 'Check centrifuge calibration',
        color: 'blue',
        created_at: '2024-01-15T08:30:00Z'
      },
      {
        id: '3',
        content: 'Schedule lab meeting for Friday',
        color: 'green',
        created_at: '2024-01-15T08:00:00Z'
      }
    ];

    // Mock recent activity
    const mockRecentActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'entry_created',
        description: 'Created new experiment entry',
        user_name: 'Dr. Smith',
        timestamp: '2024-01-15T10:00:00Z',
        icon: BeakerIcon,
        color: 'text-blue-600'
      },
      {
        id: '2',
        type: 'experiment_completed',
        description: 'Completed protein purification protocol',
        user_name: 'Dr. Smith',
        timestamp: '2024-01-15T09:30:00Z',
        icon: CheckCircleIcon,
        color: 'text-green-600'
      },
      {
        id: '3',
        type: 'collaboration_added',
        description: 'Added Dr. Johnson as collaborator',
        user_name: 'Dr. Smith',
        timestamp: '2024-01-15T09:00:00Z',
        icon: UsersIcon,
        color: 'text-purple-600'
      }
    ];

    // Mock smart suggestions
    const mockSmartSuggestions: SmartSuggestion[] = [
      {
        id: '1',
        type: 'protocol',
        title: 'Optimize Protein Purification',
        description: 'Consider using gradient elution for better separation',
        confidence: 85,
        priority: 'high'
      },
      {
        id: '2',
        type: 'equipment',
        title: 'Equipment Maintenance Due',
        description: 'Centrifuge calibration is due next week',
        confidence: 95,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'collaboration',
        title: 'Potential Collaboration',
        description: 'Dr. Johnson has similar research interests',
        confidence: 75,
        priority: 'low'
      }
    ];

    setEntries(mockEntries);
    setQuickNotes(mockQuickNotes);
    setRecentActivity(mockRecentActivity);
    setSmartSuggestions(mockSmartSuggestions);
  }, []);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || entry.entry_type === filterType;
      const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    return filtered;
  }, [entries, searchTerm, filterType, filterStatus, sortBy]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuggestionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateEntry = () => {
    if (entryForm.title.trim() && entryForm.content.trim()) {
      const newEntry: LabNotebookEntry = {
        id: Date.now().toString(),
        title: entryForm.title,
        content: entryForm.content,
        entry_type: entryForm.entry_type,
        status: entryForm.status,
        priority: entryForm.priority,
        objectives: entryForm.objectives,
        methodology: entryForm.methodology,
        results: entryForm.results,
        conclusions: entryForm.conclusions,
        next_steps: entryForm.next_steps,
        lab_id: entryForm.lab_id,
        lab_name: entryForm.lab_name,
        creator_name: entryForm.creator_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: entryForm.tags,
        privacy_level: entryForm.privacy_level,
        estimated_duration: entryForm.estimated_duration,
        actual_duration: entryForm.actual_duration,
        cost: entryForm.cost,
        equipment_used: entryForm.equipment_used,
        materials_used: entryForm.materials_used,
        safety_notes: entryForm.safety_notes,
        references: entryForm.references,
        collaborators: entryForm.collaborators
      };
      setEntries(prev => [newEntry, ...prev]);
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
        lab_id: 'lab1',
        lab_name: 'Main Lab',
        creator_name: user?.username || 'Unknown',
        tags: [],
        privacy_level: 'lab',
        estimated_duration: 0,
        actual_duration: 0,
        cost: 0,
        equipment_used: [],
        materials_used: [],
        safety_notes: '',
        references: [],
        collaborators: []
      });
      setShowNewEntryModal(false);
    }
  };

  const handleCreateQuickNote = () => {
    if (quickNoteForm.content.trim()) {
      const newNote: QuickNote = {
        id: Date.now().toString(),
        content: quickNoteForm.content,
        color: quickNoteForm.color,
        created_at: new Date().toISOString()
      };
      setQuickNotes(prev => [newNote, ...prev]);
      setQuickNoteForm({ content: '', color: 'yellow' });
      setShowQuickNoteModal(false);
    }
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
              <p className="text-gray-600 mt-2">Your digital research companion</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowQuickNoteModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Quick Note
              </Button>
              <Button
                onClick={() => setShowNewEntryModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'overview'
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HomeIcon className="h-4 w-4 mr-2 inline" />
              Overview
            </button>
            <button
              onClick={() => setActiveView('entries')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'entries'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 mr-2 inline" />
              Entries
            </button>
            <button
              onClick={() => setActiveView('tools')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'tools'
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CogIcon className="h-4 w-4 mr-2 inline" />
              Tools
            </button>
          </div>
        </div>

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PencilIcon className="h-5 w-5 text-yellow-600" />
                  Quick Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickNotes.slice(0, 5).map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        note.color === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
                        note.color === 'blue' ? 'bg-blue-50 border-blue-400' :
                        note.color === 'green' ? 'bg-green-50 border-green-400' :
                        'bg-pink-50 border-pink-400'
                      }`}
                    >
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <IconComponent className={`h-4 w-4 mt-0.5 ${activity.color}`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {activity.user_name} • {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Smart Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LightbulbIcon className="h-5 w-5 text-purple-600" />
                  Smart Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {smartSuggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSuggestionPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${suggestion.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{suggestion.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Entries View */}
        {activeView === 'entries' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All Types</option>
                    <option value="experiment">Experiment</option>
                    <option value="observation">Observation</option>
                    <option value="protocol">Protocol</option>
                    <option value="analysis">Analysis</option>
                    <option value="idea">Idea</option>
                    <option value="meeting">Meeting</option>
                  </Select>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="failed">Failed</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Entries List */}
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                            {entry.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                            {entry.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{entry.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            {entry.entry_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            {entry.creator_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Workflow Integration Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 font-medium">Workflow Actions:</span>
                            <Link to="/protocols" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                              <BeakerIcon className="h-4 w-4" />
                              Protocols
                            </Link>
                            <Link to="/inventory" className="flex items-center gap-1 text-green-600 hover:text-green-800">
                              <ClipboardListIcon className="h-4 w-4" />
                              Inventory
                            </Link>
                            <Link to="/instruments" className="flex items-center gap-1 text-purple-600 hover:text-purple-800">
                              <CalendarDaysIcon className="h-4 w-4" />
                              Book Equipment
                            </Link>
                            <Link to="/data-results" className="flex items-center gap-1 text-orange-600 hover:text-orange-800">
                              <ChartBarIcon className="h-4 w-4" />
                              Add Results
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tools View */}
        {activeView === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <BeakerIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Experiment Tracker</h3>
                  <p className="text-gray-600 text-sm">Track your experiments and their progress</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Analysis</h3>
                  <p className="text-gray-600 text-sm">Analyze your research data</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <UsersIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaboration</h3>
                  <p className="text-gray-600 text-sm">Manage team collaborations</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
                  <p className="text-gray-600 text-sm">Manage your research schedule</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Protocols</h3>
                  <p className="text-gray-600 text-sm">Access and manage protocols</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <BellIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
                  <p className="text-gray-600 text-sm">Stay updated with alerts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* New Entry Modal */}
        {showNewEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Create New Entry</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewEntryModal(false)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <Input
                      value={entryForm.title}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter entry title..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={entryForm.content}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter entry content..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <Select
                        value={entryForm.entry_type}
                        onChange={(e) => setEntryForm(prev => ({ ...prev, entry_type: e.target.value as any }))}
                        className="w-full"
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
                        onChange={(e) => setEntryForm(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full"
                      >
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="failed">Failed</option>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewEntryModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateEntry}
                      className="bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Create Entry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Note Modal */}
        {showQuickNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Note</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickNoteModal(false)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea
                      value={quickNoteForm.content}
                      onChange={(e) => setQuickNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter your quick note..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex gap-2">
                      {['yellow', 'blue', 'green', 'pink'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setQuickNoteForm(prev => ({ ...prev, color: color as any }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            quickNoteForm.color === color ? 'border-gray-400' : 'border-gray-200'
                          } ${
                            color === 'yellow' ? 'bg-yellow-400' :
                            color === 'blue' ? 'bg-blue-400' :
                            color === 'green' ? 'bg-green-400' :
                            'bg-pink-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowQuickNoteModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateQuickNote}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Save Note
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabNotebookPage;