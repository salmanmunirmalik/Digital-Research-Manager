import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import DataResultForm, { DataResultFormValues } from '../components/DataResultForm';
import DocumentImportModal from '../components/DocumentImportModal';
import LinkedEntityChips, { buildWorkflowLinks } from '../components/LinkedEntityChips';
import { useEntityDeepLink } from '../hooks/useEntityDeepLink';
import { smartParseDataResultText } from '../utils/dataResultImport';
import { 
  SearchIcon, 
  BarChartIcon, 
  PlusIcon,
  TableIcon,
  ChartBarIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  DatabaseIcon,
  FilesIcon,
  ImageIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  FilterIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  ArrowRightIcon,
  LightbulbIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  ShareIcon,
  DocumentTextIcon,
  BeakerIcon,
  AcademicCapIcon,
  TrendingUpIcon,
  DocumentArrowUpIcon,
} from '../components/icons';

// Enhanced data structure for real research needs
interface ResearchDataEntry {
  id: string;
  title: string;
  type: 'experiment' | 'analysis' | 'image' | 'document' | 'protocol' | 'code';
  category: 'molecular_biology' | 'cell_biology' | 'biochemistry' | 'microbiology' | 'bioinformatics' | 'other';
  date: Date;
  status: 'draft' | 'published' | 'archived' | 'under_review';
  tags: string[];
  summary: string;
  description?: string;
  author: string;
  lab: string;
  protocolId?: string | null;
  experimentId?: string | null;
  notebookEntryId?: string | null;
  
  // File information
  files: {
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }[];
  
  // Metadata
  metadata: {
    experimentDate?: Date;
    sampleCount?: number;
    replicates?: number;
    conditions?: string[];
    instruments?: string[];
    reagents?: string[];
    notes?: string;
  };
  
  // Analysis specific
  analysis?: {
    method: string;
    software: string;
    parameters: Record<string, any>;
    results: string;
  };
  
  // Protocol authoring lives in Protocol library; keep optional nested fields for legacy entries only
  protocol?: {
    steps: string[];
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    equipment: string[];
  };
}

const DataResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Enhanced state management
  const [dataEntries, setDataEntries] = useState<ResearchDataEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ResearchDataEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addFormInitial, setAddFormInitial] = useState<Partial<DataResultFormValues> | undefined>();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const openHighlightedResult = useCallback((entry: ResearchDataEntry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  }, []);
  const { focusedId } = useEntityDeepLink(dataEntries, openHighlightedResult);

  // Fetch data from API
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        setDataEntries([]);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const rows = data.results || data || [];
        setDataEntries(rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          category: r.category,
          date: new Date(r.created_at || r.date || Date.now()),
          status: r.status || 'draft',
          tags: Array.isArray(r.tags) ? r.tags : [],
          summary: r.summary || '',
          description: r.description || '',
          author: r.username || r.author || '',
          lab: r.lab_name || r.lab || '',
          protocolId: r.protocolId || r.protocol_id || null,
          experimentId: r.experimentId || r.experiment_id || null,
          notebookEntryId: r.notebookEntryId || r.notebook_entry_id || null,
          files: Array.isArray(r.files) ? r.files : [],
          metadata: r.metadata || {},
        })));
      } else {
        console.log('API request failed');
        setDataEntries([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setDataEntries([]);
    }
  };

  // Load mock data
  const loadMockData = () => {
    setDataEntries([]);
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Create new data entry
  const createDataEntry = async (entryData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: entryData.title,
          type: entryData.type,
          category: entryData.category,
          summary: entryData.summary,
          description: entryData.description,
          methodology: entryData.methodology,
          results: entryData.results,
          conclusions: entryData.conclusions,
          tags: entryData.tags || [],
          privacy_level: entryData.privacy_level || 'lab',
          lab_id: entryData.lab_id,
          protocolId: entryData.protocolId || null,
          experimentId: entryData.experimentId || null,
          notebookEntryId: entryData.notebookEntryId || null,
          files: entryData.files || {},
          metadata: entryData.metadata || {}
        })
      });

      if (response.ok) {
        const r = await response.json();
        const newEntry: ResearchDataEntry = {
          id: r.id,
          title: r.title,
          type: r.type,
          category: r.category,
          date: new Date(r.created_at || r.date || Date.now()),
          status: r.status || 'draft',
          tags: Array.isArray(r.tags) ? r.tags : [],
          summary: r.summary || '',
          description: r.description || '',
          author: r.username || r.author || user?.username || '',
          lab: r.lab_name || r.lab || '',
          protocolId: r.protocolId || r.protocol_id || entryData.protocolId || null,
          experimentId: r.experimentId || r.experiment_id || entryData.experimentId || null,
          notebookEntryId: r.notebookEntryId || r.notebook_entry_id || entryData.notebookEntryId || null,
          files: Array.isArray(r.files) ? r.files : [],
          metadata: r.metadata || {},
        };
        setDataEntries(prev => [newEntry, ...prev]);
        setShowAddModal(false);
      } else {
        console.error('Failed to create data entry');
      }
    } catch (error) {
      console.error('Error creating data entry:', error);
    }
  };

  // Update data entry
  const updateDataEntry = async (id: string, entryData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: entryData.title,
          type: entryData.type,
          category: entryData.category,
          summary: entryData.summary,
          description: entryData.description,
          methodology: entryData.methodology,
          results: entryData.results,
          conclusions: entryData.conclusions,
          tags: entryData.tags || [],
          privacy_level: entryData.privacy_level || 'lab',
          protocolId: entryData.protocolId || null,
          experimentId: entryData.experimentId || null,
          notebookEntryId: entryData.notebookEntryId || null,
          files: entryData.files || {},
          metadata: entryData.metadata || {}
        })
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        const r = updatedEntry.result || updatedEntry;
        const normalized: ResearchDataEntry = {
          id: r.id,
          title: r.title,
          type: r.type,
          category: r.category,
          date: new Date(r.created_at || r.date || Date.now()),
          status: r.status || 'draft',
          tags: Array.isArray(r.tags) ? r.tags : [],
          summary: r.summary || '',
          description: r.description || '',
          author: r.username || r.author || '',
          lab: r.lab_name || r.lab || '',
          protocolId: r.protocolId || r.protocol_id || entryData.protocolId || null,
          experimentId: r.experimentId || r.experiment_id || entryData.experimentId || null,
          notebookEntryId: r.notebookEntryId || r.notebook_entry_id || entryData.notebookEntryId || null,
          files: Array.isArray(r.files) ? r.files : [],
          metadata: r.metadata || {},
        };
        setDataEntries(prev => prev.map(entry => entry.id === id ? normalized : entry));
      } else {
        console.error('Failed to update data entry');
      }
    } catch (error) {
      console.error('Error updating data entry:', error);
    }
  };

  // Delete data entry
  const deleteDataEntry = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDataEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        console.error('Failed to delete data entry');
        // Fallback to local state if API fails
        setDataEntries(prev => prev.filter(entry => entry.id !== id));
      }
    } catch (error) {
      console.error('Error deleting data entry:', error);
      // Fallback to local state if API fails
      setDataEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Filtered and sorted data
  const filteredData = dataEntries
    .filter(entry => {
      const matchesType = filterType === 'all' || entry.type === filterType;
      const matchesSearch = searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Data Entry Card Component
  const DataEntryCard = ({ entry }: { entry: ResearchDataEntry }) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'experiment': return <BarChartIcon className="w-5 h-5" />;
        case 'analysis': return <ChartBarIcon className="w-5 h-5" />;
        case 'image': return <ImageIcon className="w-5 h-5" />;
        case 'document': return <FilesIcon className="w-5 h-5" />;
        default: return <DatabaseIcon className="w-5 h-5" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'published': return 'bg-green-100 text-green-800';
        case 'draft': return 'bg-yellow-100 text-yellow-800';
        case 'archived': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div
        className="cursor-pointer"
        data-entity-id={entry.id}
        onClick={() => setSelectedEntry(entry)}
      >
        <Card
          className={`border rounded-xl shadow-none transition-colors ${
            focusedId === entry.id
              ? 'border-emerald-400 ring-2 ring-emerald-200'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-slate-500">
                {getTypeIcon(entry.type)}
              </div>
              <h3 className="font-semibold text-gray-900 truncate">{entry.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(entry.status)}`}>
                {entry.status}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete "${entry.title}"?`)) {
                    deleteDataEntry(entry.id);
                  }
                }}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete entry"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{entry.summary}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              <span>{entry.date ? new Date(entry.date).toLocaleDateString() : 'No date'}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              <span>{entry.author || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {(entry.tags || []).slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {(entry.tags || []).length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{(entry.tags || []).length - 3}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  };

  // Main Content
  return (
    <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">My data & results</h1>
              <p className="mt-1.5 text-[14px] text-slate-600">
                Store your lab files, figures, and analysis artifacts.{' '}
                <Link to="/research-databank" className="font-medium text-slate-800 hover:text-slate-950 underline-offset-2 hover:underline">
                  Share datasets ethically in Data bank
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2 self-start flex-wrap">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                <DocumentArrowUpIcon className="w-4 h-4" />
                Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddFormInitial(undefined);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add data
              </button>
            </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
          <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
                  placeholder="Search data entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>
        </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              >
                <option value="all">All Types</option>
                <option value="experiment">Experiment outputs</option>
                <option value="analysis">Analysis</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="code">Code</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
                className="px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="type">Sort by Type</option>
              </select>

            <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
              >
                {sortOrder === 'asc' ? <SortAscendingIcon className="w-4 h-4" /> : <SortDescendingIcon className="w-4 h-4" />}
            </button>

            <button
                type="button"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
              >
                {viewMode === 'grid' ? <TableIcon className="w-4 h-4" /> : <BarChartIcon className="w-4 h-4" />}
            </button>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredData.map((entry) => (
            <DataEntryCard key={entry.id} entry={entry} />
          ))}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200/80 rounded-xl">
            <DatabaseIcon className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No data found</h3>
            <p className="text-[13px] text-slate-500 mb-5">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first data entry'}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                <DocumentArrowUpIcon className="w-4 h-4" />
                Import Word / paste
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddFormInitial(undefined);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add data
              </button>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <DocumentImportModal
            title="Import data / results"
            subtitle="Upload a Word report or paste notes — we’ll map summary, methods, results, and conclusions."
            parseText={smartParseDataResultText}
            onCancel={() => setShowImportModal(false)}
            onParsed={(result) => {
              setShowImportModal(false);
              setAddFormInitial(result.payload);
              setShowAddModal(true);
            }}
          />
        )}

        {/* Add Modal */}
        {showAddModal && (
          <DataResultForm
            key={addFormInitial?.title || 'blank-data'}
            mode="create"
            initialData={addFormInitial}
            isSubmitting={isUploading}
            onCancel={() => {
              setShowAddModal(false);
              setAddFormInitial(undefined);
              setUploadedFiles([]);
            }}
            onSubmit={async (form) => {
              setIsUploading(true);
              try {
                await createDataEntry({
                  title: form.title,
                  type: form.type,
                  category: form.category,
                  summary: form.summary,
                  description: form.description,
                  methodology: form.methodology,
                  results: form.results,
                  conclusions: form.conclusions,
                  tags: form.tags,
                  privacy_level: form.privacy_level,
                  protocolId: form.protocolId || null,
                  experimentId: form.experimentId || null,
                  notebookEntryId: form.notebookEntryId || null,
                  files: form.fileNames.map((name) => ({ name, type: '', size: 0, url: '', uploadedAt: new Date() })),
                  metadata: form.metadata,
                });
                setUploadedFiles([]);
                setAddFormInitial(undefined);
              } finally {
                setIsUploading(false);
              }
            }}
          />
        )}

        {/* Selected Entry Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEntry.title}</h3>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString() : 'No date'}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {selectedEntry.author || 'Unknown'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedEntry.status === 'published' ? 'bg-green-100 text-green-800' :
                      selectedEntry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEntry.status}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-600">{selectedEntry.summary}</p>
                  </div>

                  <LinkedEntityChips
                    links={buildWorkflowLinks({
                      protocolId: selectedEntry.protocolId,
                      experimentId: selectedEntry.experimentId,
                      notebookEntryId: selectedEntry.notebookEntryId,
                    })}
                  />
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedEntry.tags || []).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        // Open edit modal
                        setShowEditModal(true);
                        console.log('Edit clicked for entry:', selectedEntry?.id);
                      }}
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        console.log('Download clicked for entry:', selectedEntry?.id);
                        if (selectedEntry?.files && selectedEntry.files.length > 0) {
                          // Create download links for each file
                          selectedEntry.files.forEach((file: any) => {
                            const link = document.createElement('a');
                            link.href = file.url || '#';
                            link.download = file.name || 'download';
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          });
                        } else {
                          alert('No files available for download');
                        }
                      }}
                    >
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => {
                        // Open detailed view modal
                        setShowViewModal(true);
                        console.log('View Details clicked for entry:', selectedEntry?.id);
                      }}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedEntry && (
          <DataResultForm
            mode="edit"
            isSubmitting={isUploading}
            initialData={{
              title: selectedEntry.title,
              type: (selectedEntry.type === 'protocol' ? 'document' : selectedEntry.type) as DataResultFormValues['type'],
              category: selectedEntry.category,
              summary: selectedEntry.summary,
              description: selectedEntry.description || '',
              methodology: (selectedEntry as any).methodology || '',
              results: selectedEntry.analysis?.results || (selectedEntry as any).results || '',
              conclusions: (selectedEntry as any).conclusions || '',
              tags: selectedEntry.tags || [],
              privacy_level: 'lab',
              protocolId: selectedEntry.protocolId || '',
              experimentId: selectedEntry.experimentId || '',
              notebookEntryId: selectedEntry.notebookEntryId || '',
              metadata: {
                sampleCount: selectedEntry.metadata?.sampleCount,
                replicates: selectedEntry.metadata?.replicates,
                instruments: Array.isArray(selectedEntry.metadata?.instruments)
                  ? selectedEntry.metadata.instruments.join(', ')
                  : (selectedEntry.metadata as any)?.instruments,
                reagents: Array.isArray(selectedEntry.metadata?.reagents)
                  ? selectedEntry.metadata.reagents.join(', ')
                  : (selectedEntry.metadata as any)?.reagents,
                analysisMethod: selectedEntry.analysis?.method,
                software: selectedEntry.analysis?.software,
                linkedExperiment: (selectedEntry.metadata as any)?.linkedExperiment,
              },
              fileNames: (selectedEntry.files || []).map((f) => f.name),
            }}
            onCancel={() => setShowEditModal(false)}
            onSubmit={async (form) => {
              setIsUploading(true);
              try {
                await updateDataEntry(selectedEntry.id, {
                  title: form.title,
                  type: form.type,
                  category: form.category,
                  summary: form.summary,
                  description: form.description,
                  methodology: form.methodology,
                  results: form.results,
                  conclusions: form.conclusions,
                  tags: form.tags,
                  privacy_level: form.privacy_level,
                  protocolId: form.protocolId || null,
                  experimentId: form.experimentId || null,
                  notebookEntryId: form.notebookEntryId || null,
                  files: form.fileNames.map((name) => ({ name, type: '', size: 0, url: '', uploadedAt: new Date() })),
                  metadata: form.metadata,
                });
                setShowEditModal(false);
                setSelectedEntry(null);
              } finally {
                setIsUploading(false);
              }
            }}
          />
        )}

        {/* Detailed View Modal */}
        {showViewModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Detailed View: {selectedEntry.title}</h3>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Type:</span> {selectedEntry.type}</div>
                      <div><span className="font-medium">Status:</span> {selectedEntry.status}</div>
                      <div><span className="font-medium">Created:</span> {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString() : 'Unknown'}</div>
                      <div><span className="font-medium">Author:</span> {selectedEntry.author || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600">{selectedEntry.summary || 'No summary available'}</p>
                  </div>
                </div>
                
                {selectedEntry.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedEntry.description}</p>
                  </div>
                )}

                <LinkedEntityChips
                  links={buildWorkflowLinks({
                    protocolId: selectedEntry.protocolId,
                    experimentId: selectedEntry.experimentId,
                    notebookEntryId: selectedEntry.notebookEntryId,
                  })}
                />
                
                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEntry.files && selectedEntry.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Files</h4>
                    <div className="space-y-2">
                      {selectedEntry.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FilesIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{file.name}</div>
                              <div className="text-xs text-gray-500">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url || '#';
                              link.download = file.name || 'download';
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}


    </div>
  );
};

export default DataResultsPage;
