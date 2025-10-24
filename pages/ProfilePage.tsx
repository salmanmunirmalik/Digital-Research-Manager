import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UserIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  BookOpenIcon,
  TrophyIcon,
  LinkIcon,
  LightBulbIcon,
  PencilIcon,
  CalendarIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  AtSymbolIcon,
  GlobeAltIcon as WorldIcon,
  EnvelopeIcon,
  SparklesIcon,
  CpuChipIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Publication {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
  doi?: string;
  arxiv_id?: string;
  keywords: string[];
  research_domains: string[];
  citation_count: number;
  impact_factor?: number;
}

interface ResearcherProfile {
  institution?: string;
  department?: string;
  position?: string;
  research_interests: string[];
  expertise_areas: string[];
  research_domains: string[];
  years_of_experience?: number;
  h_index: number;
  total_citations: number;
  total_publications: number;
  current_projects: string[];
  previous_institutions: string[];
  awards: string[];
  grants: string[];
  languages: string[];
  orcid_id?: string;
  google_scholar_id?: string;
  researchgate_id?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  lab_website?: string;
  collaboration_preferences?: string;
  research_philosophy?: string;
  mentorship_style?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'publications' | 'research' | 'social'>('overview');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [showAddPublicationModal, setShowAddPublicationModal] = useState(false);
  const [showImportORCIDModal, setShowImportORCIDModal] = useState(false);
  const [orcidId, setOrcidId] = useState('');
  const [editing, setEditing] = useState(false);
  
