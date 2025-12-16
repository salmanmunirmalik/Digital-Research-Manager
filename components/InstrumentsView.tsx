import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  BookOpenIcon,
  UsersIcon
} from './icons';
import InstrumentAlertsView from './InstrumentAlertsView';

interface Instrument {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  category?: string;
  location?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order' | 'reserved';
  description?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  usage_hours?: number;
  total_bookings?: number;
}

interface InstrumentsViewProps {
  instruments: Instrument[];
  onCreateInstrument: () => void;
  onInstrumentClick?: (instrument: Instrument) => void;
  onBookInstrument?: (instrument: Instrument) => void;
  onScheduleMaintenance?: (instrument: Instrument) => void;
  onViewRoster?: (instrument: Instrument) => void;
  loading?: boolean;
}

const InstrumentsView: React.FC<InstrumentsViewProps> = ({ 
  instruments, 
  onCreateInstrument,
  onInstrumentClick,
  onBookInstrument,
  onScheduleMaintenance,
  onViewRoster,
  loading = false 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Get unique categories
  const categories = Array.from(new Set(instruments.map(i => i.category).filter(Boolean)));

  // Filter and sort instruments
  const filteredInstruments = instruments
    .filter(instrument => {
      const matchesSearch = !searchQuery || 
        instrument.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instrument.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instrument.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instrument.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || instrument.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || instrument.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'usage':
          return (b.usage_hours || 0) - (a.usage_hours || 0);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_use':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'reserved':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'out_of_order':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in_use':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      case 'reserved':
        return 'Reserved';
      case 'out_of_order':
        return 'Out of Order';
      default:
        return 'Unknown';
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Instruments</h1>
          <button
            onClick={onCreateInstrument}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Instrument
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search instruments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
            <option value="out_of_order">Out of Order</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="category">Category</option>
            <option value="usage">Usage</option>
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

      {/* Instruments Display */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Instrument Alerts */}
        <InstrumentAlertsView />

        {filteredInstruments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No instruments found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first instrument'}
            </p>
            {!searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={onCreateInstrument}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Instrument
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstruments.map((instrument) => (
              <div
                key={instrument.id}
                onClick={() => onInstrumentClick?.(instrument)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{instrument.name}</h3>
                    {instrument.model && (
                      <p className="text-xs text-gray-500 mt-1">{instrument.model}</p>
                    )}
                    {instrument.manufacturer && (
                      <p className="text-xs text-gray-500">{instrument.manufacturer}</p>
                    )}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(instrument.status)}`}>
                    {getStatusLabel(instrument.status)}
                  </span>
                </div>

                {/* Description */}
                {instrument.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{instrument.description}</p>
                )}

                {/* Metadata */}
                <div className="space-y-2 text-sm">
                  {instrument.category && (
                    <div className="text-gray-600">
                      <span className="font-medium">Category:</span> {instrument.category}
                    </div>
                  )}
                  {instrument.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="truncate">{instrument.location}</span>
                    </div>
                  )}
                  {instrument.usage_hours !== undefined && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <ClockIcon className="w-4 h-4" />
                      <span>{instrument.usage_hours} hours</span>
                    </div>
                  )}
                  {instrument.next_maintenance && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <WrenchScrewdriverIcon className="w-4 h-4" />
                      <span>Next maintenance: {formatDate(instrument.next_maintenance)}</span>
                    </div>
                  )}
                  {instrument.total_bookings !== undefined && (
                    <div className="text-gray-600">
                      <span className="font-medium">Bookings:</span> {instrument.total_bookings}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {onBookInstrument && instrument.status === 'available' && (
                    <button
                      onClick={() => onBookInstrument(instrument)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                      Book
                    </button>
                  )}
                  {onScheduleMaintenance && (
                    <button
                      onClick={() => onScheduleMaintenance(instrument)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <WrenchScrewdriverIcon className="w-4 h-4" />
                      Maintenance
                    </button>
                  )}
                  {onViewRoster && (
                    <button
                      onClick={() => onViewRoster(instrument)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <UsersIcon className="w-4 h-4" />
                      Roster
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInstruments.map((instrument) => (
              <div
                key={instrument.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0" onClick={() => onInstrumentClick?.(instrument)}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{instrument.name}</h3>
                      {instrument.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {instrument.category}
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(instrument.status)}`}>
                        {getStatusLabel(instrument.status)}
                      </span>
                    </div>
                    {instrument.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-1">{instrument.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {instrument.model && (
                        <div>
                          <span className="font-medium">Model:</span> {instrument.model}
                        </div>
                      )}
                      {instrument.manufacturer && (
                        <div>
                          <span className="font-medium">Manufacturer:</span> {instrument.manufacturer}
                        </div>
                      )}
                      {instrument.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{instrument.location}</span>
                        </div>
                      )}
                      {instrument.usage_hours !== undefined && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{instrument.usage_hours} hours</span>
                        </div>
                      )}
                      {instrument.next_maintenance && (
                        <div className="flex items-center gap-1">
                          <WrenchScrewdriverIcon className="w-4 h-4" />
                          <span>{formatDate(instrument.next_maintenance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {onBookInstrument && instrument.status === 'available' && (
                      <button
                        onClick={() => onBookInstrument(instrument)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <BookOpenIcon className="w-4 h-4" />
                        Book
                      </button>
                    )}
                    {onScheduleMaintenance && (
                      <button
                        onClick={() => onScheduleMaintenance(instrument)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <WrenchScrewdriverIcon className="w-4 h-4" />
                        Maintenance
                      </button>
                    )}
                    {onViewRoster && (
                      <button
                        onClick={() => onViewRoster(instrument)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <UsersIcon className="w-4 h-4" />
                        Roster
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstrumentsView;

