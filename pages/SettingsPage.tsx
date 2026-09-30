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
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, PagePanel, PageStat } from '../components/PageHeader';

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

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'mb-1.5 block text-[12px] font-medium text-slate-600';
const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-sky-800 transition-colors disabled:opacity-50';
const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors';

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}> = ({ title, description, checked, onChange, disabled }) => (
  <div
    className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
      checked
        ? 'border-sky-100 bg-gradient-to-br from-sky-50/70 to-white'
        : 'border-slate-100 bg-white'
    }`}
  >
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-slate-900">{title}</p>
      <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-sky-700' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  </div>
);

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
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState<boolean | null>(null);
  const [privacyConsentLoading, setPrivacyConsentLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (userProfile?.id) {
      fetchPrivacyPolicyConsent(userProfile.id);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (activeTab === 'api-management') {
      fetchApiKeys();
      fetchProviders();
      fetchTasks();
      fetchTaskAssignments();
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

  const fetchPrivacyPolicyConsent = async (userId: string) => {
    try {
      setPrivacyConsentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/compliance/consent/${userId}?policyType=privacy`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const consent = response.data?.consents?.essential;
      setPrivacyPolicyConsent(consent?.granted ?? false);
    } catch (error) {
      console.error('Error fetching privacy consent:', error);
    } finally {
      setPrivacyConsentLoading(false);
    }
  };

  const handlePrivacyPolicyConsent = async (granted: boolean) => {
    if (!userProfile?.id) return;
    try {
      setPrivacyConsentLoading(true);
      const token = localStorage.getItem('token');
      if (granted) {
        await axios.post('/api/compliance/consent', {
          type: 'essential',
          granted: true,
          source: 'account_settings',
          policyType: 'privacy',
          purposes: ['policy_ack']
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/compliance/consent/withdraw', {
          types: ['essential'],
          source: 'account_settings',
          policyType: 'privacy'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setPrivacyPolicyConsent(granted);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update privacy consent' });
    } finally {
      setPrivacyConsentLoading(false);
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
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/60">
            <CogIcon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Sign in to manage settings</h2>
          <p className="mt-2 text-[13px] text-slate-500">Account preferences, privacy, and API keys need an active session.</p>
          <button type="button" onClick={() => navigate('/login')} className={`${btnPrimary} mt-5`}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: UserIcon },
    { id: 'notifications' as const, label: 'Notifications', icon: BellIcon },
    { id: 'privacy' as const, label: 'Privacy', icon: GlobeAltIcon },
    { id: 'security' as const, label: 'Security', icon: ShieldCheckIcon },
    { id: 'api-management' as const, label: 'API keys', icon: KeyIcon },
    { id: 'data' as const, label: 'Data', icon: CogIcon },
  ];

  const tabLabel = tabs.find((t) => t.id === activeTab)?.label ?? 'Settings';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Settings"
        subtitle="Account, privacy, security, and AI provider keys — in one place."
        accent="sky"
        icon={<CogIcon />}
        actions={
          <Link to="/profile" className={btnSecondary}>
            View profile
          </Link>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PageStat label="Active tab" value={tabLabel} accent="sky" />
          <PageStat
            label="API keys"
            value={apiKeys.length}
            accent="sky"
            action={
              <span className="text-[11px] text-slate-500">
                {apiKeys.filter((k) => k.is_active).length} on
              </span>
            }
          />
          <PageStat
            label="Notifications"
            value={Object.values(notifications).filter(Boolean).length}
            accent="teal"
          />
          <PageStat
            label="Visibility"
            value={privacy.profileVisibility === 'lab-only' ? 'Lab' : privacy.profileVisibility}
            accent="amber"
          />
        </div>
      </PageHeader>

      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
          ) : (
            <XMarkIcon className="h-5 w-5 shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="rounded-lg p-1 hover:bg-black/5" aria-label="Dismiss">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <PagePanel className="sticky top-4 p-2 sm:p-2" accent="sky">
            <nav className="space-y-0.5" aria-label="Settings sections">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-sky-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${active ? 'text-sky-100' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </PagePanel>
        </aside>

        <div className="lg:col-span-9 space-y-4">
          {activeTab === 'profile' && (
            <PagePanel
              accent="sky"
              title="Profile"
              action={
                <button type="button" onClick={handleSaveProfile} className={btnPrimary} disabled={loading}>
                  Save changes
                </button>
              }
            >
              {loading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                  <p className="mt-3 text-[13px] text-slate-500">Loading profile…</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>First name</label>
                      <input
                        type="text"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Last name</label>
                      <input
                        type="text"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={user.email} disabled className={fieldClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Department</label>
                      <input
                        type="text"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Specialization</label>
                      <input
                        type="text"
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Timezone</label>
                      <select
                        value={profileForm.timezone}
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                        className={fieldClass}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">GMT</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Bio</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      className={fieldClass}
                      placeholder="A short note about your research focus…"
                    />
                  </div>
                </div>
              )}
            </PagePanel>
          )}

          {activeTab === 'api-management' && (
            <>
              <PagePanel
                accent="sky"
                title="API management"
                action={
                  <button type="button" onClick={() => setShowAddKeyModal(true)} className={btnPrimary}>
                    <PlusIcon className="h-4 w-4" />
                    Add API key
                  </button>
                }
              >
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-4">
                  <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
                  <div className="text-[13px] text-slate-700">
                    <p className="font-medium text-slate-900">Bring your own keys</p>
                    <p className="mt-1 text-slate-500">
                      Use your preferred provider, keep rate limits under your account, and reduce platform AI costs.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PageStat
                    label="Keys"
                    value={apiKeys.length}
                    accent="sky"
                    action={<span className="text-[11px] text-slate-500">{apiKeys.filter((k) => k.is_active).length} active</span>}
                  />
                  <PageStat
                    label="Assignments"
                    value={taskAssignments.length}
                    accent="teal"
                    action={
                      <span className="text-[11px] text-slate-500">
                        {taskAssignments.filter((a) => a.is_active).length} active
                      </span>
                    }
                  />
                </div>
              </PagePanel>

              <PagePanel accent="sky" title="Your API keys">
                {loadingApiKeys ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                    <p className="mt-3 text-[13px] text-slate-500">Loading keys…</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <KeyIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-[14px] font-medium text-slate-900">No API keys yet</p>
                    <p className="mt-1 text-[12px] text-slate-500">Add a provider key to power AI features.</p>
                    <button type="button" onClick={() => setShowAddKeyModal(true)} className={`${btnPrimary} mt-4`}>
                      Add API key
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {apiKeys.map((key) => {
                      const keyAssignments = taskAssignments.filter((a) => a.api_key_id === key.id);
                      return (
                        <div
                          key={key.id}
                          className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/60 p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                key.is_active ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              <KeyIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-[13px] font-semibold text-slate-900">{key.provider_name}</h4>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                                    key.is_active
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {key.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {key.last_used_at && (
                                  <span className="text-[11px] text-slate-400">
                                    Used {new Date(key.last_used_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            {keyAssignments.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {keyAssignments.slice(0, 3).map((assignment) => (
                                  <span
                                    key={assignment.id}
                                    className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] text-sky-800"
                                  >
                                    {assignment.task_name}
                                  </span>
                                ))}
                                {keyAssignments.length > 3 && (
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                    +{keyAssignments.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[12px] italic text-slate-400">No tasks assigned</p>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() => handleToggleApiKey(key.id, key.is_active)}
                              className={`flex-1 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                key.is_active
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {key.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApiKey(key.id)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Delete API key"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </PagePanel>

              <PagePanel accent="teal" title="Task assignments">
                {taskAssignments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                    <p className="text-[13px] text-slate-600">No assignments yet</p>
                    <p className="mt-1 text-[12px] text-slate-400">Assign tasks when you add a key.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taskAssignments.map((assignment) => {
                      const apiKey = apiKeys.find((k) => k.id === assignment.api_key_id);
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-slate-900">{assignment.task_name}</p>
                            <p className="text-[12px] text-slate-500">
                              {apiKey?.provider_name || 'Unknown'} · Priority {assignment.priority}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              assignment.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {assignment.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </PagePanel>
            </>
          )}

          {activeTab === 'notifications' && (
            <PagePanel
              accent="sky"
              title="Notifications"
              action={
                <button type="button" onClick={handleSaveNotifications} className={btnPrimary}>
                  Save preferences
                </button>
              }
            >
              <div className="space-y-2.5">
                <ToggleRow
                  title="Email notifications"
                  description="Receive notifications via email"
                  checked={notifications.email}
                  onChange={(next) => setNotifications({ ...notifications, email: next })}
                />
                <ToggleRow
                  title="Push notifications"
                  description="Browser push alerts"
                  checked={notifications.push}
                  onChange={(next) => setNotifications({ ...notifications, push: next })}
                />
                <ToggleRow
                  title="Research updates"
                  description="Progress and research activity"
                  checked={notifications.researchUpdates}
                  onChange={(next) => setNotifications({ ...notifications, researchUpdates: next })}
                />
                <ToggleRow
                  title="Lab updates"
                  description="Lab activity and membership changes"
                  checked={notifications.labUpdates}
                  onChange={(next) => setNotifications({ ...notifications, labUpdates: next })}
                />
                <ToggleRow
                  title="Conference updates"
                  description="Conferences and events"
                  checked={notifications.conferenceUpdates}
                  onChange={(next) => setNotifications({ ...notifications, conferenceUpdates: next })}
                />
              </div>
            </PagePanel>
          )}

          {activeTab === 'privacy' && (
            <PagePanel
              accent="sky"
              title="Privacy"
              action={
                <button type="button" onClick={handleSavePrivacy} className={btnPrimary}>
                  Save privacy
                </button>
              }
            >
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <label className={labelClass}>Profile visibility</label>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                    className={fieldClass}
                  >
                    <option value="public">Public</option>
                    <option value="lab-only">Lab members only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <ToggleRow
                  title="Show email"
                  description="Display email on your profile"
                  checked={privacy.showEmail}
                  onChange={(next) => setPrivacy({ ...privacy, showEmail: next })}
                />
                <ToggleRow
                  title="Show phone"
                  description="Display phone on your profile"
                  checked={privacy.showPhone}
                  onChange={(next) => setPrivacy({ ...privacy, showPhone: next })}
                />
                <ToggleRow
                  title="Show location"
                  description="Display location on your profile"
                  checked={privacy.showLocation}
                  onChange={(next) => setPrivacy({ ...privacy, showLocation: next })}
                />
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-[13px] font-medium text-slate-900">Cookie & privacy links</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">Review consent and rights anytime.</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
                    <Link to="/cookie-preferences" className="font-medium text-sky-700 hover:text-sky-800">
                      Manage cookies
                    </Link>
                    <Link to="/privacy" className="font-medium text-sky-700 hover:text-sky-800">
                      Privacy policy
                    </Link>
                    <Link to="/privacy-rights" className="font-medium text-sky-700 hover:text-sky-800">
                      Privacy rights
                    </Link>
                  </div>
                </div>
                <ToggleRow
                  title="Privacy policy consent"
                  description="Record or withdraw consent to the privacy policy"
                  checked={privacyPolicyConsent ?? false}
                  onChange={(next) => handlePrivacyPolicyConsent(next)}
                  disabled={privacyConsentLoading}
                />
              </div>
            </PagePanel>
          )}

          {activeTab === 'security' && (
            <PagePanel accent="sky" title="Security">
              <div className="max-w-md space-y-4">
                <p className="text-[13px] text-slate-500">Update your password to keep the account secure.</p>
                <div>
                  <label className={labelClass}>Current password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className={fieldClass}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>New password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className={fieldClass}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm new password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className={fieldClass}
                    autoComplete="new-password"
                  />
                </div>
                <button type="button" onClick={handleChangePassword} className={btnPrimary}>
                  Change password
                </button>
              </div>
            </PagePanel>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <PagePanel accent="amber" title="Export data">
                <p className="text-[13px] text-slate-500">Download a copy of your account data.</p>
                <button type="button" onClick={handleExportData} className={`${btnSecondary} mt-4 border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100`}>
                  Export data
                </button>
              </PagePanel>
              <PagePanel accent="rose" title="Delete account">
                <p className="text-[13px] text-slate-500">
                  Permanently delete your account and associated data. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-rose-700 transition-colors"
                >
                  Delete account
                </button>
              </PagePanel>
            </div>
          )}
        </div>
      </div>

      {showAddKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold text-slate-900">Add API key</h3>
                <p className="mt-0.5 text-[12px] text-slate-500">Encrypted at rest · never stored in plain text</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddKeyModal(false);
                  setFormData({ provider: '', providerName: '', apiKey: '', selectedTasks: [] });
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  AI provider <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => {
                    const selected = topProviders.find((p) => p.provider === e.target.value);
                    setFormData({
                      ...formData,
                      provider: e.target.value,
                      providerName: selected?.name || '',
                    });
                  }}
                  className={fieldClass}
                >
                  <option value="">Select a provider…</option>
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
                {formData.provider === 'custom' && (
                  <input
                    type="text"
                    value={formData.providerName}
                    onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                    placeholder="Custom provider name"
                    className={`${fieldClass} mt-2`}
                  />
                )}
              </div>

              <div>
                <label className={labelClass}>
                  API key <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Paste your API key"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Assign tasks (optional)</label>
                <p className="mb-2 text-[12px] text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
                <select
                  multiple
                  value={formData.selectedTasks}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setFormData({ ...formData, selectedTasks: selected });
                  }}
                  className={`${fieldClass} min-h-[160px]`}
                  size={tasks.length > 0 ? Math.min(tasks.length, 8) : 4}
                >
                  {tasks.map((task) => (
                    <option key={task.type} value={task.type}>
                      {task.name} — {task.description}
                    </option>
                  ))}
                </select>
                {formData.selectedTasks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.selectedTasks.map((taskType) => {
                      const task = tasks.find((t) => t.type === taskType);
                      return (
                        <span
                          key={taskType}
                          className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[11px] text-sky-800"
                        >
                          {task?.name || taskType}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                selectedTasks: formData.selectedTasks.filter((t) => t !== taskType),
                              })
                            }
                            className="hover:text-sky-950"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddKeyModal(false);
                    setFormData({ provider: '', providerName: '', apiKey: '', selectedTasks: [] });
                  }}
                  className={`flex-1 ${btnSecondary}`}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleAddApiKey} className={`flex-1 ${btnPrimary}`}>
                  Add key
                  {formData.selectedTasks.length > 0
                    ? ` · ${formData.selectedTasks.length} task${formData.selectedTasks.length === 1 ? '' : 's'}`
                    : ''}
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
