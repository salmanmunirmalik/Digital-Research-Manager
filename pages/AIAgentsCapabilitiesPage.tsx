/**
 * AI Agents Capabilities Page
 * Explains what each AI agent can do and their capabilities
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  MicroscopeIcon,
  TestTubeIcon,
  ChartBarIcon,
  BookOpenIcon,
  PencilIcon,
  PresentationChartLineIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  UserGroupIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '../components/icons';

interface AgentCapability {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  useCases: string[];
  category: 'research' | 'writing' | 'analysis' | 'workflow' | 'collaboration';
}

const AIAgentsCapabilitiesPage: React.FC = () => {
  const navigate = useNavigate();

  const agents: AgentCapability[] = [
    // Research Agents
    {
      id: 'paper_finding',
      name: 'Paper Finding Agent',
      icon: <BookOpenIcon className="w-6 h-6" />,
      description: 'Searches and finds relevant research papers based on your query, ranking them by relevance.',
      useCases: [
        'Find papers on specific topics',
        'Discover related research',
        'Build literature databases',
        'Track recent publications'
      ],
      category: 'research'
    },
    {
      id: 'literature_review',
      name: 'Literature Review Agent',
      icon: <BookOpenIcon className="w-6 h-6" />,
      description: 'Conducts comprehensive literature reviews, synthesizing information from multiple sources.',
      useCases: [
        'Comprehensive literature analysis',
        'Synthesize research findings',
        'Identify research gaps',
        'Create review summaries'
      ],
      category: 'research'
    },
    {
      id: 'hypothesis_generation',
      name: 'Hypothesis Generation Agent',
      icon: <LightBulbIcon className="w-6 h-6" />,
      description: 'Generates testable research hypotheses based on research questions and context.',
      useCases: [
        'Generate research hypotheses',
        'Formulate testable predictions',
        'Design experimental frameworks',
        'Develop research questions'
      ],
      category: 'research'
    },
    {
      id: 'idea_generation',
      name: 'Idea Generation Agent',
      icon: <LightBulbIcon className="w-6 h-6" />,
      description: 'Generates creative and feasible research ideas, hypotheses, and research directions.',
      useCases: [
        'Brainstorm research ideas',
        'Explore new research directions',
        'Generate project proposals',
        'Identify research opportunities'
      ],
      category: 'research'
    },
    {
      id: 'collaboration_matching',
      name: 'Collaboration Matching Agent',
      icon: <UserGroupIcon className="w-6 h-6" />,
      description: 'Matches researchers for collaboration based on expertise, skills, and project requirements.',
      useCases: [
        'Find research collaborators',
        'Match skills to projects',
        'Build research teams',
        'Identify complementary expertise'
      ],
      category: 'collaboration'
    },

    // Writing Agents
    {
      id: 'abstract_writing',
      name: 'Abstract Writing Agent',
      icon: <PencilIcon className="w-6 h-6" />,
      description: 'Generates well-structured research abstracts following academic standards.',
      useCases: [
        'Write paper abstracts',
        'Create conference abstracts',
        'Summarize research findings',
        'Generate publication summaries'
      ],
      category: 'writing'
    },
    {
      id: 'proposal_writing',
      name: 'Proposal Writing Agent',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      description: 'Creates comprehensive research proposals and grant applications.',
      useCases: [
        'Write grant proposals',
        'Create research proposals',
        'Develop project plans',
        'Structure funding applications'
      ],
      category: 'writing'
    },
    {
      id: 'paper_writing',
      name: 'Paper Writing Agent',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      description: 'Writes complete research papers with proper structure, sections, and formatting.',
      useCases: [
        'Write research papers',
        'Generate paper sections',
        'Create publication drafts',
        'Structure academic papers'
      ],
      category: 'writing'
    },
    {
      id: 'reference_management',
      name: 'Reference Management Agent',
      icon: <BookOpenIcon className="w-6 h-6" />,
      description: 'Finds, formats, and manages citations according to various citation styles.',
      useCases: [
        'Find and format citations',
        'Manage references',
        'Insert citations in papers',
        'Create bibliography'
      ],
      category: 'writing'
    },
    {
      id: 'draft_compilation',
      name: 'Draft Compilation Agent',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      description: 'Compiles sections into publication-ready drafts with consistency and coherence.',
      useCases: [
        'Compile paper sections',
        'Create final drafts',
        'Ensure consistency',
        'Prepare for publication'
      ],
      category: 'writing'
    },
    {
      id: 'output_formatting',
      name: 'Output Formatting Agent',
      icon: <CodeBracketIcon className="w-6 h-6" />,
      description: 'Formats outputs according to journal, conference, or publication requirements.',
      useCases: [
        'Format papers for journals',
        'Apply style guidelines',
        'Adjust formatting',
        'Ensure compliance'
      ],
      category: 'writing'
    },
    {
      id: 'presentation_slide',
      name: 'Presentation Slide Agent',
      icon: <PresentationChartLineIcon className="w-6 h-6" />,
      description: 'Generates presentation slides from research content with proper structure.',
      useCases: [
        'Create presentation slides',
        'Generate PPT content',
        'Structure presentations',
        'Prepare conference talks'
      ],
      category: 'writing'
    },

    // Analysis Agents
    {
      id: 'data_reading',
      name: 'Data Reading Agent',
      icon: <TestTubeIcon className="w-6 h-6" />,
      description: 'Reads and interprets experimental data from various formats and sources.',
      useCases: [
        'Read experimental data',
        'Interpret data formats',
        'Analyze data structure',
        'Extract data insights'
      ],
      category: 'analysis'
    },
    {
      id: 'data_analysis',
      name: 'Data Analysis Agent',
      icon: <ChartBarIcon className="w-6 h-6" />,
      description: 'Analyzes experimental data and provides statistical insights and interpretations.',
      useCases: [
        'Analyze experimental results',
        'Perform statistical analysis',
        'Generate data insights',
        'Create analysis reports'
      ],
      category: 'analysis'
    },
    {
      id: 'experiment_design',
      name: 'Experiment Design Agent',
      icon: <MicroscopeIcon className="w-6 h-6" />,
      description: 'Designs detailed experimental protocols and methodologies based on research questions.',
      useCases: [
        'Design experiments',
        'Create protocols',
        'Plan methodologies',
        'Structure experimental plans'
      ],
      category: 'analysis'
    },
    {
      id: 'protocol_optimization',
      name: 'Protocol Optimization Agent',
      icon: <BeakerIcon className="w-6 h-6" />,
      description: 'Optimizes experimental protocols for efficiency, accuracy, cost, and safety.',
      useCases: [
        'Optimize protocols',
        'Improve efficiency',
        'Reduce costs',
        'Enhance reproducibility'
      ],
      category: 'analysis'
    },
    {
      id: 'figure_generation',
      name: 'Figure Generation Agent',
      icon: <ChartBarIcon className="w-6 h-6" />,
      description: 'Creates scientific figures, charts, and visualizations from data and descriptions.',
      useCases: [
        'Generate scientific figures',
        'Create data visualizations',
        'Design charts and graphs',
        'Produce publication figures'
      ],
      category: 'analysis'
    },
    {
      id: 'quality_validation',
      name: 'Quality Validation Agent',
      icon: <CheckCircleIcon className="w-6 h-6" />,
      description: 'Validates output quality, completeness, and adherence to guidelines and standards.',
      useCases: [
        'Validate paper quality',
        'Check completeness',
        'Ensure accuracy',
        'Verify compliance'
      ],
      category: 'analysis'
    }
  ];

  const categories = {
    research: { name: 'Research', color: 'bg-blue-50 border-blue-200' },
    writing: { name: 'Writing', color: 'bg-green-50 border-green-200' },
    analysis: { name: 'Analysis', color: 'bg-purple-50 border-purple-200' },
    workflow: { name: 'Workflow', color: 'bg-orange-50 border-orange-200' },
    collaboration: { name: 'Collaboration', color: 'bg-pink-50 border-pink-200' }
  };

  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = [];
    }
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, AgentCapability[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/ai-research-agent')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to AI Research Agent
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Agents Capabilities
          </h1>
          <p className="text-lg text-gray-600">
            Explore what our 18 specialized AI agents can do for your research
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-blue-600">{agents.length}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-600">
              {agents.filter(a => a.category === 'research').length}
            </div>
            <div className="text-sm text-gray-600">Research Agents</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-purple-600">
              {agents.filter(a => a.category === 'writing').length}
            </div>
            <div className="text-sm text-gray-600">Writing Agents</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-orange-600">
              {agents.filter(a => a.category === 'analysis').length}
            </div>
            <div className="text-sm text-gray-600">Analysis Agents</div>
          </div>
        </div>

        {/* Agents by Category */}
        {Object.entries(groupedAgents).map(([category, categoryAgents]) => (
          <div key={category} className="mb-12">
            <div className={`border-l-4 ${categories[category as keyof typeof categories].color.split(' ')[1]} pl-4 mb-6`}>
              <h2 className="text-2xl font-bold text-gray-900">
                {categories[category as keyof typeof categories].name} Agents
              </h2>
              <p className="text-gray-600 mt-1">
                {categoryAgents.length} agent{categoryAgents.length !== 1 ? 's' : ''} specialized in {category}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`bg-white rounded-lg shadow-sm border-2 ${categories[category as keyof typeof categories].color.split(' ')[1]} p-6 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start mb-4">
                    <div className={`p-2 rounded-lg ${categories[category as keyof typeof categories].color.split(' ')[0]} mr-3`}>
                      {agent.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Use Cases:</h4>
                    <ul className="space-y-1">
                      {agent.useCases.map((useCase, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Workflow Information */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complex Workflows
          </h2>
          <p className="text-gray-700 mb-6">
            Our agents can work together in complex workflows to accomplish multi-step research tasks:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                📄 Paper Generation Workflow
              </h3>
              <p className="text-gray-600 mb-4">
                Automatically generates a complete research paper from your data:
              </p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. <strong>Data Reading</strong> - Reads your experimental data</li>
                <li>2. <strong>Paper Writing</strong> - Creates paper sections</li>
                <li>3. <strong>Figure Generation</strong> - Creates visualizations</li>
                <li>4. <strong>Reference Management</strong> - Adds citations</li>
                <li>5. <strong>Draft Compilation</strong> - Combines sections</li>
                <li>6. <strong>Quality Validation</strong> - Validates output</li>
                <li>7. <strong>Output Formatting</strong> - Formats for publication</li>
              </ol>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                🧪 Experiment Workflow
              </h3>
              <p className="text-gray-600 mb-4">
                Designs and plans complete experiments:
              </p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. <strong>Literature Review</strong> - Reviews existing research</li>
                <li>2. <strong>Hypothesis Generation</strong> - Creates testable hypotheses</li>
                <li>3. <strong>Experiment Design</strong> - Designs methodology</li>
                <li>4. <strong>Protocol Optimization</strong> - Optimizes protocols</li>
                <li>5. <strong>Data Analysis Planning</strong> - Plans analysis approach</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/ai-research-agent')}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Start Using AI Agents
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentsCapabilitiesPage;

