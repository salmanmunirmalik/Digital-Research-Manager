import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ChartBarIcon
} from './icons';

interface Project {
  id: string;
  project_code?: string;
  project_title: string;
  project_description?: string;
  status: string;
  overall_progress_percentage?: number;
  total_budget?: number;
  budget_spent?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  pi_name?: string;
  principal_investigator_id?: string;
  project_type?: string;
  research_field?: string;
}

interface ProjectsViewProps {
  projects: Project[];
  onCreateProject: () => void;
  onProjectClick?: (project: Project) => void;
  loading?: boolean;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  projects, 
  onCreateProject,
  onProjectClick,
  loading = false 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Get unique statuses for filter
  const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean)));

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = !searchQuery || 
        project.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_code?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.project_title.localeCompare(b.project_title);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'progress':
          return (b.overall_progress_percentage || 0) - (a.overall_progress_percentage || 0);
        case 'recent':
        default:
          return new Date(b.planned_start_date || 0).getTime() - new Date(a.planned_start_date || 0).getTime();
      }
    });

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('ongoing')) {
      return 'bg-green-100 text-green-700 border-green-300';
    } else if (statusLower.includes('planning') || statusLower.includes('pending')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    } else if (statusLower.includes('completed') || statusLower.includes('done')) {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    } else if (statusLower.includes('on hold') || statusLower.includes('paused')) {
      return 'bg-orange-100 text-orange-700 border-orange-300';
    } else if (statusLower.includes('cancelled')) {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="progress">Progress</option>
          </select>

          {/* View Toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first project'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={onCreateProject}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectClick?.(project)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {project.project_code && (
                      <p className="text-xs font-mono text-gray-500 mb-1">{project.project_code}</p>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{project.project_title}</h3>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Description */}
                {project.project_description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.project_description}</p>
                )}

                {/* Progress Bar */}
                {project.overall_progress_percentage !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Progress</span>
                      <span className="text-xs text-gray-500">{project.overall_progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.overall_progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-2 text-sm">
                  {project.pi_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="w-4 h-4" />
                      <span className="truncate">{project.pi_name}</span>
                    </div>
                  )}
                  {project.planned_start_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(project.planned_start_date)}</span>
                    </div>
                  )}
                  {project.total_budget && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      <span>{formatCurrency(project.total_budget)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectClick?.(project)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {project.project_code && (
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {project.project_code}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{project.project_title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    {project.project_description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-1">{project.project_description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {project.pi_name && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{project.pi_name}</span>
                        </div>
                      )}
                      {project.planned_start_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(project.planned_start_date)}</span>
                        </div>
                      )}
                      {project.total_budget && (
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          <span>{formatCurrency(project.total_budget)}</span>
                        </div>
                      )}
                      {project.overall_progress_percentage !== undefined && (
                        <div className="flex items-center gap-2">
                          <ChartBarIcon className="w-4 h-4" />
                          <span>{project.overall_progress_percentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {project.overall_progress_percentage !== undefined && (
                    <div className="ml-4 w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.overall_progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;


