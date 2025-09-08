import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  ChartBarIcon,
  BeakerIcon,
  CalendarIcon,
  DocumentTextIcon,
  LinkIcon,
  ArrowRightIcon,
  EyeIcon,
  CogIcon,
  TrendingUpIcon,
  UsersIcon,
  ClockIcon
} from '../components/icons';
import crossEntityIntegrationService from '../services/crossEntityIntegrationService';

interface WorkflowAnalytics {
  totalNotebookEntries: number;
  totalProtocols: number;
  totalResults: number;
  totalBookings: number;
  totalRelationships: number;
  syncStatusCounts: Record<string, number>;
}

interface ResearchWorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  entities: {
    protocols: number;
    results: number;
    bookings: number;
  };
  nextSteps: string[];
}

const ResearchWorkflowDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<ResearchWorkflowStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ResearchWorkflowStep | null>(null);

  useEffect(() => {
    loadWorkflowAnalytics();
    loadWorkflowSteps();
  }, [user]);

  const loadWorkflowAnalytics = async () => {
    if (!user?.lab_id) {
      console.log('No lab_id available for user');
      return;
    }
    
    try {
      setLoading(true);
      const data = await crossEntityIntegrationService.getWorkflowAnalytics({
        labId: user.lab_id,
        timeRange: '30'
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading workflow analytics:', error);
      // Set mock data if API fails
      setAnalytics({
        totalNotebookEntries: 12,
        totalProtocols: 8,
        totalResults: 15,
        totalBookings: 6,
        totalRelationships: 4,
        syncStatusCounts: {
          'synced': 10,
          'pending': 2,
          'failed': 0,
          'conflict': 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowSteps = () => {
    // Mock workflow steps - in a real implementation, this would come from the API
    const steps: ResearchWorkflowStep[] = [
      {
        id: '1',
        title: 'Research Planning',
        description: 'Define objectives, literature review, and hypothesis formation',
        icon: <DocumentTextIcon className="h-6 w-6" />,
        status: 'completed',
        entities: { protocols: 3, results: 0, bookings: 1 },
        nextSteps: ['Create experimental protocol', 'Book required instruments']
      },
      {
        id: '2',
        title: 'Protocol Development',
        description: 'Create detailed experimental protocols and procedures',
        icon: <BeakerIcon className="h-6 w-6" />,
        status: 'in_progress',
        entities: { protocols: 2, results: 0, bookings: 2 },
        nextSteps: ['Validate protocol', 'Train team members', 'Schedule experiments']
      },
      {
        id: '3',
        title: 'Experiment Execution',
        description: 'Conduct experiments following established protocols',
        icon: <CalendarIcon className="h-6 w-6" />,
        status: 'pending',
        entities: { protocols: 1, results: 0, bookings: 3 },
        nextSteps: ['Book instruments', 'Prepare materials', 'Execute experiments']
      },
      {
        id: '4',
        title: 'Data Collection',
        description: 'Collect and organize experimental data',
        icon: <ChartBarIcon className="h-6 w-6" />,
        status: 'pending',
        entities: { protocols: 0, results: 2, bookings: 1 },
        nextSteps: ['Analyze data', 'Create visualizations', 'Document findings']
      },
      {
        id: '5',
        title: 'Analysis & Results',
        description: 'Analyze data and generate research results',
        icon: <TrendingUpIcon className="h-6 w-6" />,
        status: 'pending',
        entities: { protocols: 0, results: 1, bookings: 0 },
        nextSteps: ['Statistical analysis', 'Create reports', 'Prepare publications']
      }
    ];
    setWorkflowSteps(steps);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '⟳';
      case 'pending': return '○';
      case 'blocked': return '⚠';
      default: return '○';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Research Workflow Dashboard
          </h1>
          <p className="text-gray-600">
            A-Z research workflow with cross-entity integration and analytics
          </p>
        </div>

        {/* Analytics Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-8 w-8 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Notebook Entries</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalNotebookEntries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BeakerIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Protocols</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalProtocols}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Results</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalResults}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <LinkIcon className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Relationships</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalRelationships}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Research Workflow Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow Steps */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Workflow Steps</h2>
            
            {workflowSteps.map((step, index) => (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all ${
                  selectedStep?.id === step.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedStep(step)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getStatusColor(step.status)}`}>
                        {getStatusIcon(step.status)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                          {step.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                      
                      {/* Entity counts */}
                      <div className="flex items-center space-x-4 mb-3">
                        {step.entities.protocols > 0 && (
                          <span className="flex items-center text-xs text-blue-600">
                            <DocumentTextIcon className="h-3 w-3 mr-1" />
                            {step.entities.protocols} protocols
                          </span>
                        )}
                        {step.entities.results > 0 && (
                          <span className="flex items-center text-xs text-green-600">
                            <ChartBarIcon className="h-3 w-3 mr-1" />
                            {step.entities.results} results
                          </span>
                        )}
                        {step.entities.bookings > 0 && (
                          <span className="flex items-center text-xs text-purple-600">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {step.entities.bookings} bookings
                          </span>
                        )}
                      </div>
                      
                      {/* Next steps */}
                      {step.nextSteps.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">Next Steps:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {step.nextSteps.slice(0, 2).map((nextStep, idx) => (
                              <li key={idx} className="flex items-center">
                                <ArrowRightIcon className="h-3 w-3 mr-1 text-gray-400" />
                                {nextStep}
                              </li>
                            ))}
                            {step.nextSteps.length > 2 && (
                              <li className="text-gray-500">+{step.nextSteps.length - 2} more...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Step Details */}
          <div>
            {selectedStep ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedStep.icon}
                    {selectedStep.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedStep.status)}`}>
                        {selectedStep.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        Step {workflowSteps.findIndex(s => s.id === selectedStep.id) + 1} of {workflowSteps.length}
                      </span>
                    </div>
                    
                    <p className="text-gray-700">{selectedStep.description}</p>
                    
                    {/* Entity Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-blue-900">{selectedStep.entities.protocols}</p>
                        <p className="text-xs text-blue-600">Protocols</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <ChartBarIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-green-900">{selectedStep.entities.results}</p>
                        <p className="text-xs text-green-600">Results</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <CalendarIcon className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-purple-900">{selectedStep.entities.bookings}</p>
                        <p className="text-xs text-purple-600">Bookings</p>
                      </div>
                    </div>
                    
                    {/* Next Steps */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                      <ul className="space-y-2">
                        {selectedStep.nextSteps.map((nextStep, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <ArrowRightIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {nextStep}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <CogIcon className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Workflow Step
                  </h3>
                  <p className="text-gray-600">
                    Choose a step from the workflow to view detailed information and manage related entities.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Integration Status */}
        {analytics && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.syncStatusCounts).map(([status, count]) => (
                  <div key={status} className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResearchWorkflowDashboard;
