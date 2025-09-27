import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  GlobeAltIcon,
  LinkIcon,
  ShareIcon,
  EyeIcon,
  LockClosedIcon,
  PencilIcon,
  StarIcon,
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  HeartIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '../components/icons';

interface UnifiedProfile {
  // Basic Info
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  specialization?: string;
  bio?: string;
  
  // Professional Info
  currentPosition?: string;
  currentInstitution?: string;
  researchInterests?: string[];
  expertiseAreas?: string[];
  languages?: string[];
  
  // Social Links
  websiteUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  orcidId?: string;
  googleScholarUrl?: string;
  
  // Location
  location?: string;
  timezone?: string;
  
  // Social Stats
  connectionsCount: number;
  followersCount: number;
  followingCount: number;
  profileViewsCount: number;
  
  // Privacy Settings
  profileVisibility: 'public' | 'connections_only' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showResearchInterests: boolean;
  showPublications: boolean;
  showConnectionsCount: boolean;
  
  // Social Preferences
  allowConnectionRequests: boolean;
  allowFollowRequests: boolean;
  allowProfileSharing: boolean;
  allowReferenceRequests: boolean;
  
  // Activity Status
  lastActiveAt: string;
  isOnline: boolean;
}

const UnifiedProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'social' | 'privacy' | 'security'>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileData, setProfileData] = useState<UnifiedProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    specialization: '',
    bio: '',
    currentPosition: '',
    currentInstitution: '',
    researchInterests: [],
    expertiseAreas: [],
    languages: [],
    websiteUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    orcidId: '',
    googleScholarUrl: '',
    location: '',
    timezone: '',
    connectionsCount: 0,
    followersCount: 0,
    followingCount: 0,
    profileViewsCount: 0,
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showResearchInterests: true,
    showPublications: true,
    showConnectionsCount: true,
    allowConnectionRequests: true,
    allowFollowRequests: true,
    allowProfileSharing: true,
    allowReferenceRequests: true,
    lastActiveAt: new Date().toISOString(),
    isOnline: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newInterest, setNewInterest] = useState('');
  const [newExpertise, setNewExpertise] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        department: user.department || '',
        specialization: user.specialization || '',
        bio: user.bio || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfileData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profileData.researchInterests?.includes(newInterest.trim())) {
      setProfileData(prev => ({
        ...prev,
        researchInterests: [...(prev.researchInterests || []), newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      researchInterests: prev.researchInterests?.filter(i => i !== interest) || []
    }));
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !profileData.expertiseAreas?.includes(newExpertise.trim())) {
      setProfileData(prev => ({
        ...prev,
        expertiseAreas: [...(prev.expertiseAreas || []), newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setProfileData(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas?.filter(e => e !== expertise) || []
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profileData.languages?.includes(newLanguage.trim())) {
      setProfileData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages?.filter(l => l !== language) || []
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Update basic profile data
      const basicData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        role: profileData.role,
        department: profileData.department,
        specialization: profileData.specialization,
        bio: profileData.bio
      };

      await updateProfile(basicData);
      
      // TODO: Update extended profile data via API
      // await updateExtendedProfile(profileData);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password. Please check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: UserIcon },
    { id: 'professional', name: 'Professional', icon: AcademicCapIcon },
    { id: 'social', name: 'Social Links', icon: ShareIcon },
    { id: 'privacy', name: 'Privacy', icon: LockClosedIcon },
    { id: 'security', name: 'Security', icon: EyeIcon }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name || 'User'}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-blue-600 capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="primary"
                className="flex items-center"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button
                onClick={() => navigate('/researcher-portfolio')}
                variant="secondary"
                className="flex items-center"
              >
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Research Portfolio
              </Button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          name="role"
                          value={profileData.role}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="student">Student</option>
                          <option value="researcher">Researcher</option>
                          <option value="principal_researcher">Principal Researcher</option>
                          <option value="co_supervisor">Co-Supervisor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          name="department"
                          value={profileData.department}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                        <input
                          type="text"
                          name="specialization"
                          value={profileData.specialization}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        variant="primary"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <p className="text-gray-900">{user.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <p className="text-gray-900">{user.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <p className="text-gray-900 capitalize">{user.role || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <p className="text-gray-900">{user.department || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <p className="text-gray-900">{user.specialization || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <p className="text-gray-900">{user.bio || 'No bio provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
                
                {/* Current Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                  <input
                    type="text"
                    name="currentPosition"
                    value={profileData.currentPosition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., PhD Student, Postdoc, Professor"
                  />
                </div>

                {/* Current Institution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Institution</label>
                  <input
                    type="text"
                    name="currentInstitution"
                    value={profileData.currentInstitution}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., University of Science"
                  />
                </div>

                {/* Research Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Research Interests</label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add research interest"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    />
                    <Button onClick={addInterest} variant="primary">
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.researchInterests?.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expertise Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Areas</label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add expertise area"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                    />
                    <Button onClick={addExpertise} variant="primary">
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.expertiseAreas?.map((expertise, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {expertise}
                        <button
                          type="button"
                          onClick={() => removeExpertise(expertise)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add language"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    />
                    <Button onClick={addLanguage} variant="primary">
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages?.map((language, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {language}
                        <button
                          type="button"
                          onClick={() => removeLanguage(language)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Social Links & Presence</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      name="websiteUrl"
                      value={profileData.websiteUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://your-website.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={profileData.linkedinUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://linkedin.com/in/yourname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                    <input
                      type="url"
                      name="twitterUrl"
                      value={profileData.twitterUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://twitter.com/yourname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ORCID ID</label>
                    <input
                      type="text"
                      name="orcidId"
                      value={profileData.orcidId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0000-0000-0000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Scholar</label>
                    <input
                      type="url"
                      name="googleScholarUrl"
                      value={profileData.googleScholarUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://scholar.google.com/citations?user=..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
                
                {/* Profile Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                  <select
                    name="profileVisibility"
                    value={profileData.profileVisibility}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public - Anyone can see your profile</option>
                    <option value="connections_only">Connections Only - Only your connections can see your profile</option>
                    <option value="private">Private - Only you can see your profile</option>
                  </select>
                </div>

                {/* Information Visibility */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Information Visibility</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="showEmail"
                        checked={profileData.showEmail}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show email address</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="showPhone"
                        checked={profileData.showPhone}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show phone number</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="showLocation"
                        checked={profileData.showLocation}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show location</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="showResearchInterests"
                        checked={profileData.showResearchInterests}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show research interests</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="showPublications"
                        checked={profileData.showPublications}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show publications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="showConnectionsCount"
                        checked={profileData.showConnectionsCount}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show connections count</span>
                    </label>
                  </div>
                </div>

                {/* Social Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Social Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowConnectionRequests"
                        checked={profileData.allowConnectionRequests}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow connection requests</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowFollowRequests"
                        checked={profileData.allowFollowRequests}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow follow requests</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowProfileSharing"
                        checked={profileData.allowProfileSharing}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow profile sharing</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowReferenceRequests"
                        checked={profileData.allowReferenceRequests}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow reference requests</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                
                {isChangingPassword ? (
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        variant="primary"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Password</h3>
                        <p className="text-gray-600">Change your account password</p>
                      </div>
                      <Button
                        onClick={() => setIsChangingPassword(true)}
                        variant="primary"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfilePage;
