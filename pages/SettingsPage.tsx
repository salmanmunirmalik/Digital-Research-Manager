import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
  GlobeAltIcon,
  KeyIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  provider: string;
  provider_name: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

interface Provider {
  provider: string;
  provider_name: string;
  supports_embeddings: boolean;
  supports_chat: boolean;
  embedding_price_per_million: number;
  chat_price_per_million: number;
  max_context_length: number;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security' | 'api-management' | 'data'>('profile');
  
  // API Management state (consolidated)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    providerName: '',
    apiKey: '',
    selectedTasks: [] as string[]
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Top AI Providers List (30 providers)
  const topProviders = [
    { provider: 'openai', name: 'OpenAI (GPT-4, GPT-3.5)', category: 'General Purpose' },
    { provider: 'google_gemini', name: 'Google Gemini', category: 'General Purpose' },
    { provider: 'anthropic_claude', name: 'Anthropic Claude', category: 'General Purpose' },
    { provider: 'azure_copilot', name: 'Microsoft Azure OpenAI', category: 'Enterprise' },
    { provider: 'perplexity', name: 'Perplexity AI', category: 'Search & Research' },
    { provider: 'cohere', name: 'Cohere', category: 'NLP & Embeddings' },
    { provider: 'huggingface', name: 'Hugging Face', category: 'Open Source' },
    { provider: 'mistral', name: 'Mistral AI', category: 'General Purpose' },
    { provider: 'groq', name: 'Groq', category: 'Fast Inference' },
    { provider: 'together', name: 'Together AI', category: 'Open Source' },
    { provider: 'replicate', name: 'Replicate', category: 'Model Hosting' },
    { provider: 'stability', name: 'Stability AI', category: 'Image Generation' },
    { provider: 'midjourney', name: 'Midjourney', category: 'Image Generation' },
    { provider: 'dalle', name: 'DALL-E (OpenAI)', category: 'Image Generation' },
    { provider: 'fireworks', name: 'Fireworks AI', category: 'Fast Inference' },
    { provider: 'anyscale', name: 'Anyscale', category: 'Scalable Inference' },
    { provider: 'openrouter', name: 'OpenRouter', category: 'Model Aggregator' },
    { provider: 'deepseek', name: 'DeepSeek', category: 'General Purpose' },
    { provider: 'qwen', name: 'Qwen (Alibaba)', category: 'Multilingual' },
    { provider: 'yi', name: 'Yi (01.AI)', category: 'General Purpose' },
    { provider: 'llama', name: 'Llama (Meta)', category: 'Open Source' },
    { provider: 'palm', name: 'PaLM (Google)', category: 'General Purpose' },
    { provider: 'bedrock', name: 'AWS Bedrock', category: 'Enterprise' },
    { provider: 'vertex', name: 'Google Vertex AI', category: 'Enterprise' },
    { provider: 'watson', name: 'IBM Watson', category: 'Enterprise' },
    { provider: 'jina', name: 'Jina AI', category: 'Embeddings' },
    { provider: 'voyage', name: 'Voyage AI', category: 'Embeddings' },
    { provider: 'openai_compatible', name: 'OpenAI Compatible API', category: 'Compatible' },
    { provider: 'local_llm', name: 'Local LLM (Ollama)', category: 'Self-Hosted' },
    { provider: 'custom', name: 'Custom API Endpoint', category: 'Custom' }
  ];

