import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  PauseIcon
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
  }, []);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-section">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="btn-primary">
              <PlusIcon className="w-4 h-4 inline mr-2" />
              Quick Add
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="page-grid">
        <div className="page-section">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Protocols</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_protocols}</p>
            </div>
          </div>
        </div>
        
        <div className="page-section">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Experiments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_experiments}</p>
            </div>
          </div>
        </div>
        
        <div className="page-section">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</p>
            </div>
          </div>
        </div>
        
        <div className="page-section">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcoming_events}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Dashboard'}
          </button>
          <button
            onClick={() => setShowQuickAddModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Sticky Notes & Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sticky Notes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sticky Notes</h2>
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
                stickyNotes
                  .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                  .slice(0, 4)
                  .map((note) => (
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

          {/* Tasks Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
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
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
              </div>
            </div>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tasks yet. Create your first task!</p>
                </div>
              ) : (
                tasks.map((task) => (
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
                ))
              )}
            </div>
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
        </div>

        {/* Right Column - Calendar & Events */}
        <div className="space-y-8">
          {/* Calendar Section - Larger Size */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Personal Calendar</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    setQuickAddType('event');
                    setShowQuickAddModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Event
                </button>
              </div>
            </div>
            
            {/* Calendar Grid - Larger Cells */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
                const lastDay = new Date(currentYear, currentMonth + 1, 0);
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
                    className={`min-h-[100px] p-2 border border-gray-100 text-sm ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-right mb-2 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'font-bold text-blue-600' : ''}`}>
                      {cellDate.getDate()}
                    </div>
                    
                    {/* Event indicators */}
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="text-xs p-1 mb-1 bg-blue-100 text-blue-800 rounded truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <button 
                onClick={() => {
                  setQuickAddType('event');
                  setShowQuickAddModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Event
              </button>
            </div>
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : (
                events.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="Edit event">
                        <EditIcon className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => setEvents(prev => prev.filter(e => e.id !== event.id))}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors" 
                        title="Delete event"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lab Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Lab Members</span>
                <span className="font-semibold text-gray-900">{stats.lab_members}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-semibold text-gray-900">{stats.active_projects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Week's Tasks</span>
                <span className="font-semibold text-gray-900">{stats.pending_tasks}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button 
                onClick={() => setRecentActivity([])}
                className="text-gray-400 hover:text-gray-600 text-sm"
                title="Clear activity"
              >
                Clear
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">📊</span>
                  </div>
                  <p>No recent activity to show.</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full bg-${activity.color}-500 flex-shrink-0`}></div>
                    <div className="flex-1">
                      <span className="text-gray-700">{activity.message}</span>
                      <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {activity.type === 'protocol' && <BookOpenIcon className="w-3 h-3 text-green-500" />}
                      {activity.type === 'member' && <UsersIcon className="w-3 h-3 text-blue-500" />}
                      {activity.type === 'equipment' && <BeakerIcon className="w-3 h-3 text-purple-500" />}
                      {activity.type === 'experiment' && <BeakerIcon className="w-3 h-3 text-orange-500" />}
                      {activity.type === 'task' && <CheckCircleIcon className="w-3 h-3 text-indigo-500" />}
                    </div>
                  </div>
                ))
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
    </div>
  );
};

export default DashboardPage;
