import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  TrendingUpIcon,
  BookOpenIcon,
  BeakerIcon,
  ChartBarIcon,
  UsersIcon,
  PlusIcon,
  ArrowRightIcon,
  SparklesIcon,
  BrainIcon,
  TargetIcon,
  BellIcon,
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardListIcon,
  ExclamationTriangleIcon,
  LightbulbIcon,
  CalendarDaysIcon,
  DocumentIcon,
  PresentationChartLineIcon
} from '../components/icons';
import { 
  ResearchProject,
  ResearchMetrics,
  ResearchDeadline,
  ResearchActivity,
  ResearchInsight,
  Collaboration,
  ResearchTrend
} from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // Core research data
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([]);
  const [researchMetrics, setResearchMetrics] = useState<ResearchMetrics>({
    totalProjects: 0,
    activeExperiments: 0,
    publicationsThisYear: 0,
    citationsTotal: 0,
    collaborationScore: 0,
    productivityTrend: 'stable',
    fundingSecured: 0,
    grantApplications: 0,
    conferencePresentations: 0
  });
  
  // Essential dashboard elements
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<ResearchDeadline[]>([]);
  const [recentActivity, setRecentActivity] = useState<ResearchActivity[]>([]);
  const [smartInsights, setSmartInsights] = useState<ResearchInsight[]>([]);
  const [activeCollaborations, setActiveCollaborations] = useState<Collaboration[]>([]);
  const [researchTrends, setResearchTrends] = useState<ResearchTrend[]>([]);

  // Load mock research data
  useEffect(() => {
    // Mock research projects
    setResearchProjects([
      {
        id: '1',
        title: 'CRISPR Gene Editing in Cancer Cells',
        status: 'active',
        progress: 75,
        team: ['Dr. Smith', 'Sarah Chen', 'Mike Johnson'],
        deadline: '2024-06-15',
        priority: 'high',
        publications: 2,
        citations: 45,
        funding: {
          amount: 250000,
          source: 'NIH',
          endDate: '2024-12-31'
        },
        milestones: [
          { id: '1', title: 'Initial experiments', dueDate: '2024-03-15', completed: true },
          { id: '2', title: 'Data analysis', dueDate: '2024-05-15', completed: false },
          { id: '3', title: 'Paper submission', dueDate: '2024-06-15', completed: false }
        ]
      },
      {
        id: '2',
        title: 'Machine Learning Drug Discovery',
        status: 'analysis',
        progress: 60,
        team: ['Dr. Brown', 'Alex Kim'],
        deadline: '2024-08-30',
        priority: 'medium',
        publications: 1,
        citations: 23,
        funding: {
          amount: 180000,
          source: 'NSF',
          endDate: '2024-10-31'
        },
        milestones: [
          { id: '1', title: 'Algorithm development', dueDate: '2024-02-28', completed: true },
          { id: '2', title: 'Validation studies', dueDate: '2024-06-30', completed: false },
          { id: '3', title: 'Patent application', dueDate: '2024-08-30', completed: false }
        ]
      },
      {
        id: '3',
        title: 'Biomarker Validation Study',
        status: 'writing',
        progress: 90,
        team: ['Dr. Wilson', 'Lisa Park'],
        deadline: '2024-05-20',
        priority: 'high',
        publications: 0,
        citations: 0,
        funding: {
          amount: 120000,
          source: 'Industry Partnership',
          endDate: '2024-07-31'
        },
        milestones: [
          { id: '1', title: 'Sample collection', dueDate: '2024-01-31', completed: true },
          { id: '2', title: 'Analysis complete', dueDate: '2024-04-15', completed: true },
          { id: '3', title: 'Manuscript draft', dueDate: '2024-05-20', completed: false }
        ]
      }
    ]);

    // Mock research metrics
    setResearchMetrics({
      totalProjects: 8,
      activeExperiments: 12,
      publicationsThisYear: 5,
      citationsTotal: 156,
      collaborationScore: 87,
      productivityTrend: 'up',
      fundingSecured: 1250000,
      grantApplications: 3,
      conferencePresentations: 7
    });

    // Mock upcoming deadlines
    setUpcomingDeadlines([
      {
        id: '1',
        title: 'NIH Grant Proposal Submission',
        type: 'grant',
        deadline: '2024-04-15',
        priority: 'high',
        description: 'R01 application for cancer research funding',
        status: 'upcoming'
      },
      {
        id: '2',
        title: 'Nature Paper Review Deadline',
        type: 'publication',
        deadline: '2024-04-22',
        priority: 'high',
        description: 'Response to reviewer comments',
        status: 'upcoming'
      },
      {
        id: '3',
        title: 'Conference Abstract Submission',
        type: 'conference',
        deadline: '2024-05-01',
        priority: 'medium',
        description: 'ASCO Annual Meeting abstract',
        status: 'upcoming'
      },
      {
        id: '4',
        title: 'Thesis Defense',
        type: 'thesis',
        deadline: '2024-06-15',
        priority: 'high',
        description: 'PhD thesis defense for Sarah Chen',
        status: 'upcoming'
      }
    ]);

    // Mock recent activity
    setRecentActivity([
      {
        id: '1',
        type: 'experiment',
        title: 'Completed Phase 2 CRISPR experiments',
        description: 'Successfully completed gene editing experiments with 85% efficiency',
        timestamp: '2 hours ago',
        user: 'Sarah Chen',
        relatedProject: '1',
        impact: 'high'
      },
      {
        id: '2',
        type: 'publication',
        title: 'Paper accepted in Nature Biotechnology',
        description: 'CRISPR-based cancer therapy paper accepted for publication',
        timestamp: '1 day ago',
        user: 'Dr. Smith',
        relatedProject: '1',
        impact: 'high'
      },
      {
        id: '3',
        type: 'collaboration',
        title: 'New collaboration with MIT initiated',
        description: 'Partnership for machine learning drug discovery project',
        timestamp: '3 days ago',
        user: 'Dr. Brown',
        relatedProject: '2',
        impact: 'medium'
      },
      {
        id: '4',
        type: 'grant',
        title: 'NSF Grant Application Submitted',
        description: 'Successfully submitted $500K NSF grant application',
        timestamp: '1 week ago',
        user: 'Dr. Wilson',
        impact: 'high'
      }
    ]);

    // Mock smart insights
    setSmartInsights([
      {
        id: '1',
        type: 'opportunity',
        title: 'Grant Opportunity Alert',
        description: 'NSF has a new call for proposals matching your CRISPR research area. Deadline in 3 weeks.',
        action: { label: 'View Details', route: '/grants', type: 'navigate' },
        priority: 'high',
        confidence: 92,
        category: 'grants',
        expiresAt: '2024-04-30'
      },
      {
        id: '2',
        type: 'achievement',
        title: 'Productivity Milestone',
        description: 'You\'ve published 5 papers this year - 25% above lab average!',
        priority: 'medium',
        confidence: 100,
        category: 'productivity'
      },
      {
        id: '3',
        type: 'suggestion',
        title: 'Collaboration Opportunity',
        description: 'Dr. Johnson from Stanford is working on similar CRISPR research. Consider reaching out.',
        action: { label: 'Connect', route: '/collaborations', type: 'navigate' },
        priority: 'medium',
        confidence: 78,
        category: 'collaborations'
      },
      {
        id: '4',
        type: 'warning',
        title: 'Deadline Reminder',
        description: 'NIH grant proposal due in 5 days. Consider reviewing with team.',
        priority: 'high',
        confidence: 100,
        category: 'grants',
        expiresAt: '2024-04-15'
      }
    ]);

    // Mock active collaborations
    setActiveCollaborations([
      {
        id: '1',
        title: 'CRISPR Cancer Therapy Consortium',
        type: 'external',
        status: 'active',
        partners: [
          { name: 'Dr. Johnson', institution: 'Stanford', role: 'Co-PI', contact: 'johnson@stanford.edu' },
          { name: 'Dr. Lee', institution: 'MIT', role: 'Collaborator', contact: 'lee@mit.edu' }
        ],
        startDate: '2023-09-01',
        endDate: '2025-08-31',
        description: 'Multi-institutional collaboration for CRISPR-based cancer therapies',
        outcomes: ['2 publications', '1 patent filed', '3 conference presentations'],
        publications: 2,
        funding: 500000
      },
      {
        id: '2',
        title: 'Industry Partnership - Drug Discovery',
        type: 'industry',
        status: 'active',
        partners: [
          { name: 'Dr. Martinez', institution: 'PharmaCorp', role: 'Industry Partner', contact: 'martinez@pharmacorp.com' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        description: 'Collaborative drug discovery using machine learning approaches',
        outcomes: ['1 patent application', '2 publications in progress'],
        publications: 0,
        funding: 200000
      }
    ]);

    // Mock research trends
    setResearchTrends([
      {
        id: '1',
        title: 'AI-Driven Drug Discovery',
        category: 'technology',
        description: 'Machine learning approaches are revolutionizing drug discovery with 40% faster lead identification',
        impact: 'high',
        timeframe: 'medium',
        relevance: 95,
        sources: ['Nature Reviews Drug Discovery', 'Science', 'Cell'],
        recommendations: ['Consider integrating AI tools', 'Partner with ML experts', 'Apply for AI-focused grants']
      },
      {
        id: '2',
        title: 'CRISPR Clinical Trials',
        category: 'methodology',
        description: 'CRISPR therapies are entering Phase III trials with promising safety profiles',
        impact: 'high',
        timeframe: 'short',
        relevance: 88,
        sources: ['New England Journal of Medicine', 'Nature Medicine'],
        recommendations: ['Monitor clinical trial results', 'Consider translational research', 'Network with clinical researchers']
      }
    ]);
  }, []);

  // Memoized computed values for performance
  const urgentDeadlines = useMemo(() => 
    upcomingDeadlines.filter(d => d.priority === 'high' && d.status === 'upcoming').slice(0, 3),
    [upcomingDeadlines]
  );

  const activeProjects = useMemo(() => 
    researchProjects.filter(p => p.status === 'active'),
    [researchProjects]
  );

  const highImpactActivity = useMemo(() => 
    recentActivity.filter(a => a.impact === 'high').slice(0, 3),
    [recentActivity]
  );

  const highPriorityInsights = useMemo(() => 
    smartInsights.filter(i => i.priority === 'high').slice(0, 2),
    [smartInsights]
  );

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-yellow-100 text-yellow-800';
      case 'writing': return 'bg-purple-100 text-purple-800';
      case 'published': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TargetIcon className="w-5 h-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'achievement': return <SparklesIcon className="w-5 h-5 text-blue-500" />;
      case 'suggestion': return <BrainIcon className="w-5 h-5 text-purple-500" />;
      case 'trend': return <TrendingUpIcon className="w-5 h-5 text-indigo-500" />;
      default: return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'experiment': return <BeakerIcon className="w-4 h-4 text-blue-600" />;
      case 'publication': return <DocumentTextIcon className="w-4 h-4 text-green-600" />;
      case 'collaboration': return <UserGroupIcon className="w-4 h-4 text-purple-600" />;
      case 'milestone': return <CheckCircleIcon className="w-4 h-4 text-orange-600" />;
      case 'grant': return <AcademicCapIcon className="w-4 h-4 text-red-600" />;
      case 'conference': return <PresentationChartLineIcon className="w-4 h-4 text-indigo-600" />;
      default: return <BellIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.email || 'Researcher'} • {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/lab-notebook"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Entry 🆕
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Research Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{researchMetrics.totalProjects}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +2 this month
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BeakerIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Experiments</p>
                <p className="text-2xl font-bold text-gray-900">{researchMetrics.activeExperiments}</p>
                <p className="text-xs text-blue-600 flex items-center">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  3 running now
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Publications</p>
                <p className="text-2xl font-bold text-gray-900">{researchMetrics.publicationsThisYear}</p>
                <p className="text-xs text-purple-600 flex items-center">
                  <ChartBarIcon className="w-3 h-3 mr-1" />
                  {researchMetrics.citationsTotal} citations
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Collaboration</p>
                <p className="text-2xl font-bold text-gray-900">{researchMetrics.collaborationScore}%</p>
                <p className="text-xs text-orange-600 flex items-center">
                  <UsersIcon className="w-3 h-3 mr-1" />
                  Excellent score
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Research Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Active Research Projects</h2>
                <Link
                  to="/projects"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                >
                  View All
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{project.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <span className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {project.team.length} members
                          </span>
                          <span className="flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-1" />
                            {project.publications} pubs
                          </span>
                          {project.funding && (
                            <span className="flex items-center">
                              <AcademicCapIcon className="w-4 h-4 mr-1" />
                              {formatCurrency(project.funding.amount)}
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">{project.progress}% complete</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority} priority
                        </p>
                        <p className="text-xs text-gray-500">Due {new Date(project.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Urgent Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Urgent Deadlines</h2>
              <div className="space-y-3">
                {urgentDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{deadline.title}</p>
                      <p className="text-xs text-gray-600">{deadline.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-red-600">
                        {getDaysUntilDeadline(deadline.deadline)} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Smart Insights</h2>
              <div className="space-y-3">
                {highPriorityInsights.map((insight) => (
                  <div key={insight.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{insight.title}</p>
                      <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                      {insight.action && (
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          {insight.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {highImpactActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.user} • {activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
