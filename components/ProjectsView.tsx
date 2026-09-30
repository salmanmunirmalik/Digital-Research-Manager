import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  FolderIcon,
  DocumentArrowUpIcon,
  TrashIcon,
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
  onImportProject?: () => void;
  onProjectClick?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  loading?: boolean;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onCreateProject,
  onImportProject,
  onProjectClick,
  onDeleteProject,
  loading = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const statuses = Array.from(new Set(projects.map((p) => p.status).filter(Boolean)));

  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch =
        !searchQuery ||
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
          return (
            new Date(b.planned_start_date || 0).getTime() -
            new Date(a.planned_start_date || 0).getTime()
          );
      }
    });

  const getStatusColor = (status: string): string => {
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('ongoing')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (s.includes('planning') || s.includes('pending')) return 'bg-amber-50 text-amber-800 border-amber-100';
    if (s.includes('completed') || s.includes('done')) return 'bg-sky-50 text-sky-800 border-sky-100';
    if (s.includes('on hold') || s.includes('paused')) return 'bg-orange-50 text-orange-800 border-orange-100';
    if (s.includes('cancelled')) return 'bg-rose-50 text-rose-800 border-rose-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-transparent">
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 max-w-6xl">
          <div className="relative flex-1 min-w-[12rem] max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white text-slate-700"
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md text-[12px] bg-white text-slate-700"
          >
            <option value="recent">Most recent</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="progress">Progress</option>
          </select>
          <span className="text-[12px] text-slate-500 tabular-nums">
            {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
          </span>
          <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[18rem] text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/60 flex items-center justify-center mb-4">
              <FolderIcon className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
              {searchQuery || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-[13px] text-slate-500 max-w-sm mb-5">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting search or status filters.'
                : 'Create a project or import from a proposal document to organize funded work.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <div className="flex items-center gap-2">
                {onImportProject && (
                  <button
                    type="button"
                    onClick={onImportProject}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-sky-900 bg-white border border-sky-200 rounded-md hover:bg-sky-50"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    Import
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCreateProject}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
                >
                  <PlusIcon className="w-4 h-4" />
                  New project
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <ul className="max-w-5xl mx-auto bg-white border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
            {filteredProjects.map((project) => (
              <li key={project.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onProjectClick?.(project)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onProjectClick?.(project);
                    }
                  }}
                  className="px-4 py-3.5 flex items-center gap-4 hover:bg-sky-50/40 cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {project.project_code && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                          {project.project_code}
                        </span>
                      )}
                      <h3 className="text-[14px] font-medium text-slate-900 group-hover:text-sky-900 truncate">
                        {project.project_title}
                      </h3>
                      {project.status && (
                        <span
                          className={`inline-flex px-1.5 py-0.5 text-[11px] font-medium rounded border ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      )}
                    </div>
                    {project.project_description && (
                      <p className="text-[12px] text-slate-500 line-clamp-1 mb-1.5">
                        {project.project_description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                      {project.pi_name && (
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" />
                          {project.pi_name}
                        </span>
                      )}
                      {project.planned_start_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {formatDate(project.planned_start_date)}
                          {project.planned_end_date ? ` – ${formatDate(project.planned_end_date)}` : ''}
                        </span>
                      )}
                      {project.total_budget ? (
                        <span className="inline-flex items-center gap-1">
                          <CurrencyDollarIcon className="w-3.5 h-3.5" />
                          {formatCurrency(project.total_budget)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-1.5 w-28 shrink-0">
                    {typeof project.overall_progress_percentage === 'number' && (
                      <>
                        <span className="text-[11px] tabular-nums text-slate-500">
                          {project.overall_progress_percentage}%
                        </span>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div
                            className="bg-sky-600 h-1 rounded-full"
                            style={{ width: `${project.overall_progress_percentage}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {onDeleteProject && (
                    <button
                      type="button"
                      title="Delete project"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project);
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-w-6xl mx-auto">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => onProjectClick?.(project)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onProjectClick?.(project);
                  }
                }}
                className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-sky-200 hover:shadow-sm hover:shadow-sky-100/40 cursor-pointer transition-all group text-left"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    {project.project_code && (
                      <p className="text-[11px] font-mono text-slate-400 mb-0.5">
                        {project.project_code}
                      </p>
                    )}
                    <h3 className="text-[14px] font-medium text-slate-900 group-hover:text-sky-900 line-clamp-2">
                      {project.project_title}
                    </h3>
                  </div>
                  {project.status && (
                    <span
                      className={`shrink-0 inline-flex px-1.5 py-0.5 text-[11px] font-medium rounded border ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  )}
                </div>
                {project.project_description && (
                  <p className="text-[12px] text-slate-500 line-clamp-2 mb-3">
                    {project.project_description}
                  </p>
                )}
                {typeof project.overall_progress_percentage === 'number' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">Progress</span>
                      <span className="text-[11px] tabular-nums text-slate-500">
                        {project.overall_progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div
                        className="bg-sky-600 h-1 rounded-full"
                        style={{ width: `${project.overall_progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 text-[12px] text-slate-500">
                  {project.pi_name && (
                    <div className="flex items-center gap-1.5 truncate">
                      <UserIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{project.pi_name}</span>
                    </div>
                  )}
                  {project.planned_start_date && (
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(project.planned_start_date)}
                    </div>
                  )}
                  {project.total_budget ? (
                    <div className="flex items-center gap-1.5">
                      <CurrencyDollarIcon className="w-3.5 h-3.5 shrink-0" />
                      {formatCurrency(project.total_budget)}
                    </div>
                  ) : null}
                </div>
                {onDeleteProject && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      title="Delete project"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project);
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
