/**
 * AI API Keys Page
 * Simplified page for managing AI API keys with integrated task assignment
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  CogIcon,
  SparklesIcon
} from '../components/icons';

interface ApiKey {
  id: string;
  provider: string;
  provider_name: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

interface Task {
  type: string;
  name: string;
  description: string;
}

interface TaskAssignment {
  id: string;
  task_type: string;
  task_name: string;
  provider_name: string;
  is_active: boolean;
}

const AIApiKeysPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    provider: '',
    apiKey: '',
    selectedTasks: [] as string[]
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [keysRes, providersRes, tasksRes, assignmentsRes] = await Promise.all([
        axios.get('/api/ai-providers/keys', { headers }),
        axios.get('/api/ai-providers/providers', { headers }).catch(() => ({ data: { providers: [] } })),
        axios.get('/api/api-task-assignments/tasks', { headers }),
        axios.get('/api/api-task-assignments/assignments', { headers })
      ]);

      setApiKeys(keysRes.data.keys || []);
      // Merge database providers with top providers list
      const dbProviders = providersRes.data.providers || [];
      const mergedProviders = topProviders.map(tp => {
        const dbProvider = dbProviders.find((p: any) => p.provider === tp.provider);
        return dbProvider || { provider: tp.provider, provider_name: tp.name, ...tp };
      });
      setProviders(mergedProviders);
      setTasks(tasksRes.data.tasks || []);
      setTaskAssignments(assignmentsRes.data.assignments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!formData.provider || !formData.apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please select a provider and enter an API key' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Add API key
      const selectedProvider = topProviders.find(p => p.provider === formData.provider);
      const keyResponse = await axios.post('/api/ai-providers/keys', {
        provider: formData.provider,
        provider_name: selectedProvider?.name || formData.providerName || formData.provider,
        apiKey: formData.apiKey
      }, { headers });

      const newApiKeyId = keyResponse.data.key.id;

      // Step 2: Assign tasks if selected
      if (formData.selectedTasks.length > 0) {
        const assignmentPromises = formData.selectedTasks.map((taskType, index) => {
          const task = tasks.find(t => t.type === taskType);
          return axios.post('/api/api-task-assignments/assignments', {
            api_key_id: newApiKeyId,
            task_type: taskType,
            task_name: task?.name || taskType,
            priority: index + 1
          }, { headers });
        });
        
        await Promise.all(assignmentPromises);
      }

      setMessage({ 
        type: 'success', 
        text: `API key added successfully!${formData.selectedTasks.length > 0 ? ` Assigned to ${formData.selectedTasks.length} task(s).` : ''}` 
      });
      
      setShowAddModal(false);
      setFormData({ provider: '', providerName: '', apiKey: '', selectedTasks: [] });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to add API key' });
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This will also remove all task assignments.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/ai-providers/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'API key deleted successfully!' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    }
  };

  const handleToggleApiKey = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/ai-providers/keys/${id}`, {
        is_active: !isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update API key' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <KeyIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI API Keys</h1>
                <p className="text-sm text-gray-600">Manage your AI provider keys and task assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/settings?tab=api-management')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CogIcon className="w-5 h-5" />
                <span>Advanced Settings</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add API Key</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </span>
              <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* API Keys Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Keys Configured</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your AI provider API keys to enable the AI Research Agent. You can assign specific tasks to each API.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Your First API Key
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiKeys.map((key) => {
              const assignments = taskAssignments.filter(a => a.api_key_id === key.id);
              return (
                <div
                  key={key.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        key.is_active ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <KeyIcon className={`w-6 h-6 ${key.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{key.provider_name}</h3>
                        <p className="text-xs text-gray-500">{key.provider}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>

                  {/* Assigned Tasks */}
                  {assignments.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Assigned Tasks:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {assignments.slice(0, 3).map((assignment) => (
                          <span
                            key={assignment.id}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {assignment.task_name}
                          </span>
                        ))}
                        {assignments.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{assignments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 italic">No tasks assigned</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleToggleApiKey(key.id, key.is_active)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        key.is_active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {key.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => navigate(`/settings?tab=api-management`)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Manage tasks"
                    >
                      <CogIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add API Key Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Add API Key</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ provider: '', apiKey: '', selectedTasks: [] });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Provider <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a provider...</option>
                      {providers.map((provider) => (
                        <option key={provider.provider} value={provider.provider}>
                          {provider.provider_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="Enter your API key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Your API key is encrypted and stored securely. We never store it in plain text.
                    </p>
                  </div>

                  {/* Task Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Tasks (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select which tasks this API should handle. You can change this later in Settings.
                    </p>
                    <div className="relative">
                      <select
                        multiple
                        value={formData.selectedTasks}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, selectedTasks: selected });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px]"
                        size={tasks.length > 0 ? Math.min(tasks.length, 8) : 4}
                      >
                        {tasks.map((task) => (
                          <option key={task.type} value={task.type}>
                            {task.name} - {task.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Hold Ctrl/Cmd to select multiple tasks
                      </p>
                    </div>
                    {formData.selectedTasks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Selected Tasks ({formData.selectedTasks.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedTasks.map((taskType) => {
                            const task = tasks.find(t => t.type === taskType);
                            return (
                              <span
                                key={taskType}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs flex items-center space-x-1"
                              >
                                <span>{task?.name || taskType}</span>
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      selectedTasks: formData.selectedTasks.filter(t => t !== taskType)
                                    });
                                  }}
                                  className="ml-1 hover:text-blue-900"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setFormData({ provider: '', apiKey: '', selectedTasks: [] });
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddApiKey}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add API Key{formData.selectedTasks.length > 0 ? ` & Assign ${formData.selectedTasks.length} Task(s)` : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIApiKeysPage;

