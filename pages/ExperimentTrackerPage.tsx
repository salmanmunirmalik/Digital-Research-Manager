import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ExperimentForm from '../components/ExperimentForm';
import ExperimentDetailView from '../components/ExperimentDetailView';
import { experimentService, Experiment, ExperimentTemplate, CreateExperimentData, UpdateExperimentData, ExperimentAnalytics } from '../services/experimentService';
import {
  BeakerIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightbulbIcon,
  ChartBarIcon,
  UserIcon,
  TagIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  TargetIcon,
  ClipboardListIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  ShareIcon,
  DownloadIcon,
  PrinterIcon,
  SparklesIcon,
  BrainIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UsersIcon,
  GlobeAltIcon,
  FireIcon,

  XMarkIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  TrendingUpIcon
} from '../components/icons';

const ExperimentTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [templates, setTemplates] = useState<ExperimentTemplate[]>([]);
  const [analytics, setAnalytics] = useState<ExperimentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'experiments' | 'templates' | 'analytics'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [showNewExperimentModal, setShowNewExperimentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditExperimentModal, setShowEditExperimentModal] = useState(false);
  const [showExperimentDetailModal, setShowExperimentDetailModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ExperimentTemplate | null>(null);

  // Load initial data
  useEffect(() => {
    loadExperiments();
    loadTemplates();
    loadAnalytics();
  }, []);

  const loadExperiments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await experimentService.getExperiments({
        status: filterStatus,
        category: filterCategory,
        priority: filterPriority,
        search: searchTerm
      });
      setExperiments(data);
    } catch (error) {
      console.error('Error loading experiments:', error);
      setError('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await experimentService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await experimentService.getAnalytics(30);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreateExperiment = async (data: CreateExperimentData) => {
    try {
      const newExperiment = await experimentService.createExperiment(data);
      setExperiments(prev => [newExperiment, ...prev]);
      setShowNewExperimentModal(false);
      await loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error creating experiment:', error);
      setError('Failed to create experiment');
    }
  };

  const handleUpdateExperiment = async (data: UpdateExperimentData) => {
    if (!selectedExperiment) return;
    
    try {
      const updatedExperiment = await experimentService.updateExperiment(selectedExperiment.id, data);
      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));
      setShowEditExperimentModal(false);
      setSelectedExperiment(null);
      await loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error updating experiment:', error);
      setError('Failed to update experiment');
    }
  };

  const handleDeleteExperiment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;
    
    try {
      await experimentService.deleteExperiment(id);
      setExperiments(prev => prev.filter(exp => exp.id !== id));
      await loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error deleting experiment:', error);
      setError('Failed to delete experiment');
    }
  };

  const handleStartExperiment = async (id: string) => {
    try {
      const updatedExperiment = await experimentService.startExperiment(id);
      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));
      await loadAnalytics();
    } catch (error) {
      console.error('Error starting experiment:', error);
      setError('Failed to start experiment');
    }
  };

  const handlePauseExperiment = async (id: string) => {
    try {
      const updatedExperiment = await experimentService.pauseExperiment(id);
      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));
      await loadAnalytics();
    } catch (error) {
      console.error('Error pausing experiment:', error);
      setError('Failed to pause experiment');
    }
  };

  const handleCompleteExperiment = async (id: string) => {
    const results = prompt('Enter experiment results:');
    if (results === null) return;
    
    try {
      const updatedExperiment = await experimentService.completeExperiment(id, { results });
      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));
      await loadAnalytics();
    } catch (error) {
      console.error('Error completing experiment:', error);
      setError('Failed to complete experiment');
    }
  };

  const handleViewExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setShowExperimentDetailModal(true);
  };

  const handleEditExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setShowEditExperimentModal(true);
  };

  const handleUseTemplate = (template: ExperimentTemplate) => {
    setSelectedTemplate(template);
    setShowNewExperimentModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || exp.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || exp.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const sortedExperiments = [...filteredExperiments].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'status':
        return a.status.localeCompare(b.status);
      case 'due_date':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'created_at':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BeakerIcon className="h-8 w-8 text-blue-600" />
                Experiment Planner & Tracker
              </h1>
              <p className="text-gray-600 mt-2">Plan, track, and manage your research experiments</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowTemplateModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                onClick={() => setShowNewExperimentModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Experiment
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
              { id: 'experiments', name: 'Experiments', icon: BeakerIcon },
              { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
              { id: 'analytics', name: 'Analytics', icon: TrendingUpIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeView === tab.id
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

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BeakerIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Experiments</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.totalExperiments || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <PlayIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Running</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.runningExperiments || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Completed</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.completedExperiments || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Overdue</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.overdueExperiments || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Experiments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedExperiments.length === 0 ? (
                  <div className="text-center py-12">
                    <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No experiments yet</h3>
                    <p className="text-gray-600 mb-4">Start by creating your first experiment or using a template</p>
                    <Button onClick={() => setShowNewExperimentModal(true)}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Experiment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedExperiments.slice(0, 5).map((experiment) => (
                      <div key={experiment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{experiment.title}</h3>
                          <p className="text-gray-600 text-sm">{experiment.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                              {experiment.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(experiment.priority)}`}>
                              {experiment.priority}
                            </span>
                            {experiment.progressPercentage > 0 && (
                              <span className="text-xs text-gray-500">
                                {experiment.progressPercentage}% complete
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewExperiment(experiment)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditExperiment(experiment)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Experiments View */}
        {activeView === 'experiments' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search experiments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="planning">Planning</option>
                      <option value="ready">Ready</option>
                      <option value="running">Running</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </Select>
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="molecular_biology">Molecular Biology</option>
                      <option value="cell_biology">Cell Biology</option>
                      <option value="biochemistry">Biochemistry</option>
                      <option value="microbiology">Microbiology</option>
                      <option value="genetics">Genetics</option>
                      <option value="immunology">Immunology</option>
                      <option value="neuroscience">Neuroscience</option>
                    </Select>
                    <Select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </Select>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="created_at">Sort by Date</option>
                      <option value="priority">Sort by Priority</option>
                      <option value="status">Sort by Status</option>
                      <option value="title">Sort by Title</option>
                      <option value="due_date">Sort by Due Date</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experiments List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading experiments...</p>
                </div>
              ) : sortedExperiments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No experiments found</h3>
                      <p className="text-gray-600 mb-4">Create your first experiment or adjust your search criteria</p>
                      <Button onClick={() => setShowNewExperimentModal(true)}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Experiment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                sortedExperiments.map((experiment) => (
                  <Card key={experiment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{experiment.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                              {experiment.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(experiment.priority)}`}>
                              {experiment.priority}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{experiment.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {experiment.estimatedDuration}h estimated
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {experiment.dueDate ? new Date(experiment.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                            <span className="flex items-center">
                              <UserIcon className="w-4 h-4 mr-1" />
                              {experiment.researcherName}
                            </span>
                            {experiment.progressPercentage > 0 && (
                              <span className="flex items-center">
                                <ChartBarIcon className="w-4 h-4 mr-1" />
                                {experiment.progressPercentage}% complete
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {experiment.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewExperiment(experiment)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditExperiment(experiment)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          {experiment.status === 'planning' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStartExperiment(experiment.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {experiment.status === 'running' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePauseExperiment(experiment.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <PauseIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {experiment.status === 'running' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCompleteExperiment(experiment.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteExperiment(experiment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Templates View */}
        {activeView === 'templates' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <DocumentTextIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {template.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.estimatedDuration}h
                        </span>
                      </div>
                      <Button 
                        onClick={() => handleUseTemplate(template)}
                        className="w-full"
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUpIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Success Rate</h3>
                      <p className="text-3xl font-bold text-green-600">
                        {analytics.totalExperiments > 0 
                          ? Math.round((analytics.completedExperiments / analytics.totalExperiments) * 100)
                          : 0}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Duration</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {Math.round(analytics.avgDuration || 0)}h
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ChartBarIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Cost</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        ${Math.round(analytics.avgCost || 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <TrendingUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                    <p className="text-gray-600 mb-4">Track your experiment performance and productivity</p>
                    <p className="text-sm text-gray-500">Analytics will appear once you have experiment data</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modals */}
        {showNewExperimentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ExperimentForm
                initialData={selectedTemplate ? {
                  category: selectedTemplate.category as any,
                  methodology: selectedTemplate.methodology,
                  estimatedDuration: selectedTemplate.estimatedDuration,
                  equipment: selectedTemplate.equipment,
                  materials: selectedTemplate.materials,
                  reagents: selectedTemplate.reagents,
                  safetyRequirements: selectedTemplate.safetyRequirements,
                  milestones: selectedTemplate.milestones
                } : undefined}
                templates={templates}
                onSubmit={handleCreateExperiment}
                onCancel={() => {
                  setShowNewExperimentModal(false);
                  setSelectedTemplate(null);
                }}
                isLoading={loading}
              />
            </div>
          </div>
        )}

        {showEditExperimentModal && selectedExperiment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ExperimentForm
                initialData={{
                  title: selectedExperiment.title,
                  description: selectedExperiment.description,
                  hypothesis: selectedExperiment.hypothesis,
                  objectives: selectedExperiment.objectives,
                  methodology: selectedExperiment.methodology,
                  expectedOutcomes: selectedExperiment.expectedOutcomes,
                  priority: selectedExperiment.priority,
                  category: selectedExperiment.category,
                  estimatedDuration: selectedExperiment.estimatedDuration,
                  dueDate: selectedExperiment.dueDate,
                  labId: selectedExperiment.labId,
                  collaborators: selectedExperiment.collaborators,
                  equipment: selectedExperiment.equipment,
                  materials: selectedExperiment.materials,
                  reagents: selectedExperiment.reagents,
                  safetyRequirements: selectedExperiment.safetyRequirements,
                  budget: selectedExperiment.budget,
                  tags: selectedExperiment.tags,
                  notes: selectedExperiment.notes,
                  milestones: selectedExperiment.milestones.map(m => ({
                    title: m.title,
                    description: m.description,
                    dueDate: m.dueDate
                  })),
                  risks: selectedExperiment.risks.map(r => ({
                    title: r.title,
                    description: r.description,
                    probability: r.probability,
                    impact: r.impact,
                    mitigation: r.mitigation
                  }))
                }}
                templates={templates}
                onSubmit={handleUpdateExperiment}
                onCancel={() => {
                  setShowEditExperimentModal(false);
                  setSelectedExperiment(null);
                }}
                isLoading={loading}
              />
            </div>
          </div>
        )}

        {/* Experiment Detail Modal */}
        {showExperimentDetailModal && selectedExperiment && (
          <ExperimentDetailView
            experiment={selectedExperiment}
            onClose={() => {
              setShowExperimentDetailModal(false);
              setSelectedExperiment(null);
            }}
            onEdit={(experiment) => {
              setShowExperimentDetailModal(false);
              setSelectedExperiment(experiment);
              setShowEditExperimentModal(true);
            }}
            onDelete={handleDeleteExperiment}
            onStatusChange={(id, status) => {
              // Handle status change
              console.log('Status change:', id, status);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ExperimentTrackerPage;