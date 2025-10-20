/**
 * Scientist Passport Page
 * Comprehensive researcher profile with skills, certifications, availability, and endorsements
 * Revolutionary feature: Enhanced profiles for collaboration, speaking, and services
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  UserIcon,
  AcademicCapIcon,
  BeakerIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  BriefcaseIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon,
  XMarkIcon
} from '../components/icons';

// Types
interface TechnicalSkill {
  id: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  last_used: string;
  is_verified: boolean;
  endorsements_count: number;
}

interface Certification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  certification_type: string;
  issue_date: string;
  expiry_date?: string;
  is_current: boolean;
}

interface Availability {
  open_for_collaboration: boolean;
  collaboration_types: string[];
  available_as_keynote_speaker: boolean;
  available_for_workshops: boolean;
  available_as_service_provider: boolean;
  service_types: string[];
  available_as_consultant: boolean;
  consulting_domains: string[];
  hourly_rate?: number;
  rate_currency: string;
  travel_willingness: string;
  currently_available: boolean;
}

interface SpeakingProfile {
  total_keynotes_delivered: number;
  total_conference_presentations: number;
  total_invited_talks: number;
  speaker_bio?: string;
  speaking_topics: string[];
  target_audience_levels: string[];
  requires_speaker_fee: boolean;
  speaker_fee_range_min?: number;
  speaker_fee_range_max?: number;
  average_rating: number;
}

interface PlatformScores {
  expertise_score: number;
  activity_score: number;
  reliability_score: number;
  overall_trust_score: number;
  badges_earned: string[];
}

const ScientistPassportPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'certifications' | 'availability' | 'speaking' | 'endorsements'>('overview');
  
  // State
  const [skills, setSkills] = useState<TechnicalSkill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [speakingProfile, setSpeakingProfile] = useState<SpeakingProfile | null>(null);
  const [platformScores, setPlatformScores] = useState<PlatformScores | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddCertification, setShowAddCertification] = useState(false);
  const [showEditAvailability, setShowEditAvailability] = useState(false);
  const [showEditSpeaking, setShowEditSpeaking] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [skillsRes, certsRes, availRes, speakingRes, scoresRes] = await Promise.all([
        axios.get('/api/scientist-passport/skills', { headers }),
        axios.get('/api/scientist-passport/certifications', { headers }),
        axios.get('/api/scientist-passport/availability', { headers }),
        axios.get('/api/scientist-passport/speaking-profile', { headers }),
        axios.get('/api/scientist-passport/platform-scores', { headers })
      ]);

      setSkills(skillsRes.data);
      setCertifications(certsRes.data);
      setAvailability(availRes.data);
      setSpeakingProfile(speakingRes.data);
      setPlatformScores(scoresRes.data);
    } catch (error) {
      console.error('Error fetching passport data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add skill
  const handleAddSkill = async (skillData: Partial<TechnicalSkill>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/scientist-passport/skills', skillData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkills([...skills, response.data]);
      setShowAddSkill(false);
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  // Delete skill
  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to remove this skill?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/scientist-passport/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkills(skills.filter(s => s.id !== skillId));
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  // Add certification
  const handleAddCertification = async (certData: Partial<Certification>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/scientist-passport/certifications', certData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertifications([...certifications, response.data]);
      setShowAddCertification(false);
    } catch (error) {
      console.error('Error adding certification:', error);
    }
  };

  // Update availability
  const handleUpdateAvailability = async (availData: Partial<Availability>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/scientist-passport/availability', availData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailability(response.data);
      setShowEditAvailability(false);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your Scientist Passport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Profile Summary */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </h1>
                  <p className="text-gray-600">{user?.current_position || 'Researcher'}</p>
                  <p className="text-gray-500 text-sm">{user?.current_institution || 'Institution'}</p>
                  
                  {/* Trust Score Badge */}
                  {platformScores && platformScores.overall_trust_score > 0 && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-blue-100 px-3 py-1 rounded-full">
                        <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Trust Score: {platformScores.overall_trust_score}/100
                        </span>
                      </div>
                      {platformScores.badges_earned?.length > 0 && (
                        <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
                          <TrophyIcon className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">
                            {platformScores.badges_earned.length} Badges
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
                  <div className="text-xs text-gray-500">Skills</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{certifications.length}</div>
                  <div className="text-xs text-gray-500">Certifications</div>
                </div>
                {speakingProfile && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {speakingProfile.total_keynotes_delivered + speakingProfile.total_conference_presentations}
                    </div>
                    <div className="text-xs text-gray-500">Talks</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: SparklesIcon },
                { id: 'skills', label: 'Skills & Expertise', icon: BeakerIcon },
                { id: 'certifications', label: 'Certifications', icon: AcademicCapIcon },
                { id: 'availability', label: 'Availability', icon: ClockIcon },
                { id: 'speaking', label: 'Speaking', icon: MicrophoneIcon },
                { id: 'endorsements', label: 'Endorsements', icon: UsersIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Expertise Score */}
                  {platformScores && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Expertise</span>
                          <BeakerIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{platformScores.expertise_score}/100</div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${platformScores.expertise_score}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Activity</span>
                          <SparklesIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">{platformScores.activity_score}/100</div>
                        <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${platformScores.activity_score}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Reliability</span>
                          <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{platformScores.reliability_score}/100</div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${platformScores.reliability_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Availability Summary */}
              {availability && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Availability</h3>
                  <div className="flex flex-wrap gap-2">
                    {availability.open_for_collaboration && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        Open for Collaboration
                      </span>
                    )}
                    {availability.available_as_keynote_speaker && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <MicrophoneIcon className="w-4 h-4 mr-1" />
                        Available for Speaking
                      </span>
                    )}
                    {availability.available_as_service_provider && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <BriefcaseIcon className="w-4 h-4 mr-1" />
                        Offering Services
                      </span>
                    )}
                    {availability.available_as_consultant && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <AcademicCapIcon className="w-4 h-4 mr-1" />
                        Available for Consulting
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Top Skills Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Top Skills</h3>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 10).map((skill) => (
                    <div
                      key={skill.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {skill.skill_name}
                      {skill.is_verified && (
                        <CheckCircleIcon className="w-4 h-4 ml-1 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Technical Skills</h2>
                <button
                  onClick={() => setShowAddSkill(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Skill</span>
                </button>
              </div>

              {skills.length === 0 ? (
                <div className="text-center py-12">
                  <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No skills added yet</h3>
                  <p className="text-gray-600 mb-4">Start building your profile by adding your technical skills</p>
                  <button
                    onClick={() => setShowAddSkill(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Your First Skill
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{skill.skill_name}</h3>
                            {skill.is_verified && (
                              <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{skill.skill_category}</p>
                          
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${
                              skill.proficiency_level === 'expert' ? 'bg-purple-100 text-purple-700' :
                              skill.proficiency_level === 'advanced' ? 'bg-blue-100 text-blue-700' :
                              skill.proficiency_level === 'intermediate' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {skill.proficiency_level}
                            </span>
                            <span>{skill.years_experience} years</span>
                          </div>
                          
                          {skill.endorsements_count > 0 && (
                            <div className="mt-2 flex items-center space-x-1 text-sm text-gray-600">
                              <StarIcon className="w-4 h-4 text-yellow-500" />
                              <span>{skill.endorsements_count} endorsements</span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Professional Certifications</h2>
                <button
                  onClick={() => setShowAddCertification(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Certification</span>
                </button>
              </div>

              {certifications.length === 0 ? (
                <div className="text-center py-12">
                  <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications added yet</h3>
                  <p className="text-gray-600 mb-4">Add your professional certifications to showcase your credentials</p>
                  <button
                    onClick={() => setShowAddCertification(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Your First Certification
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{cert.certification_name}</h3>
                            {cert.is_current && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                            </div>
                            {cert.expiry_date && (
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other tabs would be implemented similarly... */}
          {activeTab === 'availability' && (
            <div className="text-center py-12">
              <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Availability Settings</h3>
              <p className="text-gray-600 mb-4">Coming soon: Manage your availability for collaboration, speaking, and services</p>
            </div>
          )}

          {activeTab === 'speaking' && (
            <div className="text-center py-12">
              <MicrophoneIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Speaking Profile</h3>
              <p className="text-gray-600 mb-4">Coming soon: Manage your speaking engagements and profile</p>
            </div>
          )}

          {activeTab === 'endorsements' && (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Peer Endorsements</h3>
              <p className="text-gray-600 mb-4">Coming soon: View and manage endorsements from colleagues</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Skill Modal */}
      {showAddSkill && (
        <AddSkillModal
          onClose={() => setShowAddSkill(false)}
          onAdd={handleAddSkill}
        />
      )}

      {/* Add Certification Modal */}
      {showAddCertification && (
        <AddCertificationModal
          onClose={() => setShowAddCertification(false)}
          onAdd={handleAddCertification}
        />
      )}
    </div>
  );
};

// Add Skill Modal Component
const AddSkillModal: React.FC<{
  onClose: () => void;
  onAdd: (skill: Partial<TechnicalSkill>) => void;
}> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    skill_name: '',
    skill_category: 'laboratory_technique',
    proficiency_level: 'intermediate' as const,
    years_experience: 0,
    last_used: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Technical Skill</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Name *
            </label>
            <input
              type="text"
              required
              value={formData.skill_name}
              onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., PCR, Western Blot, Python"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.skill_category}
              onChange={(e) => setFormData({ ...formData, skill_category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="laboratory_technique">Laboratory Technique</option>
              <option value="software">Software</option>
              <option value="analytical_method">Analytical Method</option>
              <option value="instrumentation">Instrumentation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proficiency Level
            </label>
            <select
              value={formData.proficiency_level}
              onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Certification Modal Component
const AddCertificationModal: React.FC<{
  onClose: () => void;
  onAdd: (cert: Partial<Certification>) => void;
}> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    certification_name: '',
    issuing_organization: '',
    certification_type: 'technical',
    issue_date: '',
    expiry_date: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Certification</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certification Name *
            </label>
            <input
              type="text"
              required
              value={formData.certification_name}
              onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Lab Safety Certification"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issuing Organization *
            </label>
            <input
              type="text"
              required
              value={formData.issuing_organization}
              onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., OSHA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date *
            </label>
            <input
              type="date"
              required
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Certification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScientistPassportPage;