  // Settings state
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    specialization: '',
    bio: '',
    location: '',
    timezone: 'UTC'
  });
  const [notifications, setNotifications] = useState({
      email: true,
      push: true,
      researchUpdates: true,
      labUpdates: true,
      conferenceUpdates: true
  });
  const [privacy, setPrivacy] = useState({
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
    showLocation: true
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'api-management') {
      fetchApiKeys();
      fetchProviders();
      fetchTasks();
      fetchTaskAssignments();
      fetchWorkflows();
      fetchUsageStats();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserProfile(response.data.profile);
      setUserPreferences(response.data.preferences);
      
      // Set form values
      if (response.data.profile) {
        setProfileForm({
          first_name: response.data.profile.first_name || '',
          last_name: response.data.profile.last_name || '',
          phone: response.data.profile.phone || '',
          department: response.data.profile.department || '',
          specialization: response.data.profile.specialization || '',
          bio: response.data.profile.bio || '',
          location: response.data.profile.location || '',
          timezone: response.data.profile.timezone || 'UTC'
        });
      }
      
      if (response.data.preferences) {
        setNotifications({
          email: response.data.preferences.notifications_email !== false,
          push: response.data.preferences.notifications_push !== false,
          researchUpdates: response.data.preferences.notifications_research_updates !== false,
          labUpdates: response.data.preferences.notifications_lab_updates !== false,
          conferenceUpdates: response.data.preferences.notifications_conference_updates !== false
        });
      }
      
      if (response.data.profile) {
        setPrivacy({
          profileVisibility: response.data.profile.profile_visibility || 'public',
          showEmail: response.data.profile.show_email !== false,
          showPhone: response.data.profile.show_phone || false,
          showLocation: response.data.profile.show_location !== false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      setLoadingApiKeys(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/ai-providers/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(response.data.keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/ai-providers/providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/api-task-assignments/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTaskAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/api-task-assignments/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTaskAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching task assignments:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/workflows', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      // TODO: Implement real usage stats endpoint
      setUsageStats({
        total_requests: 1247,
        total_tokens: 245000,
        total_cost: 12.45
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
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
      // If task assignments fail, rollback by deleting the API key to prevent orphaned data
      try {
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
      setShowAddKeyModal(false);
      setFormData({ provider: '', providerName: '', apiKey: '', selectedTasks: [] });
      fetchApiKeys();
      fetchTaskAssignments();
      } catch (assignmentError: any) {
        // Rollback: Delete the API key if task assignments failed
        try {
          await axios.delete(`/api/ai-providers/keys/${newApiKeyId}`, { headers });
        } catch (deleteError) {
          console.error('Failed to rollback API key after assignment failure:', deleteError);
        }
        throw assignmentError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to add API key' });
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/ai-providers/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'API key deleted successfully!' });
      fetchApiKeys();
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

      fetchApiKeys();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update API key' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings/profile', profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await fetchSettings();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings/preferences', {
        notifications_email: notifications.email,
        notifications_push: notifications.push,
        notifications_research_updates: notifications.researchUpdates,
        notifications_lab_updates: notifications.labUpdates,
        notifications_conference_updates: notifications.conferenceUpdates
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Notification preferences updated successfully!' });
      await fetchSettings();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update preferences' });
    }
  };

  const handleSavePrivacy = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings/privacy', {
        profile_visibility: privacy.profileVisibility,
        show_email: privacy.showEmail,
        show_phone: privacy.showPhone,
        show_location: privacy.showLocation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Privacy settings updated successfully!' });
      await fetchSettings();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update privacy settings' });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-lab-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to export data' });
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/settings/account', {
        data: { password },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Account deleted successfully. Redirecting...' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete account' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access settings</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and security settings</p>
        </div>

          {/* Message */}
          {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <XCircleIcon className="w-5 h-5" />
            </button>
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: UserIcon },
                  { id: 'notifications', label: 'Notifications', icon: BellIcon },
                  { id: 'privacy', label: 'Privacy', icon: GlobeAltIcon },
                  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
                  { id: 'api-management', label: 'API Management', icon: KeyIcon },
                  { id: 'data', label: 'Data Management', icon: CogIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                  
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading profile...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <input
                            type="text"
                            value={profileForm.department}
                            onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                          <input
                            type="text"
                            value={profileForm.specialization}
                            onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                          <input
                            type="text"
                            value={profileForm.location}
                            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                          <select
                            value={profileForm.timezone}
                            onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">GMT</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveProfile}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* API Management Tab - Complete */}
              {activeTab === 'api-management' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">API Management</h2>
                      <p className="text-sm text-gray-600 mt-1">Manage your AI provider keys, task assignments, and workflows</p>
                    </div>
                    <button
                      onClick={() => setShowAddKeyModal(true)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Add API Key</span>
                    </button>
                  </div>

                  {/* Benefits Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Why add your own API keys?</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Reduce platform costs for AI features</li>
                        <li>Use your preferred AI provider (OpenAI, Gemini, Claude, etc.)</li>
                        <li>Access premium models with your own account</li>
                        <li>Better rate limits with higher-tier accounts</li>
                        <li>Enhanced privacy and control</li>
                      </ul>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">API Keys</p>
                      <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
                      <p className="text-xs text-gray-500 mt-1">{apiKeys.filter(k => k.is_active).length} active</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Task Assignments</p>
                      <p className="text-2xl font-bold text-gray-900">{taskAssignments.length}</p>
                      <p className="text-xs text-gray-500 mt-1">{taskAssignments.filter(a => a.is_active).length} active</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Workflows</p>
                      <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
                      <p className="text-xs text-gray-500 mt-1">{workflows.filter(w => w.is_active).length} active</p>
                    </div>
                  </div>

                  {/* API Keys Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Your API Keys</h3>
                      <button
                        onClick={() => setShowAddKeyModal(true)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Key</span>
                      </button>
                    </div>
                    {loadingApiKeys ? (
                      <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading API keys...</p>
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys added</h3>
                        <p className="text-gray-600 mb-4">Add your first API key to get started with AI features</p>
                        <button
                          onClick={() => setShowAddKeyModal(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add API Key
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {apiKeys.map((key) => {
                          const keyAssignments = taskAssignments.filter(a => a.api_key_id === key.id);
                          return (
                            <div key={key.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    key.is_active ? 'bg-blue-100' : 'bg-gray-100'
                                  }`}>
                                    <KeyIcon className={`w-6 h-6 ${key.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{key.provider_name}</h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        key.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {key.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                      {key.last_used_at && (
                                        <span className="text-xs text-gray-500">
                                          Used {new Date(key.last_used_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Show assigned tasks */}
                              {keyAssignments.length > 0 ? (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-2">Assigned Tasks:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {keyAssignments.slice(0, 3).map((assignment) => (
                                      <span
                                        key={assignment.id}
                                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                                      >
                                        {assignment.task_name}
                                      </span>
                                    ))}
                                    {keyAssignments.length > 3 && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                        +{keyAssignments.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 italic">No tasks assigned</p>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                                <button
                                  onClick={() => handleToggleApiKey(key.id, key.is_active)}
                                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                    key.is_active 
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {key.is_active ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => handleDeleteApiKey(key.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete API key"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Task Assignments Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Assignments</h3>
                    {taskAssignments.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-600 mb-2">No task assignments configured</p>
                        <p className="text-sm text-gray-500">Assign tasks to your API keys when adding them</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {taskAssignments.map((assignment) => {
                          const apiKey = apiKeys.find(k => k.id === assignment.api_key_id);
                          return (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{assignment.task_name}</p>
                                <p className="text-sm text-gray-600">
                                  API: {apiKey?.provider_name || 'Unknown'} • Priority: {assignment.priority}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                assignment.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {assignment.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Workflows Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
                      <button
                        onClick={() => window.location.href = '/workflow-builder'}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>New Workflow</span>
                      </button>
                    </div>
                    {workflows.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-600 mb-3">No workflows created yet</p>
                        <p className="text-sm text-gray-500 mb-4">Create automated AI workflows to streamline your research</p>
                        <button
                          onClick={() => window.location.href = '/workflow-builder'}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Create Workflow
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workflows.slice(0, 5).map((workflow) => (
                          <div
                            key={workflow.id}
                            onClick={() => window.location.href = `/workflow-builder/${workflow.id}`}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{workflow.name}</p>
                              <p className="text-sm text-gray-600">
                                {workflow.execution_count || 0} executions • {workflow.success_count || 0} successful
                                {workflow.description && ` • ${workflow.description.substring(0, 50)}${workflow.description.length > 50 ? '...' : ''}`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${workflow.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-500">
                                {new Date(workflow.updated_at || workflow.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {workflows.length > 5 && (
                          <div className="text-center pt-2">
                            <button
                              onClick={() => window.location.href = '/workflow-builder'}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              View all {workflows.length} workflows →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                          checked={notifications.email}
                          onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Receive browser push notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Research Updates</h3>
                  <p className="text-sm text-gray-600">Get notified about research progress and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                          checked={notifications.researchUpdates}
                          onChange={(e) => setNotifications({ ...notifications, researchUpdates: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Lab Updates</h3>
                  <p className="text-sm text-gray-600">Receive notifications about lab activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                          checked={notifications.labUpdates}
                          onChange={(e) => setNotifications({ ...notifications, labUpdates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Conference Updates</h3>
                        <p className="text-sm text-gray-600">Get notified about conferences and events</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.conferenceUpdates}
                          onChange={(e) => setNotifications({ ...notifications, conferenceUpdates: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotifications}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Preferences
                    </button>
            </div>
          </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
                  
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                <select
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="lab-only">Lab Members Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Show Email</h3>
                  <p className="text-sm text-gray-600">Display email address on profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                          checked={privacy.showEmail}
                          onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
          </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                        <h3 className="font-medium text-gray-900">Show Phone</h3>
                        <p className="text-sm text-gray-600">Display phone number on profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                          checked={privacy.showPhone}
                          onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Show Location</h3>
                        <p className="text-sm text-gray-600">Display location on profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy.showLocation}
                          onChange={(e) => setPrivacy({ ...privacy, showLocation: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePrivacy}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Privacy Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                  
                  <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
                      <p className="text-sm text-gray-600 mb-4">Update your password to keep your account secure</p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input
                            type="password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                            type="password"
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={handleChangePassword}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Change Password
                        </button>
                      </div>
              </div>
            </div>
          </div>
              )}

              {/* Data Management Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
                  
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
                <p className="text-sm text-gray-600 mb-4">Download a copy of your data</p>
                <button
                  onClick={handleExportData}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Export Data
                </button>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 mb-4">Permanently delete your account and all data</p>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add API Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add API Key</h3>
              <button 
                onClick={() => {
                  setShowAddKeyModal(false);
                  setFormData({ provider: '', providerName: '', apiKey: '', selectedTasks: [] });
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => {
                    const selected = topProviders.find(p => p.provider === e.target.value);
                    setFormData({ 
                      ...formData, 
                      provider: e.target.value,
                      providerName: selected?.name || ''
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a provider...</option>
                  {Object.entries(
                    topProviders.reduce((acc, p) => {
                      if (!acc[p.category]) acc[p.category] = [];
                      acc[p.category].push(p);
                      return acc;
                    }, {} as Record<string, typeof topProviders>)
                  ).map(([category, categoryProviders]) => (
                    <optgroup key={category} label={category}>
                      {categoryProviders.map((provider) => (
                        <option key={provider.provider} value={provider.provider}>
                          {provider.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {formData.provider && formData.provider === 'custom' && (
                  <input
                    type="text"
                    value={formData.providerName}
                    onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                    placeholder="Enter custom provider name"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Tasks (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select which tasks this API should handle. You can change this later.
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

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddKeyModal(false);
                    setFormData({ provider: '', providerName: '', apiKey: '', selectedTasks: [] });
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
      )}
    </div>
  );
};

export default SettingsPage;
