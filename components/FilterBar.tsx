import React, { useState } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon,
  MagnifyingGlassIcon
} from './icons';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export interface FilterConfig {
  status?: string[];
  priority?: string[];
  assignee_id?: string[];
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
}

interface FilterBarProps {
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  assignees?: Array<{ id: string; name: string; avatar_url?: string }>;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange, assignees = [] }) => {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterConfig, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof FilterConfig) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof FilterConfig];
    return value !== undefined && value !== null && value !== '' && 
           (!Array.isArray(value) || value.length > 0);
  }).length;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {['to_do', 'in_progress', 'in_review', 'done'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      const current = filters.status || [];
                      const newStatus = current.includes(status)
                        ? current.filter(s => s !== status)
                        : [...current, status];
                      updateFilter('status', newStatus.length > 0 ? newStatus : undefined);
                    }}
                    className={`${
                      filters.status?.includes(status)
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-300'
                    } border rounded px-2 py-1`}
                  >
                    <StatusBadge status={status as any} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex flex-wrap gap-2">
                {['low', 'normal', 'high', 'urgent'].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => {
                      const current = filters.priority || [];
                      const newPriority = current.includes(priority)
                        ? current.filter(p => p !== priority)
                        : [...current, priority];
                      updateFilter('priority', newPriority.length > 0 ? newPriority : undefined);
                    }}
                    className={`${
                      filters.priority?.includes(priority)
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-300'
                    } border rounded px-2 py-1`}
                  >
                    <PriorityBadge priority={priority as any} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            {assignees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                <select
                  multiple
                  value={filters.assignee_id || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    updateFilter('assignee_id', selected.length > 0 ? selected : undefined);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  size={4}
                >
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.status && filters.status.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Status: {filters.status.join(', ')}
                      <button onClick={() => clearFilter('status')}>
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.priority && filters.priority.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Priority: {filters.priority.join(', ')}
                      <button onClick={() => clearFilter('priority')}>
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.assignee_id && filters.assignee_id.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Assignee: {filters.assignee_id.length} selected
                      <button onClick={() => clearFilter('assignee_id')}>
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;