  // Form states
  const [publicationForm, setPublicationForm] = useState({
    title: '',
    abstract: '',
    thoughts: ''
  });

  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    orcid_id: '',
    google_scholar_id: '',
    researchgate_id: '',
    linkedin_url: '',
    twitter_handle: '',
    lab_website: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchPublications();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/researcher-portfolio/profiles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.profile) {
        setProfile(response.data.profile);
        setResearchInterests(response.data.profile.research_interests || []);
        setAwards(response.data.profile.awards || []);
        setGrants(response.data.profile.grants || []);
        setSocialLinks({
          orcid_id: response.data.profile.orcid_id || '',
          google_scholar_id: response.data.profile.google_scholar_id || '',
          researchgate_id: response.data.profile.researchgate_id || '',
          linkedin_url: response.data.profile.linkedin_url || '',
          twitter_handle: response.data.profile.twitter_handle || '',
          lab_website: response.data.profile.lab_website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Initialize with empty data
      setProfile({
        research_interests: [],
        expertise_areas: [],
        research_domains: [],
        h_index: 0,
        total_citations: 0,
        total_publications: 0,
        current_projects: [],
        previous_institutions: [],
        awards: [],
        grants: [],
        languages: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/researcher-portfolio/publications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.publications) {
        setPublications(response.data.publications);
      }
    } catch (error) {
      console.error('Error fetching publications:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/researcher-portfolio/profiles', {
        ...profile,
        research_interests: researchInterests,
        awards: awards,
        grants: grants,
        ...socialLinks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Profile saved successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const addPublication = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/researcher-portfolio/publications/upload', {
        title: publicationForm.title,
        abstract: publicationForm.abstract,
        thoughts: publicationForm.thoughts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Publication added successfully!');
      setShowAddPublicationModal(false);
      setPublicationForm({
        title: '',
        abstract: '',
        thoughts: ''
      });
      fetchPublications();
    } catch (error) {
      console.error('Error adding publication:', error);
      alert('Error adding publication');
    }
  };

  const importFromORCID = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/researcher-portfolio/publications/fetch-by-orcid', {
        orcid: orcidId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Publications imported successfully!');
      setShowImportORCIDModal(false);
      setOrcidId('');
      fetchPublications();
    } catch (error) {
      console.error('Error importing from ORCID:', error);
      alert('Error importing from ORCID');
    }
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setResearchInterests([...researchInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (index: number) => {
    setResearchInterests(researchInterests.filter((_, i) => i !== index));
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header Banner */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50/30 px-8 py-12 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-28 h-28 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center shadow-xl ring-4 ring-gray-100">
                    <CpuChipIcon className="w-14 h-14 text-yellow-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h1>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-300">AI Training Active</span>
                  </div>
                  <p className="text-gray-600 text-lg mb-3">{profile?.position || 'Researcher'}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    {profile?.institution && (
                      <span className="flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                        {profile.institution}
                      </span>
                    )}
                    {profile?.department && (
                      <span className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-2" />
                        {profile.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all shadow-sm"
                >
                  <PencilIcon className="w-5 h-5" />
                  <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
                {editing && (
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-white text-indigo-900 rounded-lg hover:bg-gray-100 transition-all shadow-lg disabled:opacity-50 font-medium"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* AI Training Progress Bar */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Personal AI Training Progress</p>
                  <p className="text-xs text-gray-600">Your AI learns from your publications, research interests, and insights</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-gray-600">Training Data</p>
                  <p className="text-lg font-bold text-indigo-600">{publications.length + researchInterests.length} items</p>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((publications.length + researchInterests.length) / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-200 p-1 bg-gradient-to-br from-gray-50/50 to-white">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: UserIcon, description: 'Basic info for AI context' },
              { id: 'publications', label: 'Publications', icon: BookOpenIcon, description: 'Train AI with your work' },
              { id: 'research', label: 'Research Interests', icon: LightBulbIcon, description: 'Define your domain' },
              { id: 'social', label: 'Social Links', icon: LinkIcon, description: 'Connect your profiles' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center space-y-1 py-3 px-4 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{tab.label}</span>
                <span className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>{tab.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                    {editing && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Editing</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Institution</label>
                      <input
                        type="text"
                        value={profile?.institution || ''}
                        onChange={(e) => setProfile({ ...profile!, institution: e.target.value })}
                        disabled={!editing}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                          editing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white' 
                            : 'border-transparent bg-gray-50'
                        }`}
                        placeholder="University name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={profile?.department || ''}
                        onChange={(e) => setProfile({ ...profile!, department: e.target.value })}
                        disabled={!editing}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                          editing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white' 
                            : 'border-transparent bg-gray-50'
                        }`}
                        placeholder="Department name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={profile?.position || ''}
                        onChange={(e) => setProfile({ ...profile!, position: e.target.value })}
                        disabled={!editing}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                          editing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white' 
                            : 'border-transparent bg-gray-50'
                        }`}
                        placeholder="e.g., Professor, PhD Student"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={profile?.years_of_experience || ''}
                        onChange={(e) => setProfile({ ...profile!, years_of_experience: parseInt(e.target.value) || 0 })}
                        disabled={!editing}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                          editing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white' 
                            : 'border-transparent bg-gray-50'
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Research Philosophy */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Research Philosophy</h2>
                  <textarea
                    value={profile?.research_philosophy || ''}
                    onChange={(e) => setProfile({ ...profile!, research_philosophy: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      editing 
                        ? 'border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white' 
                        : 'border-transparent bg-gray-50'
                    }`}
                    rows={4}
                    placeholder="Describe your research philosophy..."
                  />
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Current Projects */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Current Projects</h2>
                  <div className="space-y-3">
                    {(profile?.current_projects || []).length > 0 ? (
                      profile.current_projects.map((project, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">{project}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">No projects added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Publications Tab */}
          {activeTab === 'publications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Publications</h2>
                  <p className="text-sm text-gray-600 mt-1">Share your work to train your personal AI</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddPublicationModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all shadow-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Publication</span>
                  </button>
                </div>
              </div>

              {publications.length > 0 ? (
                <div className="space-y-4">
                  {publications.map((pub) => (
                    <div key={pub.id} className="p-5 border border-gray-200 rounded-lg hover:border-gray-300 transition-all bg-white">
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">{pub.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{pub.authors.join(', ')}</p>
                      {pub.journal && (
                        <p className="text-sm text-gray-700 mb-3 font-medium">{pub.journal}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm">
                        {pub.citation_count > 0 && (
                          <span className="flex items-center text-gray-600">
                            <StarIcon className="w-4 h-4 mr-1" />
                            {pub.citation_count} citations
                          </span>
                        )}
                        {pub.doi && (
                          <span className="flex items-center text-gray-600">
                            <LinkIcon className="w-4 h-4 mr-1" />
                            {pub.doi}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg mb-2">No publications added yet</p>
                  <p className="text-sm text-gray-500">Add publications manually or import from ORCID</p>
                </div>
              )}
            </div>
          )}

          {/* Research Interests Tab */}
          {activeTab === 'research' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Research Interests</h2>
                <p className="text-sm text-gray-600">Define your research domain to help the AI understand your expertise</p>
              </div>
              
              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Add research interest (e.g., Machine Learning, Bioinformatics)"
                  />
                  <button
                    onClick={addInterest}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {researchInterests.map((interest, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="font-medium">{interest}</span>
                    <button
                      onClick={() => removeInterest(index)}
                      className="hover:bg-white/20 rounded p-0.5 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ORCID ID</label>
                  <input
                    type="text"
                    value={socialLinks.orcid_id}
                    onChange={(e) => setSocialLinks({ ...socialLinks, orcid_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="0000-0000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Google Scholar ID</label>
                  <input
                    type="text"
                    value={socialLinks.google_scholar_id}
                    onChange={(e) => setSocialLinks({ ...socialLinks, google_scholar_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Google Scholar ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ResearchGate ID</label>
                  <input
                    type="text"
                    value={socialLinks.researchgate_id}
                    onChange={(e) => setSocialLinks({ ...socialLinks, researchgate_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="ResearchGate ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                  <input
                    type="text"
                    value={socialLinks.linkedin_url}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin_url: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter Handle</label>
                  <input
                    type="text"
                    value={socialLinks.twitter_handle}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter_handle: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lab Website</label>
                  <input
                    type="text"
                    value={socialLinks.lab_website}
                    onChange={(e) => setSocialLinks({ ...socialLinks, lab_website: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Publication Modal */}
        {showAddPublicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Publication</h2>
                  <p className="text-sm text-gray-600 mt-1">Help train your personal AI by sharing your research</p>
                </div>
                <button
                  onClick={() => setShowAddPublicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={publicationForm.title}
                    onChange={(e) => setPublicationForm({ ...publicationForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Publication title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Abstract *</label>
                  <textarea
                    value={publicationForm.abstract}
                    onChange={(e) => setPublicationForm({ ...publicationForm, abstract: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={6}
                    placeholder="Enter the abstract of your publication..."
                  />
                  <p className="text-xs text-gray-500 mt-1">This helps the AI understand your research domain and interests</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Thoughts & Insights</label>
                  <textarea
                    value={publicationForm.thoughts}
                    onChange={(e) => setPublicationForm({ ...publicationForm, thoughts: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={6}
                    placeholder="Share your thoughts, insights, methodology, or any reflections on this work..."
                  />
                  <p className="text-xs text-gray-500 mt-1">This helps the AI understand your thinking style and approach</p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddPublicationModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPublication}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Add Publication
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import ORCID Modal */}
        {showImportORCIDModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Import from ORCID</h2>
                <button
                  onClick={() => setShowImportORCIDModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ORCID ID</label>
                  <input
                    type="text"
                    value={orcidId}
                    onChange={(e) => setOrcidId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="0000-0000-0000-0000"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowImportORCIDModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={importFromORCID}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
