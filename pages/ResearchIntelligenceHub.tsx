import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  ResultEntry, 
  Project, 
  PaperSuggestion, 
  ResearchInterest,
  Presentation,
  PresentationTemplate,
  ChartData,
  TableData
} from '../types';

const ResearchIntelligenceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'data' | 'papers' | 'presentations'>('data');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [paperSuggestions, setPaperSuggestions] = useState<PaperSuggestion[]>([]);
  const [researchInterests, setResearchInterests] = useState<ResearchInterest[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showCreatePresentation, setShowCreatePresentation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string>('All');

  // Mock data for demonstration
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'CAR-T Cell Therapy Optimization',
        description: 'Optimizing CAR-T cell therapy for solid tumors through genetic engineering',
        status: 'In Progress',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        team: ['Dr. Sarah Chen', 'Dr. Michael Rodriguez', 'Dr. Emily Watson'],
        results: [
          {
            id: 'result1',
            title: 'Tumor Growth Inhibition Results',
            description: 'Comparison of control vs enhanced CAR-T therapy',
            date: new Date('2024-08-10'),
            data: {
              type: 'chart',
              chartType: 'bar',
              labels: ['Control', 'Standard CAR-T', 'Enhanced CAR-T'],
              datasets: [
                {
                  label: 'Tumor Volume (mm³)',
                  data: [100, 65, 25],
                  backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
                }
              ]
            },
            analysis: 'Enhanced CAR-T shows 75% reduction in tumor volume compared to control',
            tags: ['immunotherapy', 'cancer', 'CAR-T', 'tumor inhibition']
          },
          {
            id: 'result2',
            title: 'Cell Persistence Analysis',
            description: 'CAR-T cell persistence in circulation over time',
            date: new Date('2024-08-08'),
            data: {
              type: 'chart',
              chartType: 'line',
              labels: ['Day 0', 'Day 7', 'Day 14', 'Day 21', 'Day 28'],
              datasets: [
                {
                  label: 'Standard CAR-T',
                  data: [100, 85, 60, 35, 20],
                  borderColor: '#f59e0b',
                  fill: false
                },
                {
                  label: 'Enhanced CAR-T',
                  data: [100, 95, 88, 75, 65],
                  borderColor: '#10b981',
                  fill: false
                }
              ]
            },
            analysis: 'Enhanced CAR-T shows 3x better persistence at day 28',
            tags: ['cell persistence', 'circulation', 'longevity']
          },
          {
            id: 'result3',
            title: 'Safety Profile Assessment',
            description: 'Cytokine release syndrome and toxicity evaluation',
            date: new Date('2024-08-05'),
            data: {
              type: 'table',
              headers: ['Parameter', 'Standard CAR-T', 'Enhanced CAR-T'],
              rows: [
                ['CRS Grade 1-2', '45%', '25%'],
                ['CRS Grade 3-4', '15%', '5%'],
                ['Neurotoxicity', '20%', '8%'],
                ['Liver Toxicity', '25%', '12%']
              ]
            },
            analysis: 'Enhanced CAR-T shows significantly improved safety profile',
            tags: ['safety', 'toxicity', 'CRS', 'neurotoxicity']
          }
        ]
      },
      {
        id: '2',
        title: 'CRISPR Safety Validation',
        description: 'Comprehensive safety analysis of CRISPR-Cas9 gene editing',
        status: 'Completed',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-07-31'),
        team: ['Dr. Michael Rodriguez', 'Dr. Lisa Park'],
        results: [
          {
            id: 'result4',
            title: 'Off-Target Analysis',
            description: 'Genome-wide off-target effect assessment',
            date: new Date('2024-07-25'),
            data: {
              type: 'chart',
              chartType: 'pie',
              labels: ['On-target', 'Off-target (low)', 'Off-target (high)'],
              datasets: [{
                data: [85, 12, 3],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
              }]
            },
            analysis: '95% specificity achieved with high-fidelity Cas9 variant',
            tags: ['CRISPR', 'off-target', 'specificity', 'safety']
          }
        ]
      }
    ];

    const mockInterests: ResearchInterest[] = [
      {
        id: '1',
        userId: 'user1',
        topic: 'Cancer Immunotherapy',
        keywords: ['immunotherapy', 'cancer', 'T cells', 'checkpoint inhibitors', 'CAR-T'],
        priority: 'High',
        lastUpdated: new Date('2024-08-01')
      },
      {
        id: '2',
        userId: 'user1',
        topic: 'CRISPR Gene Editing',
        keywords: ['CRISPR', 'gene editing', 'genome engineering', 'Cas9', 'genetic modification'],
        priority: 'Medium',
        lastUpdated: new Date('2024-07-15')
      }
    ];

    const mockPapers: PaperSuggestion[] = [
      {
        id: '1',
        title: 'Novel CAR-T Cell Therapy for Solid Tumors: Overcoming the Tumor Microenvironment',
        abstract: 'This study presents a breakthrough in CAR-T cell therapy for solid tumors by engineering cells to overcome immunosuppressive tumor microenvironment barriers.',
        authors: ['Dr. Sarah Chen', 'Prof. Michael Rodriguez'],
        journal: 'Nature Medicine',
        year: 2024,
        doi: '10.1038/s41591-024-02567-8',
        relevanceScore: 95,
        relevanceFactors: ['Directly matches your CAR-T research', 'Recent publication', 'Top-tier journal'],
        userInterests: ['Cancer Immunotherapy'],
        researchContext: 'Perfect for your CAR-T optimization project',
        suggestedAt: new Date('2024-08-12'),
        read: false,
        saved: false,
        notes: ''
      }
    ];

    const mockPresentations: Presentation[] = [
      {
        id: '1',
        title: 'CAR-T Therapy Optimization: Q3 2024 Progress Report',
        description: 'AI-generated presentation combining your experimental results with relevant literature',
        template: 'Research Update',
        slides: [],
        dataSources: ['Tumor inhibition results', 'Cell persistence data', 'Safety analysis', 'Relevant papers'],
        generatedAt: new Date('2024-08-12'),
        lastModified: new Date('2024-08-12'),
        exportedFormats: ['PDF', 'PowerPoint'],
        sharedWith: ['lab-members']
      }
    ];

    setProjects(mockProjects);
    setResearchInterests(mockInterests);
    setPaperSuggestions(mockPapers);
    setPresentations(mockPresentations);
  }, []);

  const handleCreatePresentation = (projectId: string, template: PresentationTemplate) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newPresentation: Presentation = {
      id: Date.now().toString(),
      title: `${project.title}: AI-Generated Report`,
      description: `Automatically generated presentation from your research data and relevant literature`,
      template,
      slides: generatePresentationFromData(project, template),
      dataSources: [
        ...project.results.map(r => r.title),
        ...paperSuggestions.filter(p => p.userInterests.some(interest => 
          project.results.some(r => r.tags.some(tag => 
            p.title.toLowerCase().includes(tag.toLowerCase())
          ))
        )).map(p => p.title)
      ],
      generatedAt: new Date(),
      lastModified: new Date(),
      exportedFormats: ['PDF', 'PowerPoint'],
      sharedWith: ['lab-members']
    };

    setPresentations(prev => [newPresentation, ...prev]);
    setShowCreatePresentation(false);
  };

  const generatePresentationFromData = (project: Project, template: PresentationTemplate) => {
    const slides = [
      {
        id: 'title',
        slideNumber: 1,
        title: project.title,
        content: {
          text: [project.title, 'AI-Generated Research Report', new Date().toLocaleDateString()],
          images: [],
          charts: [],
          tables: []
        },
        layout: 'Title',
        animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
      }
    ];

    // Add project overview
    slides.push({
      id: 'overview',
      slideNumber: 2,
      title: 'Project Overview',
      content: {
        text: [
          `Status: ${project.status}`,
          `Team: ${project.team.join(', ')}`,
          `Duration: ${project.startDate.toLocaleDateString()} - ${project.endDate.toLocaleDateString()}`,
          `Description: ${project.description}`
        ],
        images: [],
        charts: [],
        tables: []
      },
      layout: 'Content',
      animations: [{ type: 'Slide', duration: 800, delay: 200 }]
    });

    // Add key results with charts
    project.results.forEach((result, index) => {
      slides.push({
        id: `result-${result.id}`,
        slideNumber: 3 + index,
        title: result.title,
        content: {
          text: [result.description, result.analysis],
          images: [],
          charts: result.data.type === 'chart' ? [result.data] : [],
          tables: result.data.type === 'table' ? [result.data] : []
        },
        layout: 'Data Chart',
        animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
      });
    });

    // Add relevant papers
    const relevantPapers = paperSuggestions.filter(p => 
      p.userInterests.some(interest => 
        project.results.some(r => r.tags.some(tag => 
          p.title.toLowerCase().includes(tag.toLowerCase())
        ))
      )
    );

    if (relevantPapers.length > 0) {
      slides.push({
        id: 'literature',
        slideNumber: 3 + project.results.length,
        title: 'Relevant Literature',
        content: {
          text: [
            'Key Papers Supporting Your Research:',
            ...relevantPapers.map(p => `• ${p.title} (${p.journal}, ${p.year})`)
          ],
          images: [],
          charts: [],
          tables: []
        },
        layout: 'Content',
        animations: [{ type: 'Slide', duration: 800, delay: 600 }]
      });
    }

    // Add next steps
    slides.push({
      id: 'next-steps',
      slideNumber: 4 + project.results.length + (relevantPapers.length > 0 ? 1 : 0),
      title: 'Next Steps & Recommendations',
      content: {
        text: [
          'Based on your data and literature review:',
          '• Continue enhanced CAR-T optimization',
          '• Validate safety profile in larger cohorts',
          '• Prepare for clinical trial applications',
          '• Consider combination therapy approaches'
        ],
        images: [],
        charts: [],
        tables: []
      },
      layout: 'Content',
      animations: [{ type: 'Slide', duration: 800, delay: 800 }]
    });

    return slides;
  };

  const renderDataVisualization = (result: any) => {
    if (result.data.type === 'chart') {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">{result.data.chartType.toUpperCase()} Chart</h4>
          <div className="h-48 bg-white border rounded flex items-center justify-center text-gray-500">
            📊 Chart Visualization: {result.data.chartType} chart with {result.data.labels.length} data points
          </div>
        </div>
      );
    } else if (result.data.type === 'table') {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Data Table</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead>
                <tr>
                  {result.data.headers.map((header: string, index: number) => (
                    <th key={index} className="px-4 py-2 border-b bg-gray-50 font-medium text-gray-900">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.rows.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="px-4 py-2 border-b text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Intelligence Hub</h1>
          <p className="text-gray-600">
            Your AI-powered research command center. Visualize data, discover relevant papers, and automatically 
            generate professional presentations that combine your results with cutting-edge literature.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Data & Results
            </button>
            <button
              onClick={() => setActiveTab('papers')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'papers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📚 AI Paper Suggestions
            </button>
            <button
              onClick={() => setActiveTab('presentations')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'presentations'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🎯 Auto Presentations
            </button>
          </div>
        </div>

        {/* Data & Results Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Research Projects</h2>
                <Button onClick={() => setShowCreatePresentation(true)}>
                  🎯 Generate AI Presentation
                </Button>
              </div>
              
              <div className="grid gap-4">
                {projects.map(project => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                          <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Status: {project.status}</span>
                            <span>Team: {project.team.join(', ')}</span>
                            <span>Results: {project.results.length}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedProject(project)}
                            className="text-blue-600 border-blue-600"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Project Details Modal */}
            {selectedProject && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                    <Button variant="outline" onClick={() => setSelectedProject(null)}>✕</Button>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Project Results</h3>
                    <div className="space-y-6">
                      {selectedProject.results.map(result => (
                        <Card key={result.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{result.title}</CardTitle>
                                <p className="text-gray-600 text-sm mt-1">{result.description}</p>
                                <p className="text-gray-500 text-xs mt-2">{result.date.toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-2">
                                {result.tags.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {renderDataVisualization(result)}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 mb-1">AI Analysis:</div>
                              <div className="text-sm text-blue-700">{result.analysis}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Paper Suggestions Tab */}
        {activeTab === 'papers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">AI Paper Recommendations</h2>
                <Button onClick={() => setShowCreatePresentation(true)}>
                  🎯 Generate AI Presentation
                </Button>
              </div>
              
              <div className="grid gap-4">
                {paperSuggestions.map(paper => (
                  <Card key={paper.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              paper.relevanceScore >= 90 ? 'text-green-600 bg-green-100' : 
                              paper.relevanceScore >= 80 ? 'text-blue-600 bg-blue-100' : 
                              'text-yellow-600 bg-yellow-100'
                            }`}>
                              {paper.relevanceScore}% Relevant
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                              {paper.journal}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                              {paper.year}
                            </span>
                          </div>
                          <CardTitle className="text-lg mb-2">{paper.title}</CardTitle>
                          <p className="text-gray-700 mb-3">{paper.abstract}</p>
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Why Relevant:</strong> {paper.researchContext}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto Presentations Tab */}
        {activeTab === 'presentations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">AI-Generated Presentations</h2>
                <Button onClick={() => setShowCreatePresentation(true)}>
                  🎯 Create New Presentation
                </Button>
              </div>
              
              <div className="grid gap-4">
                {presentations.map(presentation => (
                  <Card key={presentation.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                              {presentation.template}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                              {presentation.slides.length} slides
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                              {presentation.dataSources.length} data sources
                            </span>
                          </div>
                          <CardTitle className="text-lg mb-2">{presentation.title}</CardTitle>
                          <p className="text-gray-600 text-sm mb-3">{presentation.description}</p>
                          <div className="text-sm text-gray-500 mb-2">
                            Generated: {presentation.generatedAt.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Data Sources:</span> {presentation.dataSources.join(', ')}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" className="text-blue-600 border-blue-600">
                          View & Edit
                        </Button>
                        <Button variant="outline" className="text-green-600 border-green-600">
                          Export PDF
                        </Button>
                        <Button variant="outline" className="text-purple-600 border-purple-600">
                          Export PowerPoint
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Presentation Modal */}
        {showCreatePresentation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Generate AI Presentation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
                  <Select onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}>
                    <option value="">Choose a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Presentation Template</label>
                  <Select onChange={(e) => {
                    if (selectedProject) {
                      handleCreatePresentation(selectedProject.id, e.target.value as PresentationTemplate);
                    }
                  }}>
                    <option value="">Choose template...</option>
                    <option value="Research Update">Research Update</option>
                    <option value="Conference Talk">Conference Talk</option>
                    <option value="Lab Meeting">Lab Meeting</option>
                    <option value="Grant Proposal">Grant Proposal</option>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreatePresentation(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchIntelligenceHub;
