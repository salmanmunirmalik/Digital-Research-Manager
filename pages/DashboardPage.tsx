import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  TrendingUpIcon,
  BookOpenIcon,
  BeakerIcon,
  ChartBarIcon,
  UsersIcon,
  PlusIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  XMarkIcon,
  SaveIcon,
  RefreshCwIcon,
  StarIcon,
  PinIcon,
  AlertCircleIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SparklesIcon,
  BrainIcon,
  TargetIcon
} from '../components/icons';
import { 
  Task, 
  CalendarEvent, 
  StickyNote, 
  ExperimentUpdate, 
  DashboardStats,
  QuickAction 
} from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [experimentUpdates, setExperimentUpdates] = useState<ExperimentUpdate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_protocols: 0,
    total_experiments: 0,
    pending_tasks: 0,
    upcoming_events: 0,
    lab_members: 0,
    active_projects: 0
  });

  // Lab Notebook States
  const [notebookEntries, setNotebookEntries] = useState<any[]>([]);
  const [showCreateEntryModal, setShowCreateEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({
    title: '',
    content: '',
    entry_type: 'experiment' as 'experiment' | 'observation' | 'protocol' | 'analysis' | 'idea' | 'meeting',
    status: 'planning' as 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'failed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    objectives: '',
    methodology: '',
    results: '',
    conclusions: '',
    next_steps: '',
    lab_id: 'lab1',
    tags: [] as string[],
    privacy_level: 'lab' as 'private' | 'lab' | 'institution' | 'public',
    estimated_duration: 0,
    actual_duration: 0,
    cost: 0,
    equipment_used: [] as string[],
    materials_used: [] as string[],
    safety_notes: '',
    references: [] as string[],
    collaborators: [] as string[]
  });

  // Cognitive Enhancement States
  const [cognitiveInsights, setCognitiveInsights] = useState<Array<{
    id: string;
    type: 'insight' | 'suggestion' | 'alert' | 'achievement';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action?: {
      label: string;
      route: string;
    };
    icon: string;
    color: string;
  }>>([]);
  
  const [focusMode, setFocusMode] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{
    id: string;
    type: 'next_action' | 'optimization' | 'reminder';
    title: string;
    description: string;
    confidence: number;
    action: string;
  }>>([]);
  
  const [cognitiveLoad, setCognitiveLoad] = useState<'low' | 'medium' | 'high'>('medium');
  const [userContext, setUserContext] = useState<{
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    workPattern: 'focused' | 'collaborative' | 'administrative';
    currentGoal: string | null;
  }>({
    timeOfDay: 'morning',
    workPattern: 'focused',
    currentGoal: null
  });

  // Progressive Disclosure States
  const [expandedSections, setExpandedSections] = useState<{
    stickyNotes: boolean;
    tasks: boolean;
    experiments: boolean;
    notebook: boolean;
    activity: boolean;
  }>({
    stickyNotes: false,
    tasks: false,
    experiments: false,
    notebook: false,
    activity: false
  });

  const [defaultItemCounts] = useState({
    stickyNotes: 3,
    tasks: 4,
    experiments: 3,
    notebook: 4,
    activity: 5
  });

  // Interactive states
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'task' | 'event' | 'note' | 'experiment'>('task');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<'yellow' | 'blue' | 'green' | 'purple'>('yellow');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'protocol' | 'member' | 'equipment' | 'experiment' | 'task';
    message: string;
    timestamp: string;
    color: string;
  }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Cognitive Enhancement Functions
  const generateCognitiveInsights = () => {
    const insights = [];
    
    // Time-based insights
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      insights.push({
        id: 'morning-focus',
        type: 'insight' as const,
        title: 'Morning Focus Time',
        description: 'Your brain is most alert now. Perfect for complex analytical tasks.',
        priority: 'medium' as const,
        action: { label: 'Start Deep Work', route: '/lab-notebook' },
        icon: 'BrainIcon',
        color: 'blue'
      });
    }
    
    // Task-based insights
    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      insights.push({
        id: 'overdue-alert',
        type: 'alert' as const,
        title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
        description: 'These tasks need immediate attention to maintain project momentum.',
        priority: 'high' as const,
        action: { label: 'View Tasks', route: '/tasks' },
        icon: 'ExclamationTriangleIcon',
        color: 'red'
      });
    }
    
    // Productivity insights
    const completedToday = tasks.filter(task => 
      task.status === 'completed' && 
      new Date(task.updated_at).toDateString() === new Date().toDateString()
    );
    if (completedToday.length >= 3) {
      insights.push({
        id: 'productivity-win',
        type: 'achievement' as const,
        title: 'Productivity Streak!',
        description: `You've completed ${completedToday.length} tasks today. Keep the momentum going!`,
        priority: 'low' as const,
        icon: 'SparklesIcon',
        color: 'green'
      });
    }
    
    // Lab efficiency insights
    const activeExperiments = experimentUpdates.filter(exp => exp.progress_percentage > 0 && exp.progress_percentage < 100);
    if (activeExperiments.length > 0) {
      insights.push({
        id: 'experiment-progress',
        type: 'suggestion' as const,
        title: 'Active Experiments',
        description: `${activeExperiments.length} experiment${activeExperiments.length > 1 ? 's' : ''} in progress. Consider updating progress.`,
        priority: 'medium' as const,
        action: { label: 'Update Progress', route: '/lab-notebook' },
        icon: 'BeakerIcon',
        color: 'purple'
      });
    }
    
    setCognitiveInsights(insights);
  };

  const generateSmartSuggestions = () => {
    const suggestions = [];
    
    // Next action suggestions based on user patterns
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    if (pendingTasks.length > 0) {
      const highPriorityTask = pendingTasks.find(task => task.priority === 'high');
      if (highPriorityTask) {
        suggestions.push({
          id: 'high-priority-task',
          type: 'next_action' as const,
          title: 'High Priority Task',
          description: `"${highPriorityTask.title}" needs attention`,
          confidence: 0.9,
          action: 'Complete high priority task'
        });
      }
    }
    
    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 14 && hour <= 16) {
      suggestions.push({
        id: 'afternoon-collaboration',
        type: 'optimization' as const,
        title: 'Collaboration Window',
        description: 'Afternoon is ideal for team meetings and collaborative work',
        confidence: 0.7,
        action: 'Schedule team collaboration'
      });
    }
    
    // Resource optimization
    const upcomingEvents = events.filter(event => 
      new Date(event.start_time) > new Date() && 
      new Date(event.start_time) < new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    if (upcomingEvents.length > 0) {
      suggestions.push({
        id: 'prepare-for-events',
        type: 'reminder' as const,
        title: 'Upcoming Events',
        description: `You have ${upcomingEvents.length} event${upcomingEvents.length > 1 ? 's' : ''} tomorrow. Prepare materials.`,
        confidence: 0.8,
        action: 'Prepare for upcoming events'
      });
    }
    
    setSmartSuggestions(suggestions);
  };

  const calculateCognitiveLoad = () => {
    let load = 0;
    
    // Factor in number of pending tasks
    load += tasks.filter(task => task.status === 'pending').length * 0.1;
    
    // Factor in upcoming deadlines
    const urgentTasks = tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) &&
      task.status !== 'completed'
    );
    load += urgentTasks.length * 0.2;
    
    // Factor in active experiments
    load += experimentUpdates.filter(exp => exp.progress_percentage > 0 && exp.progress_percentage < 100).length * 0.15;
    
    // Factor in upcoming events
    load += events.filter(event => 
      new Date(event.start_time) > new Date() && 
      new Date(event.start_time) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length * 0.1;
    
    if (load < 2) setCognitiveLoad('low');
    else if (load < 4) setCognitiveLoad('medium');
    else setCognitiveLoad('high');
  };

  const updateUserContext = () => {
    const hour = new Date().getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    // Determine work pattern based on user activity
    const collaborativeTasks = tasks.filter(task => 
      task.tags?.includes('meeting') || task.tags?.includes('collaboration')
    );
    const adminTasks = tasks.filter(task => 
      task.tags?.includes('admin') || task.tags?.includes('documentation')
    );
    
    let workPattern: 'focused' | 'collaborative' | 'administrative';
    if (collaborativeTasks.length > adminTasks.length) workPattern = 'collaborative';
    else if (adminTasks.length > collaborativeTasks.length) workPattern = 'administrative';
    else workPattern = 'focused';
    
    setUserContext({
      timeOfDay,
      workPattern,
      currentGoal: null // Could be set based on user preferences or recent activity
    });
  };

  // Lab Notebook Functions
  const createNotebookEntry = async () => {
    // Create new entry with comprehensive data
    const newEntry = {
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
      lab_name: 'Molecular Biology Lab',
      creator_name: user?.name || 'Dr. Sarah Johnson',
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

    // Add to existing entries
    setNotebookEntries(prev => [newEntry, ...prev]);
    
    // Close modal and reset form
    setShowCreateEntryModal(false);
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
  };

  // Progressive Disclosure Helper Functions
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDisplayItems = (items: any[], section: keyof typeof defaultItemCounts) => {
    const isExpanded = expandedSections[section];
    const defaultCount = defaultItemCounts[section];
    return isExpanded ? items : items.slice(0, defaultCount);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'experiment': return '🧪';
      case 'observation': return '👁️';
      case 'protocol': return '📋';
      case 'analysis': return '📊';
      case 'idea': return '💡';
      case 'meeting': return '👥';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data - replace with real API calls
  useEffect(() => {
    // Load mock data
    setTasks([
      {
        id: '1',
        title: 'Review PCR protocol',
        description: 'Check the new PCR protocol for accuracy',
        user_id: 'user1',
        priority: 'high',
        status: 'pending',
        due_date: '2024-01-15',
        tags: ['protocol', 'review'],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z'
      },
      {
        id: '2',
        title: 'Prepare lab presentation',
        description: 'Create slides for weekly lab meeting',
        user_id: 'user1',
        priority: 'medium',
        status: 'in_progress',
        due_date: '2024-01-12',
        tags: ['presentation', 'meeting'],
        created_at: '2024-01-08T14:00:00Z',
        updated_at: '2024-01-08T14:00:00Z'
      }
    ]);

    // Mock notebook entries
    setNotebookEntries([
      {
        id: '1',
        title: 'PCR Optimization Experiment',
        content: 'Testing different annealing temperatures for optimal PCR results. Initial results show 55°C works best for our primer set.',
        entry_type: 'experiment',
        status: 'in_progress',
        priority: 'high',
        objectives: 'Find optimal annealing temperature for PCR amplification',
        methodology: 'Test temperatures from 50°C to 65°C in 5°C increments',
        results: '55°C showed best amplification with minimal primer dimers',
        conclusions: 'Optimal temperature identified, ready for scale-up',
        next_steps: 'Test with different primer concentrations',
        lab_id: 'lab1',
        lab_name: 'Molecular Biology Lab',
        creator_name: 'Dr. Sarah Johnson',
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-10T15:30:00Z',
        tags: ['PCR', 'optimization', 'molecular-biology']
      },
      {
        id: '2',
        title: 'Cell Culture Observation',
        content: 'HeLa cells showing normal morphology after 48 hours. Confluence at 80%, ready for passaging.',
        entry_type: 'observation',
        status: 'completed',
        priority: 'medium',
        objectives: 'Monitor cell health and morphology',
        methodology: 'Daily observation under microscope',
        results: 'Cells healthy, good morphology, 80% confluence',
        conclusions: 'Cells ready for next experiment',
        next_steps: 'Passage cells for next experiment',
        lab_id: 'lab1',
        lab_name: 'Molecular Biology Lab',
        creator_name: 'Dr. Sarah Johnson',
        created_at: '2024-01-09T14:00:00Z',
        updated_at: '2024-01-09T14:00:00Z',
        tags: ['cell-culture', 'HeLa', 'observation']
      },
      {
        id: '3',
        title: 'Protein Extraction Protocol',
        content: 'Standardized protocol for protein extraction from tissue samples. Includes lysis buffer composition and centrifugation parameters.',
        entry_type: 'protocol',
        status: 'completed',
        priority: 'medium',
        objectives: 'Create standardized protein extraction protocol',
        methodology: 'Test different lysis buffers and conditions',
        results: 'RIPA buffer with protease inhibitors works best',
        conclusions: 'Protocol standardized and documented',
        next_steps: 'Train lab members on new protocol',
        lab_id: 'lab1',
        lab_name: 'Molecular Biology Lab',
        creator_name: 'Dr. Sarah Johnson',
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z',
        tags: ['protocol', 'protein-extraction', 'standardization']
      },
      {
        id: '4',
        title: 'Data Analysis - Gene Expression',
        content: 'Analyzing RNA-seq data from treated vs control samples. Found 150 differentially expressed genes.',
        entry_type: 'analysis',
        status: 'in_progress',
        priority: 'high',
        objectives: 'Identify differentially expressed genes',
        methodology: 'RNA-seq analysis using DESeq2',
        results: '150 genes with significant expression changes',
        conclusions: 'Treatment shows significant gene expression changes',
        next_steps: 'Validate top candidates with qPCR',
        lab_id: 'lab1',
        lab_name: 'Molecular Biology Lab',
        creator_name: 'Dr. Sarah Johnson',
        created_at: '2024-01-07T16:00:00Z',
        updated_at: '2024-01-10T11:00:00Z',
        tags: ['RNA-seq', 'gene-expression', 'bioinformatics']
      },
      {
        id: '5',
        title: 'Research Idea - CRISPR Screening',
        content: 'New idea for genome-wide CRISPR screen to identify genes involved in drug resistance. Could be high-impact project.',
        entry_type: 'idea',
        status: 'planning',
        priority: 'medium',
        objectives: 'Develop CRISPR screening approach',
        methodology: 'Genome-wide CRISPR library screening',
        results: 'Conceptual framework developed',
        conclusions: 'Feasible approach with high potential',
        next_steps: 'Write grant proposal',
        lab_id: 'lab1',
        lab_name: 'Molecular Biology Lab',
        creator_name: 'Dr. Sarah Johnson',
        created_at: '2024-01-06T13:00:00Z',
        updated_at: '2024-01-06T13:00:00Z',
        tags: ['CRISPR', 'screening', 'drug-resistance', 'idea']
      },
      {
        id: '6',
        title: 'Weekly Lab Meeting Notes',
        content: 'Discussed progress on three ongoing projects. PCR optimization going well, need to order more reagents for next phase.',
        entry_type: 'meeting',
        status: 'completed',
        priority: 'low',
        objectives: 'Review project progress and plan next steps',
        methodology: 'Weekly team meeting',
        results: 'All projects on track, identified needs',
        conclusions: 'Good progress, need reagent order',
        next_steps: 'Order reagents, continue experiments',
        lab_id: 'lab1',
        lab_name: 'Molecular Biology Lab',
        creator_name: 'Dr. Sarah Johnson',
        created_at: '2024-01-05T11:00:00Z',
        updated_at: '2024-01-05T11:00:00Z',
        tags: ['meeting', 'progress-review', 'planning']
      }
    ]);

    setEvents([
      {
        id: '1',
        user_id: 'user1',
        title: 'Lab Meeting',
        description: 'Weekly lab meeting to discuss progress',
        start_time: '2024-01-12T10:00:00Z',
        end_time: '2024-01-12T11:00:00Z',
        all_day: false,
        event_type: 'meeting',
        reminder_minutes: 15,
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z'
      },
      {
        id: '2',
        user_id: 'user1',
        title: 'Equipment Maintenance',
        description: 'Monthly maintenance for PCR machine',
        start_time: '2024-01-15T14:00:00Z',
        end_time: '2024-01-15T16:00:00Z',
        all_day: false,
        event_type: 'maintenance',
        reminder_minutes: 30,
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z'
      }
    ]);

    setStickyNotes([
      {
        id: '1',
        user_id: 'user1',
        content: 'Remember to order new pipette tips',
        color: 'yellow',
        position_x: 100,
        position_y: 100,
        is_pinned: true,
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z'
      },
      {
        id: '2',
        user_id: 'user1',
        content: 'Check temperature settings for incubator',
        color: 'blue',
        position_x: 300,
        position_y: 150,
        is_pinned: false,
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z'
      }
    ]);

    setExperimentUpdates([
      {
        id: '1',
        user_id: 'user1',
        title: 'PCR Optimization Progress',
        content: 'Successfully optimized annealing temperature to 58°C',
        update_type: 'progress',
        progress_percentage: 75,
        challenges: 'Initial amplification was weak',
        solutions: 'Adjusted MgCl2 concentration and annealing temperature',
        next_milestone: 'Test with different primer pairs',
        tags: ['PCR', 'optimization'],
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z'
      }
    ]);

    setStats({
      total_protocols: 12,
      total_experiments: 8,
      pending_tasks: 5,
      upcoming_events: 3,
      lab_members: 15,
      active_projects: 4
    });

    // Load initial activity
    setRecentActivity([
      { id: '1', type: 'protocol', message: 'Protocol "PCR Optimization" updated', timestamp: '2 hours ago', color: 'green' },
      { id: '2', type: 'member', message: 'Dr. Sarah Johnson joined the lab', timestamp: '5 hours ago', color: 'blue' },
      { id: '3', type: 'equipment', message: 'Centrifuge maintenance scheduled', timestamp: '1 day ago', color: 'purple' },
      { id: '4', type: 'experiment', message: 'Cell culture experiment started', timestamp: '2 days ago', color: 'orange' },
      { id: '5', type: 'task', message: 'Data analysis task completed', timestamp: '3 days ago', color: 'green' }
    ]);

    // Initialize cognitive enhancements
    updateUserContext();
    calculateCognitiveLoad();
  }, []);

  // Update cognitive insights when data changes
  useEffect(() => {
    generateCognitiveInsights();
    generateSmartSuggestions();
    calculateCognitiveLoad();
  }, [tasks, events, experimentUpdates]);

  // Interactive functions
  const addNewTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
        status: 'pending',
        due_date: newTaskDueDate || undefined,
        assigned_by: 'current-user',
        user_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setShowQuickAddModal(false);
      addActivity('task', `New task "${newTaskTitle}" created`);
    }
  };

  const addNewEvent = () => {
    if (newEventTitle.trim() && newEventDate && newEventTime) {
      const startTime = new Date(`${newEventDate}T${newEventTime}`).toISOString();
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: newEventTitle,
        description: newEventDescription,
        start_time: startTime,
        end_time: new Date(Date.parse(startTime) + 60*60*1000).toISOString(), // 1 hour later
        user_id: 'current-user',
        all_day: false,
        event_type: 'meeting',
        reminder_minutes: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setEvents(prev => [newEvent, ...prev]);
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventDate('');
      setNewEventTime('');
      setShowQuickAddModal(false);
      addActivity('experiment', `New event "${newEventTitle}" scheduled`);
    }
  };

  const addNewNote = () => {
    if (newNoteContent.trim()) {
      const newNote: StickyNote = {
        id: `note-${Date.now()}`,
        content: newNoteContent,
        color: newNoteColor,
        is_pinned: false,
        user_id: 'current-user',
        position_x: 0,
        position_y: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setStickyNotes(prev => [newNote, ...prev]);
      setNewNoteContent('');
      setShowQuickAddModal(false);
      addActivity('protocol', 'New sticky note added');
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addActivity('task', `Task "${task.title}" ${task.status === 'completed' ? 'reopened' : 'completed'}`);
    }
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (task) {
      addActivity('task', `Task "${task.title}" deleted`);
    }
  };

  const deleteNote = (noteId: string) => {
    setStickyNotes(prev => prev.filter(note => note.id !== noteId));
    addActivity('protocol', 'Sticky note deleted');
  };

  const toggleNotePinned = (noteId: string) => {
    setStickyNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, is_pinned: !note.is_pinned }
        : note
    ));
  };

  const editNote = (noteId: string, newContent: string) => {
    setStickyNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content: newContent, updated_at: new Date().toISOString() }
        : note
    ));
    setEditingNoteId(null);
    addActivity('protocol', 'Sticky note updated');
  };

  const addActivity = (type: 'protocol' | 'member' | 'equipment' | 'experiment' | 'task', message: string) => {
    const colors = { protocol: 'green', member: 'blue', equipment: 'purple', experiment: 'orange', task: 'indigo' };
    const newActivity = {
      id: `activity-${Date.now()}`,
      type,
      message,
      timestamp: 'Just now',
      color: colors[type]
    };
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only 10 most recent
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      addActivity('protocol', 'Dashboard refreshed');
      setRefreshing(false);
    }, 1000);
  };

  const updateExperimentProgress = (experimentId: string, newProgress: number) => {
    setExperimentUpdates(prev => prev.map(exp => 
      exp.id === experimentId 
        ? { ...exp, progress_percentage: newProgress, updated_at: new Date().toISOString() }
        : exp
    ));
    addActivity('experiment', `Experiment progress updated to ${newProgress}%`);
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'New Protocol',
      description: 'Create a new research protocol',
      icon: 'BeakerIcon',
      route: '/protocols/new',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: '2',
      title: 'Lab Entry',
      description: 'Add new experiment entry',
      icon: 'BookOpenIcon',
      route: '/notebook/new',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '3',
      title: 'Book Instrument',
      description: 'Schedule equipment time',
      icon: 'ClockIcon',
      route: '/instruments/book',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: '4',
      title: 'Add Task',
      description: 'Create new task',
      icon: 'CheckCircleIcon',
      route: '/tasks/new',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="page-container">
      {/* Enhanced Cognitive Header */}
      <div className="page-section">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                cognitiveLoad === 'low' ? 'bg-green-100 text-green-800' :
                cognitiveLoad === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {cognitiveLoad === 'low' ? 'Low Load' : cognitiveLoad === 'medium' ? 'Medium Load' : 'High Load'}
            </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <BrainIcon className="w-4 h-4 text-blue-600" />
                <span className="capitalize">{userContext.timeOfDay} • {userContext.workPattern} mode</span>
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Welcome,</span>
                  <span className="font-medium text-gray-900">{user.name || 'Researcher'}</span>
                </div>
              )}
            </div>

            {/* Cognitive Insights Banner */}
            {cognitiveInsights.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <LightBulbIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Smart Insights</h3>
                    <div className="space-y-2">
                      {cognitiveInsights.slice(0, 2).map((insight) => (
                        <div key={insight.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 font-medium">{insight.title}</p>
                            <p className="text-xs text-blue-600">{insight.description}</p>
                          </div>
                          {insight.action && (
                            <Link
                              to={insight.action.route}
                              className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                            >
                              {insight.action.label}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={() => setFocusMode(!focusMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                focusMode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TargetIcon className="w-4 h-4 inline mr-2" />
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </button>
                          <button
              onClick={() => setShowQuickAddModal(true)}
              className="btn-primary"
            >
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Quick Add
              </button>
          </div>
        </div>
      </div>

        {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="page-section">
            <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Protocols</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_protocols}</p>
              </div>
            </div>
          </div>
          
        <div className="page-section">
            <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Experiments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_experiments}</p>
              </div>
            </div>
          </div>
          
        <div className="page-section">
            <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending_tasks}</p>
              </div>
            </div>
          </div>
          
        <div className="page-section">
            <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.upcoming_events}</p>
              </div>
            </div>
          </div>
        </div>

      {/* Smart Suggestions Section */}
      {smartSuggestions.length > 0 && (
        <div className="page-section">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold text-purple-900">Smart Suggestions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smartSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{suggestion.title}</h3>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        suggestion.confidence > 0.8 ? 'bg-green-500' :
                        suggestion.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-500">{Math.round(suggestion.confidence * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                  <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                    {suggestion.action} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Dashboard'}</span>
            <span className="sm:hidden">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowCreateEntryModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Entry
          </button>
                </div>
      </div>



      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Sticky Notes & Tasks */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          {/* Sticky Notes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sticky Notes</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setQuickAddType('note');
                    setShowQuickAddModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Note
                </button>
                {stickyNotes.length > defaultItemCounts.stickyNotes && (
                  <button
                    onClick={() => toggleSection('stickyNotes')}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    {expandedSections.stickyNotes ? 'Show Less' : `Show All ${stickyNotes.length}`}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stickyNotes.length === 0 ? (
                <div className="md:col-span-2 text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-2xl">📝</span>
                  </div>
                  <p>No sticky notes yet. Add your first note!</p>
                </div>
              ) : (
                getDisplayItems(
                  stickyNotes.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)),
                  'stickyNotes'
                ).map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-4 rounded-lg border-l-4 group hover:shadow-md transition-all ${
                        note.color === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
                        note.color === 'blue' ? 'bg-blue-50 border-blue-400' :
                        note.color === 'green' ? 'bg-green-50 border-green-400' :
                        note.color === 'purple' ? 'bg-purple-50 border-purple-400' :
                        'bg-gray-50 border-gray-400'
                      }`}
                    >
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {(['yellow', 'blue', 'green', 'purple'] as const).map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewNoteColor(color)}
                                  className={`w-4 h-4 rounded-full border-2 ${
                                    color === 'yellow' ? 'bg-yellow-400' :
                                    color === 'blue' ? 'bg-blue-400' :
                                    color === 'green' ? 'bg-green-400' :
                                    'bg-purple-400'
                                  } ${newNoteColor === color ? 'ring-2 ring-gray-500' : ''}`}
                                  title={`${color} note`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => editNote(note.id, newNoteContent)}
                                className="text-green-600 hover:text-green-700 p-1 rounded"
                                title="Save"
                              >
                                <SaveIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setNewNoteContent('');
                                }}
                                className="text-gray-600 hover:text-gray-700 p-1 rounded"
                                title="Cancel"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-800 text-sm leading-relaxed">{note.content}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleNotePinned(note.id)}
                                className={`p-1 rounded transition-colors ${
                                  note.is_pinned ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400 hover:text-yellow-600'
                                }`}
                                title={note.is_pinned ? 'Unpin' : 'Pin'}
                              >
                                <PinIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setNewNoteContent(note.content);
                                  setNewNoteColor(note.color);
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                title="Edit"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {note.is_pinned && (
                            <div className="absolute top-2 right-2">
                              <PinIcon className="w-3 h-3 text-yellow-600" />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
              )}
          </div>
        </div>

            {/* Enhanced Tasks Section with Cognitive Prioritization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Priority Tasks</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">High Priority</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setQuickAddType('task');
                      setShowQuickAddModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Task
                  </button>
                  {tasks.length > defaultItemCounts.tasks && (
                    <button
                      onClick={() => toggleSection('tasks')}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      {expandedSections.tasks ? 'Show Less' : `Show All ${tasks.length}`}
                    </button>
                  )}
                </div>
              </div>
              </div>
              
              {/* Cognitive Task Prioritization */}
              {(() => {
                const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'completed');
                const overdueTasks = tasks.filter(task => 
                  task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                );
                const urgentTasks = [...new Set([...highPriorityTasks, ...overdueTasks])];
                const otherTasks = tasks.filter(task => 
                  task.status !== 'completed' && !urgentTasks.includes(task)
                );
                
                const displayOtherTasks = getDisplayItems(otherTasks, 'tasks');
                
                return (
                  <div className="space-y-4">
                    {/* Urgent Tasks */}
                    {urgentTasks.length > 0 && (
              <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                          <h3 className="text-sm font-semibold text-red-800">Urgent ({urgentTasks.length})</h3>
                        </div>
                        {urgentTasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border-2 border-red-200 bg-red-50 transition-all hover:shadow-md">
                    <div className="flex items-center space-x-3">
                              <input 
                                type="checkbox" 
                                checked={task.status === 'completed'}
                                onChange={() => toggleTaskComplete(task.id)}
                                className="w-4 h-4 text-red-600 rounded transition-colors"
                              />
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">{task.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    {task.priority}
                                  </span>
                                  {task.due_date && (
                                    <span className={`text-xs ${
                                      new Date(task.due_date) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'
                                    }`}>
                                      {new Date(task.due_date) < new Date() ? 'OVERDUE' : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button 
                                onClick={() => setEditingTaskId(task.id)}
                                className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                title="Edit task"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Delete task"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Other Tasks */}
                    {displayOtherTasks.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-blue-800">Other Tasks ({otherTasks.length})</h3>
                        </div>
                        {displayOtherTasks.map((task) => (
                          <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center space-x-3">
                              <input 
                                type="checkbox" 
                                checked={task.status === 'completed'}
                                onChange={() => toggleTaskComplete(task.id)}
                                className="w-4 h-4 text-blue-600 rounded transition-colors"
                              />
                              <div>
                                <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {task.title}
                                </p>
                                <p className={`text-sm ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {task.description}
                                </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                            <div className="flex items-center space-x-1">
                              <button 
                                onClick={() => setEditingTaskId(task.id)}
                                className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                title="Edit task"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Delete task"
                              >
                                <TrashIcon className="w-4 h-4" />
                    </button>
                            </div>
                  </div>
                ))}
              </div>
                    )}
                    
                    {urgentTasks.length === 0 && displayOtherTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No pending tasks. Great job!</p>
              </div>
                    )}
                    </div>
                );
              })()}
            </div>



            {/* Experiment Updates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Experiment Updates</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
              </div>
              <div className="space-y-4">
              {experimentUpdates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BeakerIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No experiment updates yet.</p>
                </div>
              ) : (
                experimentUpdates.map((update) => (
                  <div key={update.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{update.title}</h3>
                      <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-600 font-medium">
                          {update.progress_percentage}%
                      </span>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => updateExperimentProgress(update.id, Math.max(0, update.progress_percentage - 10))}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                            title="Decrease progress"
                          >
                            -
                          </button>
                          <button 
                            onClick={() => updateExperimentProgress(update.id, Math.min(100, update.progress_percentage + 10))}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                            title="Increase progress"
                          >
                            +
                          </button>
                    </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${update.progress_percentage}%` }}
                      ></div>
                    </div>

                    <p className="text-gray-700 mb-3">{update.content}</p>
                    {update.challenges && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-red-600">⚠️ Challenges: </span>
                        <span className="text-sm text-gray-600">{update.challenges}</span>
                      </div>
                    )}
                    {update.solutions && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-green-600">✅ Solutions: </span>
                        <span className="text-sm text-gray-600">{update.solutions}</span>
                      </div>
                    )}
                    {update.next_milestone && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-blue-600">🎯 Next: </span>
                        <span className="text-sm text-gray-600">{update.next_milestone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                      <span className="text-xs text-gray-500">
                        Updated {new Date(update.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {update.progress_percentage < 100 ? (
                          <PlayIcon className="w-4 h-4 text-green-500" title="In Progress" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" title="Completed" />
                    )}
                  </div>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>

            {/* Lab Notebook Entries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lab Notebook Entries</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowCreateEntryModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Entry
                  </button>
                  {notebookEntries.length > defaultItemCounts.notebook && (
                    <button
                      onClick={() => toggleSection('notebook')}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      {expandedSections.notebook ? 'Show Less' : `Show All ${notebookEntries.length}`}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {notebookEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notebook entries yet. Create your first entry!</p>
                  </div>
                ) : (
                  getDisplayItems(notebookEntries, 'notebook').map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {getTypeIcon(entry.entry_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">{entry.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                                {entry.status.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(entry.priority)}`}>
                                {entry.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{entry.content}</p>
                          {entry.objectives && (
                            <p className="text-gray-500 text-xs mb-1">
                              <span className="font-medium">Objectives:</span> {entry.objectives}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{entry.creator_name}</span>
                            <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                            <span>{entry.lab_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        {/* Right Column - Calendar & Lab Overview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Calendar Section - Compact Design */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
              <button 
                onClick={() => {
                  setQuickAddType('event');
                  setShowQuickAddModal(true);
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Event
              </button>
            </div>
            
            {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Calendar Grid - Compact */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date();
                const currentMonth = date.getMonth();
                const currentYear = date.getFullYear();
                const firstDay = new Date(currentYear, currentMonth, 1);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = cellDate.getMonth() === currentMonth;
                const isToday = cellDate.toDateString() === new Date().toDateString();
                const dayEvents = events.filter(event => {
                  const eventDate = new Date(event.date);
                  return eventDate.toDateString() === cellDate.toDateString();
                });
                
                return (
                  <div
                    key={i}
                    className={`aspect-square flex flex-col items-center justify-center text-xs rounded-lg transition-colors ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-100'}`}
                  >
                    <span className="font-medium">{cellDate.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex space-x-0.5 mt-1">
                        {dayEvents.slice(0, 2).map((_, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`w-1 h-1 rounded-full ${
                              isToday ? 'bg-white' : 'bg-blue-500'
                            }`}
                          />
                        ))}
                        {dayEvents.length > 2 && (
                          <div className={`w-1 h-1 rounded-full ${
                            isToday ? 'bg-white opacity-50' : 'bg-gray-400'
                          }`} />
                      )}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>


          {/* Recent Activity - Timeline Design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button 
                onClick={() => setRecentActivity([])}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                title="Clear activity"
              >
                Clear
              </button>
              {recentActivity.length > defaultItemCounts.activity && (
                <button
                  onClick={() => toggleSection('activity')}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  {expandedSections.activity ? 'Show Less' : `Show All ${recentActivity.length}`}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm">No recent activity to show.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getDisplayItems(recentActivity, 'activity').map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.color === 'green' ? 'bg-green-500' :
                          activity.color === 'blue' ? 'bg-blue-500' :
                          activity.color === 'purple' ? 'bg-purple-500' :
                          activity.color === 'orange' ? 'bg-orange-500' :
                          activity.color === 'red' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{activity.message}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                          <div className="flex items-center space-x-1">
                            {activity.type === 'protocol' && <BookOpenIcon className="w-3 h-3 text-green-500" />}
                            {activity.type === 'member' && <UsersIcon className="w-3 h-3 text-blue-500" />}
                            {activity.type === 'equipment' && <BeakerIcon className="w-3 h-3 text-purple-500" />}
                            {activity.type === 'experiment' && <BeakerIcon className="w-3 h-3 text-orange-500" />}
                            {activity.type === 'task' && <CheckCircleIcon className="w-3 h-3 text-indigo-500" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Add {quickAddType.charAt(0).toUpperCase() + quickAddType.slice(1)}
                </h3>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Add Type Selector */}
              <div className="flex items-center space-x-2 mb-4">
                {(['task', 'event', 'note'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setQuickAddType(type)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      quickAddType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Task Form */}
              {quickAddType === 'task' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Enter task description..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Event Form */}
              {quickAddType === 'event' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Enter event title..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="Enter event description..."
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Note Form */}
              {quickAddType === 'note' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Enter your note..."
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex items-center space-x-2">
                      {(['yellow', 'blue', 'green', 'purple'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewNoteColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            color === 'yellow' ? 'bg-yellow-400' :
                            color === 'blue' ? 'bg-blue-400' :
                            color === 'green' ? 'bg-green-400' :
                            'bg-purple-400'
                          } ${newNoteColor === color ? 'ring-2 ring-gray-500 scale-110' : 'hover:scale-105'}`}
                          title={`${color} note`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (quickAddType === 'task') addNewTask();
                    else if (quickAddType === 'event') addNewEvent();
                    else if (quickAddType === 'note') addNewNote();
                  }}
                  disabled={
                    (quickAddType === 'task' && !newTaskTitle.trim()) ||
                    (quickAddType === 'event' && (!newEventTitle.trim() || !newEventDate || !newEventTime)) ||
                    (quickAddType === 'note' && !newNoteContent.trim())
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-4 h-4 mr-1 inline" />
                  Add {quickAddType.charAt(0).toUpperCase() + quickAddType.slice(1)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Entry Modal */}
      {showCreateEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Entry</h2>
                <button
                  onClick={() => setShowCreateEntryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createNotebookEntry(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={entryForm.title}
                      onChange={(e) => setEntryForm({...entryForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter entry title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={entryForm.entry_type}
                      onChange={(e) => setEntryForm({...entryForm, entry_type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="experiment">Experiment</option>
                      <option value="observation">Observation</option>
                      <option value="protocol">Protocol</option>
                      <option value="analysis">Analysis</option>
                      <option value="idea">Idea</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={entryForm.status}
                      onChange={(e) => setEntryForm({...entryForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={entryForm.priority}
                      onChange={(e) => setEntryForm({...entryForm, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={entryForm.content}
                    onChange={(e) => setEntryForm({...entryForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe your entry..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
                  <textarea
                    value={entryForm.objectives}
                    onChange={(e) => setEntryForm({...entryForm, objectives: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What are you trying to achieve?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label>
                  <textarea
                    value={entryForm.methodology}
                    onChange={(e) => setEntryForm({...entryForm, methodology: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="How will you conduct this?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                  <textarea
                    value={entryForm.results}
                    onChange={(e) => setEntryForm({...entryForm, results: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What did you observe or measure?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
                  <textarea
                    value={entryForm.conclusions}
                    onChange={(e) => setEntryForm({...entryForm, conclusions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What can you conclude from this?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps</label>
                  <textarea
                    value={entryForm.next_steps}
                    onChange={(e) => setEntryForm({...entryForm, next_steps: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What are the next steps?"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateEntryModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!entryForm.title.trim() || !entryForm.content.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
