
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  ShareIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  BookOpenIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  BuildingOfficeIcon
} from '../components/icons';
import { Lab } from '../types';

interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number;
  materials: string[];
  content: string;
  safety_notes: string;
  tags: string[];
  lab_id: string;
  privacy_level: string;
  author_id: string;
  creator_name: string;
  lab_name: string;
  institution: string;
  share_count: number;
  created_at: string;
  updated_at: string;
}

interface ProtocolSharing {
  id: string;
  protocol_id: string;
  shared_with_user_id: string | null;
  shared_with_lab_id: string | null;
  permission_level: string;
  lab_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

const ProtocolsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [selectedProtocolDetails, setSelectedProtocolDetails] = useState<{ protocol: Protocol; sharing: ProtocolSharing[] } | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    lab_id: '',
    category: '',
    difficulty: '',
    search: '',
    privacy: ''
  });

  // Form states
  const [protocolForm, setProtocolForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    estimated_duration: 1,
    materials: [''],
    content: '',
    safety_notes: '',
    tags: [''],
    lab_id: '',
    privacy_level: 'lab'
  });

  const [shareForm, setShareForm] = useState({
    shared_with_user_id: '',
    shared_with_lab_id: '',
    permission_level: 'read'
  });

  useEffect(() => {
    fetchProtocols();
    fetchLabs();
    fetchCategories();
  }, [filters]);

  const fetchProtocols = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5001/api/protocols?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProtocols(data.protocols);
      } else {
        setError('Failed to fetch protocols');
      }
    } catch (error) {
      setError('Error fetching protocols');
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/protocols/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProtocolDetails = async (protocolId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${protocolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProtocolDetails(data);
      }
    } catch (error) {
      setError('Error fetching protocol details');
    }
  };

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...protocolForm,
          materials: protocolForm.materials.filter(m => m.trim()),
          tags: protocolForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setProtocolForm({
          title: '',
          description: '',
          category: '',
          difficulty_level: 'beginner',
          estimated_duration: 1,
          materials: [''],
          content: '',
          safety_notes: '',
          tags: [''],
          lab_id: '',
          privacy_level: 'lab'
        });
        fetchProtocols();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create protocol');
      }
    } catch (error) {
      setError('Error creating protocol');
    }
  };

  const handleUpdateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${selectedProtocol.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...protocolForm,
          materials: protocolForm.materials.filter(m => m.trim()),
          tags: protocolForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchProtocols();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update protocol');
      }
    } catch (error) {
      setError('Error updating protocol');
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    if (!confirm('Are you sure you want to delete this protocol?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${protocolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProtocols();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete protocol');
      }
    } catch (error) {
      setError('Error deleting protocol');
    }
  };

  const handleShareProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      const response = await fetch(`http://localhost:5001/api/protocols/${selectedProtocol.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shareForm)
      });

      if (response.ok) {
        setShowShareModal(false);
        setShareForm({
          shared_with_user_id: '',
          shared_with_lab_id: '',
          permission_level: 'read'
        });
        fetchProtocolDetails(selectedProtocol.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to share protocol');
      }
    } catch (error) {
      setError('Error sharing protocol');
    }
  };

  const openEditModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setProtocolForm({
      title: protocol.title,
      description: protocol.description || '',
      category: protocol.category || '',
      difficulty_level: protocol.difficulty_level || 'beginner',
      estimated_duration: protocol.estimated_duration || 1,
      materials: protocol.materials?.length ? protocol.materials : [''],
      content: protocol.content,
      safety_notes: protocol.safety_notes || '',
      tags: protocol.tags?.length ? protocol.tags : [''],
      lab_id: protocol.lab_id || '',
      privacy_level: protocol.privacy_level || 'lab'
    });
    setShowEditModal(true);
  };

  const openShareModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowShareModal(true);
  };

  const openViewModal = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    fetchProtocolDetails(protocol.id);
    setShowViewModal(true);
  };

  const canEditProtocol = (protocol: Protocol) => {
    if (user?.role === 'admin') return true;
    if (protocol.author_id === user?.id) return true;
    // Lab PI can also edit
    return false; // TODO: Implement lab PI check
  };

  const addArrayItem = (field: 'materials' | 'tags') => {
    setProtocolForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'materials' | 'tags', index: number) => {
    setProtocolForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'materials' | 'tags', index: number, value: string) => {
    setProtocolForm(prev => ({
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
          <h1 className="text-2xl font-bold text-gray-900">Research Protocols</h1>
          <p className="text-gray-600">Create, manage, and share research protocols</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Protocol</span>
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
                placeholder="Search protocols..."
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
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

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {protocols.map((protocol) => (
          <div key={protocol.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openViewModal(protocol)}
                  className="text-gray-400 hover:text-gray-600"
                  title="View Details"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                {canEditProtocol(protocol) && (
                  <>
                    <button
                      onClick={() => openEditModal(protocol)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit Protocol"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProtocol(protocol.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete Protocol"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => openShareModal(protocol)}
                  className="text-blue-400 hover:text-blue-600"
                  title="Share Protocol"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{protocol.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{protocol.description}</p>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>{protocol.lab_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>{protocol.creator_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>{protocol.estimated_duration} hour{protocol.estimated_duration !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TagIcon className="w-4 h-4" />
                <span className="capitalize">{protocol.difficulty_level}</span>
              </div>
            </div>

            {protocol.tags && protocol.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {protocol.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {new Date(protocol.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500">
                {protocol.share_count} share{protocol.share_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {protocols.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No protocols found</h3>
          <p className="text-gray-600">Create your first protocol to get started.</p>
        </div>
      )}

      {/* Create Protocol Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Protocol</h2>
            <form onSubmit={handleCreateProtocol} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={protocolForm.title}
                    onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={protocolForm.category}
                    onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={protocolForm.description}
                  onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={protocolForm.difficulty_level}
                    onChange={(e) => setProtocolForm({ ...protocolForm, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={protocolForm.estimated_duration}
                    onChange={(e) => setProtocolForm({ ...protocolForm, estimated_duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                  <select
                    value={protocolForm.lab_id}
                    onChange={(e) => setProtocolForm({ ...protocolForm, lab_id: e.target.value })}
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
                  value={protocolForm.content}
                  onChange={(e) => setProtocolForm({ ...protocolForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Enter the step-by-step protocol content..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                {protocolForm.materials.map((material, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => updateArrayItem('materials', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Material name"
                    />
                    {protocolForm.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('materials', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('materials')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Material
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Safety Notes</label>
                <textarea
                  value={protocolForm.safety_notes}
                  onChange={(e) => setProtocolForm({ ...protocolForm, safety_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Important safety considerations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {protocolForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tag name"
                    />
                    {protocolForm.tags.length > 1 && (
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
                  Create Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Protocol Modal */}
      {showEditModal && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Protocol</h2>
            <form onSubmit={handleUpdateProtocol} className="space-y-4">
              {/* Same form fields as create, but with protocolForm values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={protocolForm.title}
                    onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={protocolForm.category}
                    onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={protocolForm.description}
                  onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={protocolForm.difficulty_level}
                    onChange={(e) => setProtocolForm({ ...protocolForm, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={protocolForm.estimated_duration}
                    onChange={(e) => setProtocolForm({ ...protocolForm, estimated_duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                  <select
                    value={protocolForm.lab_id}
                    onChange={(e) => setProtocolForm({ ...protocolForm, lab_id: e.target.value })}
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
                  value={protocolForm.content}
                  onChange={(e) => setProtocolForm({ ...protocolForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                {protocolForm.materials.map((material, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => updateArrayItem('materials', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {protocolForm.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('materials', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('materials')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Material
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Safety Notes</label>
                <textarea
                  value={protocolForm.safety_notes}
                  onChange={(e) => setProtocolForm({ ...protocolForm, safety_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {protocolForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {protocolForm.tags.length > 1 && (
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
                  Update Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Protocol Modal */}
      {showShareModal && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Share Protocol</h2>
            <form onSubmit={handleShareProtocol} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share with Lab</label>
                <select
                  value={shareForm.shared_with_lab_id}
                  onChange={(e) => setShareForm({ ...shareForm, shared_with_lab_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Lab</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permission Level</label>
                <select
                  value={shareForm.permission_level}
                  onChange={(e) => setShareForm({ ...shareForm, permission_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="read">Read Only</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                  <option value="full_access">Full Access</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Share Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Protocol Modal */}
      {showViewModal && selectedProtocol && selectedProtocolDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedProtocol.title}</h2>
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
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedProtocol.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Protocol Steps</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{selectedProtocol.content}</pre>
                  </div>
                </div>

                {selectedProtocol.materials && selectedProtocol.materials.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Materials</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {selectedProtocol.materials.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProtocol.safety_notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Safety Notes</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">{selectedProtocol.safety_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Protocol Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedProtocol.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium capitalize">{selectedProtocol.difficulty_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedProtocol.estimated_duration} hour{selectedProtocol.estimated_duration !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Privacy:</span>
                      <span className="font-medium capitalize">{selectedProtocol.privacy_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedProtocol.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedProtocol.tags && selectedProtocol.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProtocol.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Sharing</h3>
                  <div className="space-y-2">
                    {selectedProtocolDetails.sharing.map((share) => (
                      <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">
                          {share.lab_name || `${share.first_name} ${share.last_name}`}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
                          {share.permission_level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolsPage;
