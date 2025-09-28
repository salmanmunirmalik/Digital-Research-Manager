import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ExperimentForm from '../components/ExperimentForm';
import IdeaForm from '../components/IdeaForm';
import InventoryForm from '../components/InventoryForm';
import SampleManagementForm from '../components/SampleManagementForm';
import EquipmentBookingForm from '../components/EquipmentBookingForm';
import ResultsForm from '../components/ResultsForm';
import MeetingForm from '../components/MeetingForm';
import ProblemForm from '../components/ProblemForm';
import { 
  BookOpenIcon,
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
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
  CubeIcon,
  WrenchScrewdriverIcon,
  TargetIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardListIcon,
  DocumentIcon,
  PresentationChartLineIcon,
  HomeIcon,
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
  const navigate = useNavigate();
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
  const [showEntryTypeModal, setShowEntryTypeModal] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  
  // Form states for different entry types
  const [showExperimentForm, setShowExperimentForm] = useState(false);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showSampleManagementForm, setShowSampleManagementForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LabNotebookEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEquipmentBookingForm, setShowEquipmentBookingForm] = useState(false);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showProblemForm, setShowProblemForm] = useState(false);
  
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

  // Entry type options
  const entryTypes = [
    { 
      id: 'experiment', 
      name: 'Experiment', 
      description: 'Plan and track experimental procedures',
      icon: BeakerIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      id: 'idea', 
      name: 'Idea', 
      description: 'Capture research ideas and concepts',
      icon: LightbulbIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    { 
      id: 'inventory', 
      name: 'Inventory', 
      description: 'Add or update inventory items',
      icon: CubeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      id: 'sample_management', 
      name: 'Sample Management', 
      description: 'Manage and track research samples',
      icon: ClipboardListIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    { 
      id: 'equipment_booking', 
      name: 'Book Equipment', 
      description: 'Reserve laboratory equipment',
      icon: WrenchScrewdriverIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      id: 'results', 
      name: 'Add Results', 
      description: 'Record experimental results and analysis',
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    { 
      id: 'meeting', 
      name: 'Meeting', 
      description: 'Document meeting notes and decisions',
      icon: UsersIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    { 
      id: 'problem', 
      name: 'Problem', 
      description: 'Report issues and track resolutions',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  // Handlers for different entry types
  const handleEntryTypeSelect = (type: string) => {
    setShowEntryTypeModal(false);
    switch (type) {
      case 'experiment':
        setShowExperimentForm(true);
        break;
      case 'idea':
        setShowIdeaForm(true);
        break;
      case 'inventory':
        setShowInventoryForm(true);
        break;
      case 'sample_management':
        setShowSampleManagementForm(true);
        break;
      case 'equipment_booking':
        setShowEquipmentBookingForm(true);
        break;
      case 'results':
        setShowResultsForm(true);
        break;
      case 'meeting':
        setShowMeetingForm(true);
        break;
      case 'problem':
        setShowProblemForm(true);
        break;
      default:
        setShowNewEntryModal(true);
    }
  };

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('🔍 Fetching lab entries, token:', token ? 'exists' : 'missing');
      if (!token) {
        console.log('No auth token found, using mock data');
        // Use mock data if no token
    const mockEntries: LabNotebookEntry[] = [
      {
        id: '1',
            title: 'Sample Experiment',
            content: 'This is a sample experiment entry.',
            entry_type: 'experiment',
        status: 'completed',
            priority: 'medium',
            objectives: 'Test the system',
            methodology: 'Basic testing',
            results: 'System working',
            conclusions: 'All good',
            next_steps: 'Continue testing',
        lab_id: 'lab1',
        lab_name: 'Main Lab',
            creator_name: 'Test User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: ['test', 'sample'],
        privacy_level: 'lab',
            estimated_duration: 60,
            actual_duration: 45,
            cost: 0,
            equipment_used: [],
            materials_used: [],
            safety_notes: '',
            references: [],
            collaborators: []
          }
        ];
        setEntries(mockEntries);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/lab-notebooks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📝 Lab entries API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📝 Lab entries data received:', data);
        setEntries(data.entries || data || []);
      } else {
        console.log('API request failed, using mock data');
        // Use mock data if API fails
        const mockEntries: LabNotebookEntry[] = [
          {
            id: '1',
            title: 'Sample Experiment',
            content: 'This is a sample experiment entry.',
        entry_type: 'experiment',
            status: 'completed',
        priority: 'medium',
            objectives: 'Test the system',
            methodology: 'Basic testing',
            results: 'System working',
            conclusions: 'All good',
            next_steps: 'Continue testing',
        lab_id: 'lab1',
        lab_name: 'Main Lab',
            creator_name: 'Test User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: ['test', 'sample'],
        privacy_level: 'lab',
            estimated_duration: 60,
            actual_duration: 45,
            cost: 0,
            equipment_used: [],
            materials_used: [],
            safety_notes: '',
            references: [],
        collaborators: []
      }
    ];
        setEntries(mockEntries);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      // Use mock data on error
      const mockEntries: LabNotebookEntry[] = [
      {
        id: '1',
          title: 'Sample Experiment',
          content: 'This is a sample experiment entry.',
          entry_type: 'experiment',
          status: 'completed',
          priority: 'medium',
          objectives: 'Test the system',
          methodology: 'Basic testing',
          results: 'System working',
          conclusions: 'All good',
          next_steps: 'Continue testing',
          lab_id: 'lab1',
          lab_name: 'Main Lab',
          creator_name: 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['test', 'sample'],
          privacy_level: 'lab',
          estimated_duration: 60,
          actual_duration: 45,
          cost: 0,
          equipment_used: [],
          materials_used: [],
          safety_notes: '',
          references: [],
          collaborators: []
        }
      ];
      setEntries(mockEntries);
    }
  };

  // Fetch quick notes from API
  const fetchQuickNotes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('🔍 Fetching quick notes, token:', token ? 'exists' : 'missing');
      if (!token) {
        console.log('No auth token found, using mock data for quick notes');
        // Use mock data if no token
    const mockQuickNotes: QuickNote[] = [
      {
        id: '1',
            content: 'Remember to check the incubator temperature',
        color: 'yellow',
            created_at: new Date().toISOString()
      },
      {
        id: '2',
            content: 'Order more pipette tips for next week',
        color: 'blue',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setQuickNotes(mockQuickNotes);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/quick-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📝 Quick notes API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📝 Quick notes data received:', data);
        setQuickNotes(data || []);
      } else {
        console.log('API request failed, using mock data for quick notes');
        // Use mock data if API fails
        const mockQuickNotes: QuickNote[] = [
      {
        id: '1',
            content: 'Remember to check the incubator temperature',
            color: 'yellow',
            created_at: new Date().toISOString()
      },
      {
        id: '2',
            content: 'Order more pipette tips for next week',
            color: 'blue',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setQuickNotes(mockQuickNotes);
      }
    } catch (error) {
      console.error('Error fetching quick notes:', error);
      // Use mock data on error
      const mockQuickNotes: QuickNote[] = [
      {
        id: '1',
          content: 'Remember to check the incubator temperature',
          color: 'yellow',
          created_at: new Date().toISOString()
      },
      {
        id: '2',
          content: 'Order more pipette tips for next week',
          color: 'blue',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    setQuickNotes(mockQuickNotes);
    }
  };

  const handleFormSubmit = async (data: any, type: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      // Convert form data to lab notebook entry format
      const entryData = {
        title: data.title,
        content: data.description || data.content || '',
        entry_type: type,
        status: data.status || 'completed',
        priority: data.priority || 'medium',
        objectives: data.objectives || '',
        methodology: data.methodology || '',
        results: data.results || data.conclusions || '',
        conclusions: data.conclusions || '',
        next_steps: data.next_steps || '',
        lab_id: data.lab_id || '550e8400-e29b-41d4-a716-446655440000',
        tags: data.tags || [],
        privacy_level: data.privacy_level || 'lab',
        estimated_duration: data.estimated_duration || 0,
        actual_duration: data.actual_duration || 0,
        cost: data.cost || 0,
        equipment_used: data.equipment || data.equipment_used || [],
        materials_used: data.materials || data.materials_used || [],
        safety_notes: data.safety_notes || '',
        references: data.references || [],
        collaborators: data.collaborators || []
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/lab-notebooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entryData)
      });

      if (response.ok) {
        const newEntry = await response.json();
        console.log('✅ Entry created successfully:', newEntry);
        
        // Close the form
        switch (type) {
          case 'experiment':
            setShowExperimentForm(false);
            break;
          case 'idea':
            setShowIdeaForm(false);
            break;
          case 'inventory':
            setShowInventoryForm(false);
            break;
          case 'equipment_booking':
            setShowEquipmentBookingForm(false);
            break;
          case 'results':
            setShowResultsForm(false);
            break;
          case 'meeting':
            setShowMeetingForm(false);
            break;
          case 'problem':
            setShowProblemForm(false);
            break;
        }
        // Refresh entries and activity
        fetchEntries();
        fetchRecentActivity();
      } else {
        const errorData = await response.json();
        console.error('Failed to create entry:', errorData);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, using mock data');
        // Use mock data if no token
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'entry_created',
            description: 'Created new experiment entry',
            user_name: user?.username || 'Current User',
            timestamp: new Date().toISOString(),
            icon: BeakerIcon,
            color: 'text-blue-600'
          },
          {
            id: '2',
            type: 'entry_updated',
            description: 'Updated lab notebook entry',
            user_name: user?.username || 'Current User',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            icon: PencilIcon,
            color: 'text-green-600'
          }
        ];
        setRecentActivity(mockActivity);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/lab-notebooks/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      } else {
        console.log('API request failed, using mock data');
        // Use mock data if API fails
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'entry_created',
            description: 'Created new experiment entry',
            user_name: user?.username || 'Current User',
            timestamp: new Date().toISOString(),
            icon: BeakerIcon,
            color: 'text-blue-600'
          }
        ];
        setRecentActivity(mockActivity);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Use mock data on error
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'entry_created',
          description: 'Created new experiment entry',
          user_name: user?.username || 'Current User',
          timestamp: new Date().toISOString(),
          icon: BeakerIcon,
          color: 'text-blue-600'
        }
      ];
      setRecentActivity(mockActivity);
    }
  };

  // Fetch smart suggestions
  const fetchSmartSuggestions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, using mock data');
        // Use mock data if no token
        const mockSuggestions: SmartSuggestion[] = [
          {
            id: '1',
            type: 'protocol',
            title: 'Protocol Recommendation',
            description: 'Consider using PCR protocol for DNA amplification',
            confidence: 85,
            priority: 'medium'
          },
          {
            id: '2',
            type: 'safety',
            title: 'Safety Reminder',
            description: 'Remember to wear gloves when handling chemicals',
            confidence: 95,
            priority: 'high'
          }
        ];
        setSmartSuggestions(mockSuggestions);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/lab-notebooks/suggestions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSmartSuggestions(data.suggestions || []);
      } else {
        console.log('API request failed, using mock data');
        // Use mock data if API fails
        const mockSuggestions: SmartSuggestion[] = [
          {
            id: '1',
            type: 'protocol',
            title: 'Protocol Recommendation',
            description: 'Consider using PCR protocol for DNA amplification',
            confidence: 85,
            priority: 'medium'
          }
        ];
        setSmartSuggestions(mockSuggestions);
      }
    } catch (error) {
      console.error('Error fetching smart suggestions:', error);
      // Use mock data on error
      const mockSuggestions: SmartSuggestion[] = [
        {
          id: '1',
          type: 'protocol',
          title: 'Protocol Recommendation',
          description: 'Consider using PCR protocol for DNA amplification',
          confidence: 85,
          priority: 'medium'
        }
      ];
      setSmartSuggestions(mockSuggestions);
    }
  };

  // Load data
  useEffect(() => {
    fetchEntries();
    fetchQuickNotes();
    fetchRecentActivity();
    fetchSmartSuggestions();
  }, []);

  // Handle view entry
  const handleViewEntry = (entry: LabNotebookEntry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  // Handle edit entry
  const handleEditEntry = (entry: LabNotebookEntry) => {
    setSelectedEntry(entry);
    setShowEditModal(true);
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/lab-notebooks/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Entry deleted successfully');
        // Refresh entries and activity
        fetchEntries();
        fetchRecentActivity();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete entry:', errorData);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Handle update entry
  const handleUpdateEntry = async (entryId: string, updatedData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/lab-notebooks/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        console.log('✅ Entry updated successfully');
        // Refresh entries and activity
        fetchEntries();
        fetchRecentActivity();
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to update entry:', errorData);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    if (!Array.isArray(entries)) {
      return [];
    }
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
    if (entryForm.title.trim()) {
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

  const handleCreateQuickNote = async () => {
    if (quickNoteForm.content.trim()) {
      try {
        const token = localStorage.getItem('authToken');
        console.log('📝 Creating quick note, token:', token ? 'exists' : 'missing');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/quick-notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: quickNoteForm.content.trim(),
            color: quickNoteForm.color
          })
        });

        console.log('📝 Create quick note response status:', response.status);
        if (response.ok) {
          const newNote = await response.json();
          console.log('📝 Quick note created successfully:', newNote);
          setQuickNotes(prev => [newNote, ...prev]);
          setQuickNoteForm({ content: '', color: 'yellow' });
          setShowQuickNoteModal(false);
        } else {
          console.error('Failed to create quick note');
          // Fallback to local state if API fails
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
      } catch (error) {
        console.error('Error creating quick note:', error);
        // Fallback to local state if API fails
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
          </div>
          </div>
          </div>


        {/* Quick Notes, Recent Activity, and Smart Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Entry Type Selection Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {entryTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.id}
                    onClick={() => handleEntryTypeSelect(type.id)}
                    className={`p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-200 ${type.bgColor} group`}
                  >
                    <div className="flex items-center mb-2">
                      <IconComponent className={`w-6 h-6 ${type.color} mr-2 group-hover:scale-110 transition-transform`} />
                      <h3 className="text-sm font-semibold text-gray-900">{type.name}</h3>
                    </div>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </div>
                );
              })}
                </div>
              </CardContent>
            </Card>

        {/* Real-Time Smart Calendar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-green-600" />
                Smart Calendar
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700">December 2024</span>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interactive Calendar Grid */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-white/20">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-slate-600 py-3 bg-white/60 rounded-lg backdrop-blur-sm">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Dates */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = i - 6 + 1;
                      const isCurrentMonth = date > 0 && date <= 31;
                      const isToday = date === new Date().getDate();
                      const hasEvent = [2, 5, 8, 12, 15, 18, 22, 25, 28].includes(date);
                      const isPast = date < new Date().getDate();
                      const isWeekend = i % 7 === 0 || i % 7 === 6;
                      
                      return (
                        <div
                          key={i}
                          className={`
                            relative aspect-square flex items-center justify-center text-sm font-medium rounded-xl cursor-pointer transition-all duration-300 group
                            ${isCurrentMonth 
                              ? isToday 
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold shadow-xl shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300' 
                                : hasEvent 
                                  ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-900 hover:from-blue-200 hover:to-blue-300 hover:shadow-lg hover:scale-105 border border-blue-300/50' 
                                  : isPast
                                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 hover:shadow-md'
                                    : isWeekend
                                      ? 'text-slate-700 hover:bg-white hover:shadow-lg hover:scale-105 bg-white/40'
                                      : 'text-slate-800 hover:bg-white hover:shadow-lg hover:scale-105 bg-white/60'
                              : 'text-slate-300 hover:text-slate-400'
                            }
                          `}
                        >
                          {isCurrentMonth && (
                            <span className="relative z-10">{date}</span>
                          )}
                          
                          {/* Event Indicator */}
                          {hasEvent && isCurrentMonth && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm"></div>
                            </div>
                          )}
                          
                          {/* Hover Effect */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Today's Glow Effect */}
                          {isToday && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-500/20 animate-pulse"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Calendar Footer */}
                  <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Today</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Events</span>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Features Panel */}
              <div className="space-y-4">
                {/* Today's Schedule */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Today's Schedule
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900">Team Standup</p>
                        <p className="text-xs text-blue-700">9:00 AM - 9:30 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-900">Lab Session</p>
                        <p className="text-xs text-green-700">2:00 PM - 4:00 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-purple-900">Equipment Check</p>
                        <p className="text-xs text-purple-700">5:00 PM - 5:30 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Suggestions */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-yellow-500" />
                    Smart Suggestions
                  </h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs font-medium text-yellow-900">Schedule buffer time</p>
                      <p className="text-xs text-yellow-700">Add 15min before next meeting</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <p className="text-xs font-medium text-orange-900">Equipment maintenance</p>
                      <p className="text-xs text-orange-700">Due in 3 days</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-900">New Meeting</span>
                      </div>
                    </button>
                    <button className="w-full p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                      <div className="flex items-center space-x-2">
                        <BeakerIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-900">Book Equipment</span>
                      </div>
                    </button>
                    <button className="w-full p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-900">Set Reminder</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lab Notebook Entries */}
          <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lab Notebook Entries</h2>
          </div>

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
                            <Link to="/lab-management" className="flex items-center gap-1 text-green-600 hover:text-green-800">
                              <ClipboardListIcon className="h-4 w-4" />
                              Inventory
                            </Link>
                            <Link to="/lab-management" className="flex items-center gap-1 text-purple-600 hover:text-purple-800">
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewEntry(entry)}
                          title="View Entry"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                          title="Edit Entry"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteEntry(entry.id)}
                          title="Delete Entry"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        {/* Entry Type Selection Modal */}
        {showEntryTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Choose Entry Type</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEntryTypeModal(false)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entryTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={type.id}
                        onClick={() => handleEntryTypeSelect(type.id)}
                        className={`p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-200 ${type.bgColor}`}
                      >
                        <div className="flex items-center mb-3">
                          <IconComponent className={`w-8 h-8 ${type.color} mr-3`} />
                          <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
              </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                    );
                  })}
              </div>
              </div>
          </div>
        </div>
      )}

        {/* Form Modals */}
        {showExperimentForm && (
          <ExperimentForm
            onSubmit={(data) => handleFormSubmit(data, 'experiment')}
            onCancel={() => setShowExperimentForm(false)}
          />
        )}

        {showIdeaForm && (
          <IdeaForm
            onSubmit={(data) => handleFormSubmit(data, 'idea')}
            onCancel={() => setShowIdeaForm(false)}
          />
        )}

        {showInventoryForm && (
          <InventoryForm
            onSubmit={(data) => handleFormSubmit(data, 'inventory')}
            onCancel={() => setShowInventoryForm(false)}
          />
        )}

        {showSampleManagementForm && (
          <SampleManagementForm
            onSubmit={(data) => handleFormSubmit(data, 'sample_management')}
            onCancel={() => setShowSampleManagementForm(false)}
          />
        )}

        {showEquipmentBookingForm && (
          <EquipmentBookingForm
            onSubmit={(data) => handleFormSubmit(data, 'equipment_booking')}
            onCancel={() => setShowEquipmentBookingForm(false)}
          />
        )}

        {showResultsForm && (
          <ResultsForm
            onSubmit={(data) => handleFormSubmit(data, 'results')}
            onCancel={() => setShowResultsForm(false)}
          />
        )}

        {showMeetingForm && (
          <MeetingForm
            onSubmit={(data) => handleFormSubmit(data, 'meeting')}
            onCancel={() => setShowMeetingForm(false)}
          />
        )}

        {showProblemForm && (
          <ProblemForm
            onSubmit={(data) => handleFormSubmit(data, 'problem')}
            onCancel={() => setShowProblemForm(false)}
          />
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

      {/* View Entry Modal */}
      {showViewModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedEntry.title}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewModal(false)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Entry Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900">{selectedEntry.entry_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-900">{selectedEntry.status}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <p className="text-sm text-gray-900">{selectedEntry.priority}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">{new Date(selectedEntry.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {selectedEntry.content && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Content</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEntry.content}</p>
                  </div>
                )}

                {selectedEntry.objectives && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Objectives</h3>
                    <p className="text-sm text-gray-700">{selectedEntry.objectives}</p>
                  </div>
                )}

                {selectedEntry.results && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Results</h3>
                    <p className="text-sm text-gray-700">{selectedEntry.results}</p>
                  </div>
                )}

                {selectedEntry.conclusions && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Conclusions</h3>
                    <p className="text-sm text-gray-700">{selectedEntry.conclusions}</p>
                  </div>
                )}

                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditEntry(selectedEntry);
                  }}
                >
                  Edit Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Edit Entry</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <Input
                    value={selectedEntry.title}
                    onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Entry title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={selectedEntry.content || ''}
                    onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Entry content"
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <Select
                      value={selectedEntry.status}
                      onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, status: e.target.value } : null)}
                    >
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <Select
                      value={selectedEntry.priority}
                      onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, priority: e.target.value } : null)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
                  <textarea
                    value={selectedEntry.objectives || ''}
                    onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, objectives: e.target.value } : null)}
                    placeholder="Entry objectives"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                  <textarea
                    value={selectedEntry.results || ''}
                    onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, results: e.target.value } : null)}
                    placeholder="Entry results"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
                  <textarea
                    value={selectedEntry.conclusions || ''}
                    onChange={(e) => setSelectedEntry(prev => prev ? { ...prev, conclusions: e.target.value } : null)}
                    placeholder="Entry conclusions"
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedEntry) {
                      handleUpdateEntry(selectedEntry.id, {
                        title: selectedEntry.title,
                        content: selectedEntry.content,
                        status: selectedEntry.status,
                        priority: selectedEntry.priority,
                        objectives: selectedEntry.objectives,
                        results: selectedEntry.results,
                        conclusions: selectedEntry.conclusions,
                        next_steps: selectedEntry.next_steps,
                        tags: selectedEntry.tags,
                        privacy_level: selectedEntry.privacy_level
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
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