import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  TrashIcon,
  EyeIcon,
  BookOpenIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '../components/icons';
import { Lab } from '../types';

interface LabNotebookEntry {
  id: string;
  title: string;
  content: string;
  entry_type: string;
  results: string;
  conclusions: string;
  lab_id: string;
  project_id: string | null;
  tags: string[];
  privacy_level: string;
  author_id: string;
  creator_name: string;
  lab_name: string;
  institution: string;
  created_at: string;
  updated_at: string;
}

interface LabNotebookComment {
  id: string;
  entry_id: string;
  user_id: string;
  comment_text: string;
  parent_comment_id: string | null;
  first_name: string;
  last_name: string;
  username: string;
  created_at: string;
}

const LabNotebookPage: React.FC = () => {
  const { user, token } = useAuth();
  const [entries, setEntries] = useState<LabNotebookEntry[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [experimentTypes, setExperimentTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LabNotebookEntry | null>(null);
  const [selectedEntryDetails, setSelectedEntryDetails] = useState<{ entry: LabNotebookEntry; related_data: any[] } | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    lab_id: '',
    experiment_type: '',
    status: '',
    search: '',
    privacy: ''
  });

  // Form states
  const [entryForm, setEntryForm] = useState({
    title: '',
    content: '',
    entry_type: '',
    results: '',
    conclusions: '',
    lab_id: '',
    project_id: '',
    tags: [''],
    privacy_level: 'lab'
  });

  useEffect(() => {
    fetchEntries();
    fetchLabs();
    fetchExperimentTypes();
  }, [filters]);

  const fetchEntries = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5001/api/lab-notebooks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      } else {
        setError('Failed to fetch entries');
      }
    } catch (error) {
      setError('Error fetching entries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchExperimentTypes = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/lab-notebooks/entry-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: { entry_types?: string[] } = await response.json();
        setExperimentTypes(Array.isArray(data.entry_types) ? data.entry_types : []);
      }
    } catch (error) {
      console.error('Error fetching experiment types:', error);
    }
  };

  const fetchEntryDetails = async (entryId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${entryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedEntryDetails(data);
      }
    } catch (error) {
      setError('Error fetching entry details');
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/lab-notebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...entryForm,
          tags: entryForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEntryForm({
          title: '',
          content: '',
          entry_type: '',
          results: '',
          conclusions: '',
          lab_id: '',
          project_id: '',
          tags: [''],
          privacy_level: 'lab'
        });
        fetchEntries();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create entry');
      }
    } catch (error) {
      setError('Error creating entry');
    }
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...entryForm,
          tags: entryForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchEntries();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update entry');
      }
    } catch (error) {
      setError('Error updating entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/lab-notebooks/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchEntries();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete entry');
      }
    } catch (error) {
      setError('Error deleting entry');
    }
  };

  const openEditModal = (entry: LabNotebookEntry) => {
    setSelectedEntry(entry);
    setEntryForm({
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type || '',
      results: entry.results || '',
      conclusions: entry.conclusions || '',
      lab_id: entry.lab_id,
      project_id: entry.project_id || '',
      tags: entry.tags?.length ? entry.tags : [''],
      privacy_level: entry.privacy_level
    });
    setShowEditModal(true);
  };

  const openViewModal = (entry: LabNotebookEntry) => {
    setSelectedEntry(entry);
    fetchEntryDetails(entry.id);
    setShowViewModal(true);
  };

  const canEditEntry = (entry: LabNotebookEntry) => {
    if (user?.role === 'admin') return true;
    if (entry.author_id === user?.id) return true;
    // Lab PI can also edit
    return false; // TODO: Implement lab PI check
  };

  const addArrayItem = (field: 'tags') => {
    setEntryForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'tags', index: number) => {
    setEntryForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'tags', index: number, value: string) => {
    setEntryForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Notebook</h1>
          <p className="text-gray-600">Document your research experiments and findings</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FilterIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
            <select
              value={filters.lab_id}
              onChange={(e) => setFilters({ ...filters, lab_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Type</label>
            <select
              value={filters.experiment_type}
              onChange={(e) => setFilters({ ...filters, experiment_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {experimentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
            <select
              value={filters.privacy}
              onChange={(e) => setFilters({ ...filters, privacy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Privacy Levels</option>
              <option value="personal">Personal</option>
              <option value="lab">Lab</option>
              <option value="global">Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openViewModal(entry)}
                  className="text-gray-400 hover:text-gray-600"
                  title="View Details"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                {canEditEntry(entry) && (
                  <>
                    <button
                      onClick={() => openEditModal(entry)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit Entry"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete Entry"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{entry.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{entry.content}</p>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>{entry.lab_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>{entry.creator_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>{entry.entry_type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TagIcon className="w-4 h-4" />
                <span className="capitalize">{entry.privacy_level}</span>
              </div>
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {entry.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {new Date(entry.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {entry.privacy_level}
              </span>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
          <p className="text-gray-600">Create your first lab notebook entry to get started.</p>
        </div>
      )}

      {/* Create Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Lab Notebook Entry</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab *</label>
                  <select
                    value={entryForm.lab_id}
                    onChange={(e) => setEntryForm({ ...entryForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lab</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={entryForm.content}
                  onChange={(e) => setEntryForm({ ...entryForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Describe your experiment, observations, and findings..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Type</label>
                  <input
                    type="text"
                    value={entryForm.entry_type}
                    onChange={(e) => setEntryForm({ ...entryForm, entry_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., PCR, Microscopy, Data Analysis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                  <select
                    value={entryForm.privacy_level}
                    onChange={(e) => setEntryForm({ ...entryForm, privacy_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lab">Lab</option>
                    <option value="personal">Personal</option>
                    <option value="global">Global</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Results</label>
                <textarea
                  value={entryForm.results}
                  onChange={(e) => setEntryForm({ ...entryForm, results: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="What were the outcomes and findings?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conclusions</label>
                <textarea
                  value={entryForm.conclusions}
                  onChange={(e) => setEntryForm({ ...entryForm, conclusions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What conclusions can be drawn?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {entryForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tag name"
                    />
                    {entryForm.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Tag
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Lab Notebook Entry</h2>
            <form onSubmit={handleUpdateEntry} className="space-y-4">
              {/* Same form fields as create, but with entryForm values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab *</label>
                  <select
                    value={entryForm.lab_id}
                    onChange={(e) => setEntryForm({ ...entryForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lab</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={entryForm.content}
                  onChange={(e) => setEntryForm({ ...entryForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Type</label>
                  <input
                    type="text"
                    value={entryForm.entry_type}
                    onChange={(e) => setEntryForm({ ...entryForm, entry_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                  <select
                    value={entryForm.privacy_level}
                    onChange={(e) => setEntryForm({ ...entryForm, privacy_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lab">Lab</option>
                    <option value="personal">Personal</option>
                    <option value="global">Global</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Results</label>
                <textarea
                  value={entryForm.results}
                  onChange={(e) => setEntryForm({ ...entryForm, results: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conclusions</label>
                <textarea
                  value={entryForm.conclusions}
                  onChange={(e) => setEntryForm({ ...entryForm, conclusions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {entryForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {entryForm.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Tag
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {showViewModal && selectedEntry && selectedEntryDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedEntry.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Content</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{selectedEntry.content}</pre>
                  </div>
                </div>

                {/* Removed Objectives, Methodology, and Conclusions from view modal */}

                {selectedEntry.results && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Results</h3>
                    <p className="text-gray-600">{selectedEntry.results}</p>
                  </div>
                )}

                {selectedEntry.conclusions && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Conclusions</h3>
                    <p className="text-gray-600">{selectedEntry.conclusions}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Entry Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{selectedEntry.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedEntry.entry_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Privacy:</span>
                      <span className="font-medium capitalize">{selectedEntry.privacy_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedEntry.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium">{new Date(selectedEntry.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntryDetails.related_data && selectedEntryDetails.related_data.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Related Data</h3>
                    <div className="space-y-2">
                      {selectedEntryDetails.related_data.map((data) => (
                        <div key={data.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{data.title}</div>
                          <div className="text-gray-600 text-xs">{data.data_type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabNotebookPage;
