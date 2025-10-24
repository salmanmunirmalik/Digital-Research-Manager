/**
 * Scientist Passport Page - Gamified Scientific Reputation System
 * REPRESENTS USER'S SCIENTIFIC CONTRIBUTIONS BASED ON GAMIFICATION
 * 
 * Features:
 * - Overall Scientific Reputation Score (0-1000)
 * - Badge System (Bronze, Silver, Gold Contributors, Community Hero, etc.)
 * - Contribution Categories (Negative Results, Protocols, Data Sharing, etc.)
 * - Community Impact Metrics (People Helped, Money Saved, Time Saved)
 * - Achievement Unlock System
 * - Visual Progress Indicators
 * - Peer Validation & Endorsements
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
  XMarkIcon,
  FireIcon,
  BookOpenIcon,
  DatabaseIcon,
  LightbulbIcon,
  HeartIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '../components/icons';

// Scientific Contribution Types
interface ScientificContribution {
  category: string;
  count: number;
  points: number;
  impact: string;
  badgeLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// Badge Interface
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number;
  maxProgress: number;
}

// Gamification Data
interface GamificationData {
  overallScore: number;
  badges: Badge[];
  contributions: ScientificContribution[];
  communityImpact: {
    peopleHelped: number;
    moneySaved: number;
    timeSaved: number;
    citationsReceived: number;
  };
  trustScores: {
    expertise: number;
    transparency: number;
    collaboration: number;
    knowledgeSharing: number;
  };
}

const ScientistPassportPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'passport' | 'contributions' | 'achievements' | 'skills' | 'references'>('passport');
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestReferenceModal, setShowRequestReferenceModal] = useState(false);
  
  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Simulate fetching gamification data (in real app, this would come from API)
      const mockData: GamificationData = {
        overallScore: 847,
        badges: [
          {
            id: 'bronze_transparency',
            name: 'Bronze Transparency Contributor',
            description: 'Shared 10 failed experiments',
            icon: '🥉',
            color: 'orange',
            earned: true,
            progress: 10,
            maxProgress: 10
          },
          {
            id: 'silver_transparency',
            name: 'Silver Transparency Contributor',
            description: 'Shared 50 failed experiments',
            icon: '🥈',
            color: 'gray',
            earned: true,
            progress: 52,
            maxProgress: 50
          },
          {
            id: 'gold_transparency',
            name: 'Gold Transparency Contributor',
            description: 'Shared 100 failed experiments',
            icon: '🥇',
            color: 'yellow',
            earned: false,
            progress: 52,
            maxProgress: 100
          },
          {
            id: 'community_hero',
            name: 'Community Hero',
            description: 'Saved $10,000+ for others',
            icon: '💎',
            color: 'purple',
            earned: true,
            progress: 18450,
            maxProgress: 10000
          },
          {
            id: 'certified_expert',
            name: 'Certified Expert',
            description: '5+ certifications',
            icon: '🎓',
            color: 'blue',
            earned: true,
            progress: 7,
            maxProgress: 5
          },
          {
            id: 'knowledge_champion',
            name: 'Knowledge Champion',
            description: 'Shared 20+ protocols',
            icon: '📚',
            color: 'green',
            earned: true,
            progress: 28,
            maxProgress: 20
          },
          {
            id: 'mentor',
            name: 'Mentor',
            description: 'Supervised 5+ theses',
            icon: '👨‍🏫',
            color: 'purple',
            earned: true,
            progress: 8,
            maxProgress: 5
          },
          {
            id: 'speaker',
            name: 'Speaker',
            description: 'Delivered 20+ talks',
            icon: '🎤',
            color: 'blue',
            earned: true,
            progress: 24,
            maxProgress: 20
          },
          {
            id: 'pioneer',
            name: 'Research Pioneer',
            description: 'Published 10+ peer-reviewed papers',
            icon: '🌟',
            color: 'indigo',
            earned: true,
            progress: 12,
            maxProgress: 10
          },
          {
            id: 'collaborator',
            name: 'Global Collaborator',
            description: 'Worked with 10+ international labs',
            icon: '🤝',
            color: 'teal',
            earned: true,
            progress: 13,
            maxProgress: 10
          }
        ],
        contributions: [
          { category: 'Negative Results Shared', count: 52, points: 260, impact: '247 people helped' },
          { category: 'Protocols Published', count: 28, points: 420, impact: '1,420 downloads' },
          { category: 'Data Shared Globally', count: 18, points: 450, impact: '89 citations' },
          { category: 'Experiments Completed', count: 156, points: 468, impact: 'Lab notebook entries' },
          { category: 'Help Forum Answers', count: 87, points: 435, impact: '234 helpful votes' },
          { category: 'Collaborations', count: 24, points: 480, impact: '24 successful projects' },
          { category: 'Publications', count: 12, points: 900, impact: 'Peer-reviewed papers' },
          { category: 'Conference Presentations', count: 24, points: 480, impact: 'Research dissemination' },
          { category: 'Open Source Contributions', count: 15, points: 375, impact: 'Community tools' }
        ],
        communityImpact: {
          peopleHelped: 247,
          moneySaved: 18450,
          timeSaved: 1240,
          citationsReceived: 89
        },
        trustScores: {
          expertise: 94,
          transparency: 96,
          collaboration: 91,
          knowledgeSharing: 93
        }
      };

      setGamificationData(mockData);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your Scientific Passport...</p>
        </div>
      </div>
    );
  }

  if (!gamificationData) {
    return <div>Error loading data</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-gray-900';
    if (score >= 600) return 'text-gray-800';
    if (score >= 400) return 'text-gray-700';
    if (score >= 200) return 'text-gray-600';
    return 'text-gray-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 900) return '🏆 Master Researcher';
    if (score >= 750) return '⭐ Expert Contributor';
    if (score >= 600) return '🎓 Advanced Researcher';
    if (score >= 400) return '🔬 Active Contributor';
    if (score >= 200) return '📚 Rising Researcher';
    return '🌱 New Researcher';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section - Minimalist Passport Design */}
        <div className="relative mb-6 overflow-hidden">
          {/* Passport Card */}
          <div className="bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 rounded-lg shadow-lg border-2 border-gray-200">
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100, 100, 100, 0.3) 1px, transparent 0)',
              backgroundSize: '30px 30px'
            }}></div>
            
            {/* Passport content */}
            <div className="relative p-6">
              {/* Top section - Title and Score */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-300">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center shadow-md">
                    <ShieldCheckIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 text-xs font-semibold tracking-wider uppercase">SCIENTIFIC PASSPORT</div>
                    <div className="text-gray-600 text-xs">Digital Research Manager</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600 text-xs font-medium mb-1">Reputation Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(gamificationData.overallScore)}`}>
                    {gamificationData.overallScore}
                  </div>
                  <div className="text-gray-600 text-xs font-medium mt-1">{getScoreBadge(gamificationData.overallScore)}</div>
                </div>
              </div>

              {/* Main content - Compact layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                {/* Photo section */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg p-2 border border-gray-300 shadow-sm">
                    <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden relative">
                      {/* Profile picture placeholder with professional look */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-700"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                          <span className="text-4xl font-bold text-indigo-700">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      {/* Professional decoration */}
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
                    </div>
                  </div>
                </div>

                {/* Personal details */}
                <div className="lg:col-span-2 space-y-2">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm">
                    <div className="text-gray-700 text-xs font-medium mb-1">NAME</div>
                    <div className="text-gray-900 text-base font-semibold">{user?.first_name} {user?.last_name}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm">
                      <div className="text-gray-700 text-xs font-medium mb-1">RESEARCHER ID</div>
                      <div className="text-gray-700 text-xs font-mono">{user?.id?.substring(0, 8)?.toUpperCase()}</div>
                      </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-300 shadow-sm">
                      <div className="text-gray-700 text-xs font-medium mb-1">CLASSIFICATION</div>
                      <div className="text-gray-700 text-xs font-semibold">{getScoreBadge(gamificationData.overallScore)}</div>
                    </div>
                  </div>
                </div>

                {/* Core stats grid */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-2">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-300 shadow-sm">
                    <div className="text-xl font-bold text-gray-900 mb-1">{gamificationData.communityImpact.peopleHelped}</div>
                    <div className="text-xs text-gray-600">People Helped</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-300 shadow-sm">
                    <div className="text-xl font-bold text-gray-900 mb-1">{gamificationData.communityImpact.citationsReceived}</div>
                    <div className="text-xs text-gray-600">Citations</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-300 shadow-sm">
                    <div className="text-xl font-bold text-gray-900 mb-1">{gamificationData.badges.filter(b => b.earned).length}</div>
                    <div className="text-xs text-gray-600">Badges</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-300 shadow-sm">
                    <div className="text-xl font-bold text-gray-900 mb-1">{gamificationData.communityImpact.timeSaved}h</div>
                    <div className="text-xs text-gray-600">Time Saved</div>
                  </div>
                </div>
              </div>
              
              {/* Footer with metadata */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-300">
                <div className="text-gray-700">
                  <div className="text-xs opacity-70 mb-1">Date of Issue</div>
                  <div className="text-xs font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="text-gray-700">
                  <div className="text-xs opacity-70 mb-1">Institution</div>
                  <div className="text-xs font-semibold">{user?.current_institution || 'Research Institution'}</div>
                </div>
                <div className="text-gray-700 text-right">
                  <div className="text-xs opacity-70 mb-1">Authority</div>
                  <div className="text-xs font-semibold">Digital Research Manager</div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'passport', label: 'Scientific Passport', icon: ShieldCheckIcon },
                { id: 'contributions', label: 'Contributions', icon: SparklesIcon },
                { id: 'achievements', label: 'Achievements', icon: TrophyIcon },
                { id: 'skills', label: 'Skills & Expertise', icon: BeakerIcon },
                { id: 'references', label: 'References', icon: DocumentTextIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-800 text-gray-900 bg-gray-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
        <div className="space-y-6">
          
          {/* Scientific Passport Tab */}
          {activeTab === 'passport' && (
            <div className="space-y-6">
              {/* Trust Scores */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Trust Scores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(gamificationData.trustScores).map(([key, value]) => (
                    <div key={key} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-2xl font-bold text-gray-800">{value}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-gray-700 to-gray-900 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${value}%` }}
                          ></div>
                      </div>
                        </div>
                  ))}
                </div>
              </div>

              {/* Community Impact */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Impact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200 shadow-sm">
                    <UsersIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{gamificationData.communityImpact.peopleHelped}</div>
                    <div className="text-sm text-gray-600">People Helped</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200 shadow-sm">
                    <DatabaseIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">${gamificationData.communityImpact.moneySaved.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Money Saved</div>
                </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200 shadow-sm">
                    <ClockIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{gamificationData.communityImpact.timeSaved}h</div>
                    <div className="text-sm text-gray-600">Time Saved</div>
                </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200 shadow-sm">
                    <BookOpenIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{gamificationData.communityImpact.citationsReceived}</div>
                    <div className="text-sm text-gray-600">Citations</div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Contributions Tab */}
          {activeTab === 'contributions' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Scientific Contributions</h2>
              <div className="space-y-4">
                {gamificationData.contributions.map((contribution, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold">{contribution.count}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{contribution.category}</h3>
                            <p className="text-sm text-gray-600">{contribution.impact}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-700">{contribution.points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {/* Earned Badges */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges Earned</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gamificationData.badges.filter(b => b.earned).map((badge) => (
                    <div key={badge.id} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                      <div className="text-center">
                        <div className="text-6xl mb-3">{badge.icon}</div>
                        <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                        <p className="text-sm text-gray-700">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Badges */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements in Progress</h2>
                <div className="space-y-4">
                  {gamificationData.badges.filter(b => !b.earned).map((badge) => (
                    <div key={badge.id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{badge.icon}</span>
                            <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 ml-8">{badge.description}</p>
                            </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-600">{badge.progress}/{badge.maxProgress}</div>
                          <div className="text-xs text-gray-500">{Math.round((badge.progress / badge.maxProgress) * 100)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-gray-700 to-gray-900 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills & Expertise</h2>
            <div className="text-center py-12">
                <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Skills management coming soon</p>
              </div>
            </div>
          )}

          {/* References Tab */}
          {activeTab === 'references' && (
            <div className="space-y-6">
              {/* Reference Requests */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Reference Requests</h2>
                  <button 
                    onClick={() => setShowRequestReferenceModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Request Reference</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          SJ
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Request from Dr. Sarah Johnson</h3>
                          <p className="text-sm text-gray-600">For: Postdoctoral Position Application</p>
                          <p className="text-xs text-gray-500">Relationship: Conference Collaborator</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-300">Pending</span>
                        <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          MC
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Request from Prof. Michael Chen</h3>
                          <p className="text-sm text-gray-600">For: Grant Application</p>
                          <p className="text-xs text-gray-500">Relationship: Research Collaborator</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-300">Completed</span>
                        <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          AR
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Request from Dr. Anna Rodriguez</h3>
                          <p className="text-sm text-gray-600">For: Academic Promotion</p>
                          <p className="text-xs text-gray-500">Relationship: PhD Supervisor</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-300">Pending</span>
                        <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
        </div>
        
              {/* Peer References */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Peer References</h2>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            DM
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Dr. David Martinez</h3>
                            <p className="text-sm text-gray-600">Professor, Stanford University</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mt-3 ml-15">"Excellent collaborative researcher with strong analytical skills. Highly recommend for postdoctoral positions."</p>
                        <div className="flex items-center space-x-4 mt-4">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">5.0</span>
                          </div>
                          <span className="text-sm text-gray-600">Context: Conference Collaborator</span>
                          <span className="text-sm text-gray-600">• 2 years working together</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            EL
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Dr. Emily Liu</h3>
                            <p className="text-sm text-gray-600">Associate Professor, MIT</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mt-3 ml-15">"Outstanding publication record and innovative research approach. Demonstrated exceptional mentorship capabilities."</p>
                        <div className="flex items-center space-x-4 mt-4">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">5.0</span>
                          </div>
                          <span className="text-sm text-gray-600">Context: PhD Supervisor</span>
                          <span className="text-sm text-gray-600">• 4 years of mentorship</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            RK
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Dr. Robert Kim</h3>
                            <p className="text-sm text-gray-600">Senior Researcher, NIH</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mt-3 ml-15">"Consistent contributor to open science. The protocols shared have been invaluable to our research."</p>
                        <div className="flex items-center space-x-4 mt-4">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                          <span className="text-sm text-gray-600">Context: Research Collaborator</span>
                          <span className="text-sm text-gray-600">• 1 year collaboration</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
          </div>

              {/* AI-Generated Reference Letters */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Generated Reference Letters</h2>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
          <div>
                        <h3 className="font-semibold text-gray-900">Comprehensive Reference Letter</h3>
                        <p className="text-sm text-gray-600">Generated from platform activity and peer references</p>
          </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Ready</span>
          </div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-gray-700 italic">
                        "Based on 12 months of platform activity, Dr. {user?.last_name} demonstrates exceptional research capabilities including protocol development, data analysis, and collaborative work..."
                      </p>
          </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Confidence: 92%</span>
                        <span>• Sources: 8 peer references</span>
                        <span>• Activity period: 12 months</span>
          </div>
                      <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                        Download PDF
            </button>
          </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Reference Modal */}
      {showRequestReferenceModal && (
        <RequestReferenceModal
          onClose={() => setShowRequestReferenceModal(false)}
          onSuccess={() => {
            setShowRequestReferenceModal(false);
            // Refresh data
            fetchGamificationData();
          }}
        />
      )}
    </div>
  );
};

// Request Reference Modal Component
const RequestReferenceModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    referenceGiverEmail: '',
    contextType: 'colleague',
    contextDetails: '',
    relationshipDescription: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post('/api/references/request-reference', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Reference request sent successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error requesting reference:', error);
      alert(error.response?.data?.error || 'Failed to send reference request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Request Reference</h3>
              <p className="text-sm text-gray-600 mt-1">Request a reference from a colleague or collaborator</p>
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Giver Email *
            </label>
            <input
                type="email"
              required
                value={formData.referenceGiverEmail}
                onChange={(e) => setFormData({ ...formData, referenceGiverEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="colleague@university.edu"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context Type *
            </label>
            <select
                required
                value={formData.contextType}
                onChange={(e) => setFormData({ ...formData, contextType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              >
                <option value="conference">Conference</option>
                <option value="colleague">Colleague</option>
                <option value="professor">Professor/Supervisor</option>
                <option value="boss">Boss/Manager</option>
                <option value="client">Client</option>
                <option value="collaborator">Collaborator</option>
            </select>
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context Details *
            </label>
            <input
              type="text"
              required
                value={formData.contextDetails}
                onChange={(e) => setFormData({ ...formData, contextDetails: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                placeholder="e.g., ICML 2023 Conference, Project XYZ"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Description *
            </label>
              <textarea
              required
                rows={3}
                value={formData.relationshipDescription}
                onChange={(e) => setFormData({ ...formData, relationshipDescription: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                placeholder="Describe how you worked together..."
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
            </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                placeholder="Add a personal message..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
                {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ScientistPassportPage;