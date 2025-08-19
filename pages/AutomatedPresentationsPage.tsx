import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  Presentation, 
  PresentationTemplate,
  PresentationSlide,
  SlideLayout,
  SlideContent,
  ChartData,
  TableData
} from '../types';
import { 
  PresentationChartLineIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  BeakerIcon,
  LightbulbIcon,
  SparklesIcon,
  AcademicCapIcon,
  TrendingUpIcon,
  EyeIcon,
  CogIcon,
  PlayIcon,
  DownloadIcon,
  ShareIcon
} from '../components/icons';

const AutomatedPresentationsPage: React.FC = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate | 'All'>('All');
  
  // AI Presentation Generation State
  const [aiGenerationMode, setAiGenerationMode] = useState<'manual' | 'smart' | 'auto'>('smart');
  const [selectedDataSources, setSelectedDataSources] = useState<{
    notebook: string[];
    results: string[];
    stats: any[];
  }>({ notebook: [], results: [], stats: [] });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  
  // Data Sources State
  const [availableNotebooks, setAvailableNotebooks] = useState<any[]>([]);
  const [availableResults, setAvailableResults] = useState<any[]>([]);
  const [availableStats, setAvailableStats] = useState<any[]>([]);

  // AI-Powered Presentation Generation
  const generateAIPresentation = async () => {
    if (selectedDataSources.notebook.length === 0 && 
        selectedDataSources.results.length === 0 && 
        selectedDataSources.stats.length === 0) {
      alert('Please select at least one data source for AI analysis');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setAiInsights([]);

    try {
      // Simulate AI analysis progress
      const progressSteps = [
        'Analyzing research data...',
        'Identifying key insights...',
        'Generating slide content...',
        'Creating visualizations...',
        'Finalizing presentation...'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setGenerationProgress((i + 1) * 20);
        setAiInsights(prev => [...prev, progressSteps[i]]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Generate AI-powered presentation
      const aiPresentation = await createAIPresentation();
      setPresentations(prev => [aiPresentation, ...prev]);
      setShowCreateForm(false);
      setSelectedPresentation(aiPresentation);
      
      setGenerationProgress(100);
      setAiInsights(prev => [...prev, '🎉 AI Presentation Generated Successfully!']);
      
    } catch (error) {
      console.error('AI generation error:', error);
      setAiInsights(prev => [...prev, '❌ Error generating presentation']);
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setAiInsights([]);
      }, 3000);
    }
  };

  const createAIPresentation = async (): Promise<Presentation> => {
    // Analyze selected data sources and generate intelligent content
    const analysis = await analyzeDataSources();
    
    const presentation: Presentation = {
      id: `ai_${Date.now()}`,
      title: analysis.title,
      description: analysis.description,
      template: 'AI Generated',
      slides: analysis.slides,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: 'AI Research Assistant',
      tags: analysis.tags,
      status: 'draft'
    };

    return presentation;
  };

  const analyzeDataSources = async () => {
    // This would integrate with actual AI service (e.g., OpenAI, Gemini)
    // For now, we'll create intelligent mock analysis
    
    const notebookData = availableNotebooks.filter(n => 
      selectedDataSources.notebook.includes(n.id)
    );
    const resultsData = availableResults.filter(r => 
      selectedDataSources.results.includes(r.id)
    );
    const statsData = availableResults.filter(s => 
      selectedDataSources.stats.includes(s.id)
    );

    // Generate intelligent insights based on data
    const insights = generateIntelligentInsights(notebookData, resultsData, statsData);
    
    return {
      title: insights.title,
      description: insights.description,
      slides: insights.slides,
      tags: insights.tags
    };
  };

  const generateIntelligentInsights = (notebooks: any[], results: any[], stats: any[]) => {
    // AI-powered analysis to generate meaningful presentation content
    const allData = [...notebooks, ...results, ...stats];
    
    if (allData.length === 0) {
      return {
        title: 'Research Overview',
        description: 'AI-generated research presentation',
        slides: [],
        tags: ['ai-generated', 'research']
      };
    }

    // Analyze research themes and patterns
    const themes = extractResearchThemes(allData);
    const keyFindings = extractKeyFindings(allData);
    const methodology = extractMethodology(allData);
    const conclusions = generateConclusions(allData);

    const slides = [
      createTitleSlide(themes, allData),
      createOverviewSlide(themes, allData),
      createMethodologySlide(methodology),
      createResultsSlide(keyFindings),
      createAnalysisSlide(stats),
      createConclusionsSlide(conclusions),
      createNextStepsSlide(allData)
    ].filter(Boolean);

    return {
      title: `${themes.primary} Research Presentation`,
      description: `AI-generated presentation based on ${allData.length} data sources`,
      slides,
      tags: ['ai-generated', themes.primary.toLowerCase(), 'research', 'analysis']
    };
  };

  const extractResearchThemes = (data: any[]) => {
    // AI logic to identify primary research themes
    const keywords = data.flatMap(item => 
      item.tags || item.data_type || item.title?.split(' ') || []
    );
    
    const themeCounts = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryTheme = Object.entries(themeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Research';

    return { primary: primaryTheme, all: Object.keys(themeCounts) };
  };

  const extractKeyFindings = (data: any[]) => {
    // AI logic to extract key findings from data
    return data
      .filter(item => item.data_content?.type === 'spreadsheet')
      .flatMap(item => {
        const rows = item.data_content?.rows || [];
        if (rows.length > 0) {
          return [`${item.title}: ${rows.length} data points analyzed`];
        }
        return [];
      })
      .slice(0, 5);
  };

  const extractMethodology = (data: any[]) => {
    // AI logic to extract methodology information
    return data
      .filter(item => item.data_type === 'experiment')
      .map(item => item.title)
      .slice(0, 3);
  };

  const generateConclusions = (data: any[]) => {
    // AI logic to generate conclusions
    const totalDataPoints = data.reduce((acc, item) => {
      const rows = item.data_content?.rows || [];
      return acc + rows.length;
    }, 0);

    return [
      `Analyzed ${totalDataPoints} total data points`,
      `Identified ${data.length} key research areas`,
      'Generated comprehensive statistical analysis',
      'Prepared for stakeholder presentation'
    ];
  };

  // Slide creation functions
  const createTitleSlide = (themes: any, data: any[]) => ({
    id: 'title',
    slideNumber: 1,
    title: `${themes.primary} Research Presentation`,
    content: {
      text: [
        `${themes.primary} Research Presentation`,
        `AI-Generated Analysis`,
        `Based on ${data.length} Data Sources`,
        new Date().toLocaleDateString()
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Title',
    animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
  });

  const createOverviewSlide = (themes: any, data: any[]) => ({
    id: 'overview',
    slideNumber: 2,
    title: 'Research Overview',
    content: {
      text: [
        'Research Focus Areas:',
        ...themes.all.slice(0, 5).map(theme => `• ${theme}`),
        '',
        `Total Data Sources: ${data.length}`,
        'AI-Powered Analysis Complete'
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Content',
    animations: [{ type: 'Slide', duration: 800, delay: 200 }]
  });

  const createMethodologySlide = (methodology: string[]) => ({
    id: 'methodology',
    slideNumber: 3,
    title: 'Methodology & Approach',
    content: {
      text: [
        'Research Methods:',
        ...methodology.map(m => `• ${m}`),
        '',
        'Data Collection:',
        '• Laboratory experiments',
        '• Statistical analysis',
        '• AI-powered insights'
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Two Column',
    animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
  });

  const createResultsSlide = (findings: string[]) => ({
    id: 'results',
    slideNumber: 4,
    title: 'Key Findings & Results',
    content: {
      text: [
        'Primary Results:',
        ...findings.slice(0, 4),
        '',
        'Data Analysis:',
        '• Comprehensive statistical review',
        '• Correlation analysis',
        '• Trend identification'
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Content',
    animations: [{ type: 'Slide', duration: 800, delay: 200 }]
  });

  const createAnalysisSlide = (stats: any[]) => ({
    id: 'analysis',
    slideNumber: 5,
    title: 'Statistical Analysis',
    content: {
      text: [
        'Advanced Analytics:',
        '• Descriptive statistics',
        '• Correlation analysis',
        '• Regression modeling',
        '• Outlier detection',
        '',
        'AI Insights:',
        '• Pattern recognition',
        '• Trend analysis',
        '• Predictive modeling'
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Two Column',
    animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
  });

  const createConclusionsSlide = (conclusions: string[]) => ({
    id: 'conclusions',
    slideNumber: 6,
    title: 'Conclusions & Insights',
    content: {
      text: [
        'Key Conclusions:',
        ...conclusions,
        '',
        'Research Impact:',
        '• Data-driven insights',
        '• Statistical validation',
        '• Future research directions'
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Content',
    animations: [{ type: 'Slide', duration: 800, delay: 200 }]
  });

  const createNextStepsSlide = (data: any[]) => ({
    id: 'next-steps',
    slideNumber: 7,
    title: 'Next Steps & Recommendations',
    content: {
      text: [
        'Immediate Actions:',
        '• Review AI-generated insights',
        '• Validate statistical findings',
        '• Prepare stakeholder report',
        '',
        'Future Research:',
        '• Expand data collection',
        '• Deepen statistical analysis',
        '• Implement AI recommendations'
      ],
      images: [],
      charts: [],
      tables: []
    },
    layout: 'Content',
    animations: [{ type: 'Slide', duration: 800, delay: 200 }]
  });

  // Load available data sources for AI integration
  useEffect(() => {
    loadAvailableDataSources();
  }, []);

  const loadAvailableDataSources = async () => {
    try {
      // Load notebooks from LabNotebookPage
      const notebookResponse = await fetch('http://localhost:5001/api/notebook/entries', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (notebookResponse.ok) {
        const notebookData = await notebookResponse.json();
        setAvailableNotebooks(notebookData.entries || notebookData || []);
      }

      // Load results from DataResultsPage
      const resultsResponse = await fetch('http://localhost:5001/api/data/results', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setAvailableResults(resultsData.results || resultsData || []);
      }

      // Load stats from DataResultsPage analytics
      const statsResponse = await fetch('http://localhost:5001/api/data/results/stats/overview', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setAvailableStats(statsData.stats || statsData || []);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
      // Fallback to mock data
      setAvailableNotebooks([
        { id: '1', title: 'Cell Culture Protocol', tags: ['cell-culture', 'protocol'], data_type: 'protocol' },
        { id: '2', title: 'PCR Optimization', tags: ['pcr', 'optimization'], data_type: 'experiment' }
      ]);
      setAvailableResults([
        { id: '1', title: 'Temperature vs. pH Study', tags: ['temperature', 'pH'], data_type: 'experiment' },
        { id: '2', title: 'Cell Growth Analysis', tags: ['cell-growth', 'analysis'], data_type: 'experiment' }
      ]);
      setAvailableStats([
        { id: '1', title: 'Statistical Overview', type: 'analytics' }
      ]);
    }
  };

  // Mock data for demonstration
  useEffect(() => {
    const mockPresentations: Presentation[] = [
      {
        id: '1',
        title: 'Cancer Immunotherapy Research Update - Q3 2024',
        description: 'Comprehensive update on our CAR-T cell therapy research progress, including preclinical results and next steps.',
        template: 'Research Update',
        slides: [
          {
            id: 'slide1',
            slideNumber: 1,
            title: 'Research Overview',
            content: {
              text: ['Cancer Immunotherapy Research Update', 'Q3 2024 Progress Report', 'Dr. Sarah Chen, Principal Investigator'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Title',
            animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
          },
          {
            id: 'slide2',
            slideNumber: 2,
            title: 'Project Objectives',
            content: {
              text: [
                'Develop novel CAR-T cell therapy for solid tumors',
                'Overcome tumor microenvironment barriers',
                'Improve therapeutic efficacy and safety',
                'Advance to clinical trials'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          },
          {
            id: 'slide3',
            slideNumber: 3,
            title: 'Methodology',
            content: {
              text: [
                'CRISPR-Cas9 gene editing of T cells',
                'In vitro activation and expansion',
                'Preclinical testing in mouse models',
                'Safety and efficacy evaluation'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Two Column',
            animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
          },
          {
            id: 'slide4',
            slideNumber: 4,
            title: 'Results Summary',
            content: {
              text: ['Key Findings:'],
              images: [],
              charts: [
                {
                  id: 'chart1',
                  type: 'bar',
                  title: 'Tumor Growth Inhibition',
                  data: [
                    { group: 'Control', value: 100 },
                    { group: 'Standard CAR-T', value: 65 },
                    { group: 'Enhanced CAR-T', value: 25 }
                  ],
                  options: { color: 'blue' }
                }
              ],
              tables: [
                {
                  id: 'table1',
                  title: 'Treatment Response Rates',
                  headers: ['Treatment Group', 'Complete Response', 'Partial Response', 'No Response'],
                  rows: [
                    ['Control', '0%', '0%', '100%'],
                    ['Standard CAR-T', '15%', '45%', '40%'],
                    ['Enhanced CAR-T', '60%', '30%', '10%']
                  ],
                  summary: 'Enhanced CAR-T shows significantly improved response rates'
                }
              ]
            },
            layout: 'Data Chart',
            animations: [{ type: 'Fade', duration: 1000, delay: 600 }]
          },
          {
            id: 'slide5',
            slideNumber: 5,
            title: 'Next Steps',
            content: {
              text: [
                'Complete safety studies',
                'Scale up production',
                'Submit IND application',
                'Plan Phase I clinical trial',
                'Collaborate with clinical partners'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 800 }]
          }
        ],
        dataSources: ['Lab notebook entries', 'Experimental results', 'Statistical analysis', 'Literature review'],
        generatedAt: new Date('2024-08-10'),
        lastModified: new Date('2024-08-12'),
        exportedFormats: ['PDF', 'PowerPoint', 'Keynote'],
        sharedWith: ['lab-members', 'collaborators']
      },
      {
        id: '2',
        title: 'CRISPR Safety Analysis Report',
        description: 'Comprehensive analysis of CRISPR-Cas9 off-target effects and safety measures in our gene editing protocols.',
        template: 'Lab Meeting',
        slides: [
          {
            id: 'slide1',
            slideNumber: 1,
            title: 'CRISPR Safety Analysis',
            content: {
              text: ['CRISPR-Cas9 Safety Analysis', 'Off-Target Effects Assessment', 'Dr. Michael Rodriguez'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Title',
            animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
          },
          {
            id: 'slide2',
            slideNumber: 2,
            title: 'Safety Measures Implemented',
            content: {
              text: [
                'High-fidelity Cas9 variants',
                'Computational off-target prediction',
                'Comprehensive sequencing validation',
                'Multiple safety checkpoints'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          }
        ],
        dataSources: ['CRISPR validation data', 'Sequencing results', 'Safety protocols'],
        generatedAt: new Date('2024-08-08'),
        lastModified: new Date('2024-08-09'),
        exportedFormats: ['PDF', 'PowerPoint'],
        sharedWith: ['lab-members']
      }
    ];

    setPresentations(mockPresentations);
  }, []);

  const handleCreatePresentation = (presentation: Omit<Presentation, 'id' | 'generatedAt' | 'lastModified' | 'slides'>) => {
    const newPresentation: Presentation = {
      ...presentation,
      id: Date.now().toString(),
      generatedAt: new Date(),
      lastModified: new Date(),
      slides: generateDefaultSlides(presentation.template, presentation.title)
    };
    setPresentations(prev => [newPresentation, ...prev]);
    setShowCreateForm(false);
  };

  const generateDefaultSlides = (template: PresentationTemplate, title: string): PresentationSlide[] => {
    const baseSlides: PresentationSlide[] = [
      {
        id: 'title-slide',
        slideNumber: 1,
        title: 'Title Slide',
        content: {
          text: [title, 'Generated by Digital Research Manager', new Date().toLocaleDateString()],
          images: [],
          charts: [],
          tables: []
        },
        layout: 'Title',
        animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
      }
    ];

    switch (template) {
      case 'Research Update':
        return [
          ...baseSlides,
          {
            id: 'overview',
            slideNumber: 2,
            title: 'Research Overview',
            content: {
              text: ['Project Background', 'Current Status', 'Key Achievements'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          },
          {
            id: 'results',
            slideNumber: 3,
            title: 'Results & Data',
            content: {
              text: ['Experimental Results', 'Data Analysis', 'Key Findings'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Data Chart',
            animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
          },
          {
            id: 'next-steps',
            slideNumber: 4,
            title: 'Next Steps',
            content: {
              text: ['Future Plans', 'Timeline', 'Collaborations'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 600 }]
          }
        ];
      case 'Conference Talk':
        return [
          ...baseSlides,
          {
            id: 'introduction',
            slideNumber: 2,
            title: 'Introduction',
            content: {
              text: ['Research Question', 'Background', 'Hypothesis'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          },
          {
            id: 'methods',
            slideNumber: 3,
            title: 'Methods',
            content: {
              text: ['Experimental Design', 'Protocols', 'Analysis Methods'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Two Column',
            animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
          },
          {
            id: 'results',
            slideNumber: 4,
            title: 'Results',
            content: {
              text: ['Key Results', 'Data Visualization', 'Statistical Analysis'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Data Chart',
            animations: [{ type: 'Fade', duration: 1000, delay: 600 }]
          },
          {
            id: 'conclusion',
            slideNumber: 5,
            title: 'Conclusion',
            content: {
              text: ['Summary', 'Implications', 'Future Directions'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Conclusion',
            animations: [{ type: 'Slide', duration: 800, delay: 800 }]
          }
        ];
      default:
        return baseSlides;
    }
  };

  const handleExportPresentation = (presentationId: string, format: string) => {
    // Mock export functionality
    console.log(`Exporting presentation ${presentationId} in ${format} format`);
    alert(`Presentation exported as ${format}!`);
  };

  const handleSharePresentation = (presentationId: string, recipients: string[]) => {
    // Mock sharing functionality
    console.log(`Sharing presentation ${presentationId} with:`, recipients);
    alert(`Presentation shared with ${recipients.length} recipients!`);
  };

  const filteredPresentations = presentations.filter(presentation => {
    const matchesSearch = presentation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         presentation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTemplate = selectedTemplate === 'All' || presentation.template === selectedTemplate;
    return matchesSearch && matchesTemplate;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Research Presentations</h1>
          <p className="text-gray-600">
            Transform your research data into stunning presentations! Our AI connects your lab notebook, 
            experimental results, and statistical analysis to automatically generate professional slides 
            with insights, charts, and compelling narratives.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search presentations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as PresentationTemplate | 'All')}
                className="max-w-xs"
              >
                <option value="All">All Templates</option>
                <option value="Research Update">Research Update</option>
                <option value="Conference Talk">Conference Talk</option>
                <option value="Lab Meeting">Lab Meeting</option>
                <option value="Grant Proposal">Grant Proposal</option>
                <option value="Thesis Defense">Thesis Defense</option>
                <option value="Journal Club">Journal Club</option>
                <option value="Custom">Custom</option>
              </Select>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Manual Creation
              </Button>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <SparklesIcon className="w-5 h-5" />
                AI-Generate Presentation
              </Button>
            </div>
          </div>
        </div>

        {/* Presentations Grid */}
        <div className="grid gap-6">
          {filteredPresentations.map(presentation => (
            <Card key={presentation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        presentation.template === 'AI Generated' 
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {presentation.template === 'AI Generated' ? '🤖 AI Generated' : presentation.template}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        {presentation.slides.length} slides
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                        {presentation.dataSources.length} data sources
                      </span>
                      {presentation.template === 'AI Generated' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                          🔗 Connected Data
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg mb-2 cursor-pointer hover:text-blue-600"
                               onClick={() => setSelectedPresentation(presentation)}>
                      {presentation.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm mb-3">{presentation.description}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      Generated: {presentation.generatedAt.toLocaleDateString()} • 
                      Last modified: {presentation.lastModified.toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presentation.exportedFormats.map(format => (
                        <span key={format} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div className="flex items-center gap-4 mt-2">
                      <span>📊 {presentation.slides.length}</span>
                      <span>📅 {presentation.dataSources.length}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Data Sources:</span> {presentation.dataSources.join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedPresentation(presentation)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      View & Edit
                    </Button>
                    <Select
                      onChange={(e) => handleExportPresentation(presentation.id, e.target.value)}
                      className="max-w-xs"
                    >
                      <option value="">Export as...</option>
                      {presentation.exportedFormats.map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </Select>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSharePresentation(presentation.id, ['lab-members'])}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Presentation Form Modal */}
        {showCreateForm && (
          <CreatePresentationForm 
            onSubmit={handleCreatePresentation}
            onCancel={() => setShowCreateForm(false)}
            onAIGenerate={generateAIPresentation}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            aiInsights={aiInsights}
            aiGenerationMode={aiGenerationMode}
            setAiGenerationMode={setAiGenerationMode}
            selectedDataSources={selectedDataSources}
            setSelectedDataSources={setSelectedDataSources}
            availableNotebooks={availableNotebooks}
            availableResults={availableResults}
            availableStats={availableStats}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
          />
        )}

        {/* Presentation Detail Modal */}
        {selectedPresentation && (
          <PresentationDetailModal
            presentation={selectedPresentation}
            onClose={() => setSelectedPresentation(null)}
            onEdit={() => setShowEditForm(true)}
          />
        )}
      </div>
    </div>
  );
};

// Create Presentation Form Component
const CreatePresentationForm: React.FC<{
  onSubmit: (presentation: Omit<Presentation, 'id' | 'generatedAt' | 'lastModified' | 'slides'>) => void;
  onCancel: () => void;
  onAIGenerate: () => void;
  isGenerating: boolean;
  generationProgress: number;
  aiInsights: string[];
  aiGenerationMode: 'manual' | 'smart' | 'auto';
  setAiGenerationMode: (mode: 'manual' | 'smart' | 'auto') => void;
  selectedDataSources: {
    notebook: string[];
    results: string[];
    stats: any[];
  };
  setSelectedDataSources: (sources: any) => void;
  availableNotebooks: any[];
  availableResults: any[];
  availableStats: any[];
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
}> = ({ 
  onSubmit, 
  onCancel, 
  onAIGenerate,
  isGenerating,
  generationProgress,
  aiInsights,
  aiGenerationMode,
  setAiGenerationMode,
  selectedDataSources,
  setSelectedDataSources,
  availableNotebooks,
  availableResults,
  availableStats,
  aiPrompt,
  setAiPrompt
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template: 'Research Update' as PresentationTemplate,
    dataSources: '',
    sharedWith: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      dataSources: formData.dataSources.split(',').map(source => source.trim()).filter(Boolean),
      exportedFormats: ['PDF', 'PowerPoint']
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create AI-Powered Presentation</h2>
        
        {/* AI Generation Mode Selection */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            AI Generation Mode
          </h3>
          <div className="flex gap-3">
            {[
              { mode: 'manual', label: 'Manual Creation', icon: '✏️', desc: 'Create slides manually' },
              { mode: 'smart', label: 'AI-Assisted', icon: '🤖', desc: 'AI analyzes data and suggests content' },
              { mode: 'auto', label: 'Full AI Generation', icon: '🚀', desc: 'AI creates complete presentation' }
            ].map(({ mode, label, icon, desc }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAiGenerationMode(mode as any)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  aiGenerationMode === mode
                    ? 'border-purple-500 bg-purple-100 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Data Source Integration */}
        {aiGenerationMode !== 'manual' && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BeakerIcon className="w-5 h-5 text-blue-600" />
              Connect Research Data Sources
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select data from your lab notebook, experimental results, and statistical analysis to power AI-generated insights.
            </p>
            
            {/* Lab Notebook Entries */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lab Notebook Entries</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableNotebooks.map(notebook => (
                  <label key={notebook.id} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedDataSources.notebook.includes(notebook.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataSources(prev => ({
                            ...prev,
                            notebook: [...prev.notebook, notebook.id]
                          }));
                        } else {
                          setSelectedDataSources(prev => ({
                            ...prev,
                            notebook: prev.notebook.filter(id => id !== notebook.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{notebook.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experimental Results */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Experimental Results</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableResults.map(result => (
                  <label key={result.id} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedDataSources.results.includes(result.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataSources(prev => ({
                            ...prev,
                            results: [...prev.results, result.id]
                          }));
                        } else {
                          setSelectedDataSources(prev => ({
                            ...prev,
                            results: prev.results.filter(id => id !== result.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{result.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Statistical Analysis */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2">Statistical Analysis</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableStats.map(stat => (
                  <label key={stat.id} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedDataSources.stats.includes(stat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataSources(prev => ({
                            ...prev,
                            stats: [...prev.stats, stat.id]
                          }));
                        } else {
                          setSelectedDataSources(prev => ({
                            ...prev,
                            stats: prev.stats.filter(id => id !== stat.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{stat.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Prompt Customization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Instructions (Optional)</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Focus on statistical significance, emphasize methodology, highlight key breakthroughs..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* AI Generation Progress */}
        {isGenerating && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-green-50">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-green-600" />
              AI Generating Your Presentation
            </h3>
            <div className="mb-3">
              <div className="flex justify-between text-sm text-green-700 mb-1">
                <span>Progress</span>
                <span>{generationProgress}%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Form (only for manual mode) */}
        {aiGenerationMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Research Update Q3 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the presentation content and purpose"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <Select
              value={formData.template}
              onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as PresentationTemplate }))}
              required
            >
              <option value="Research Update">Research Update</option>
              <option value="Conference Talk">Conference Talk</option>
              <option value="Lab Meeting">Lab Meeting</option>
              <option value="Grant Proposal">Grant Proposal</option>
              <option value="Thesis Defense">Thesis Defense</option>
              <option value="Journal Club">Journal Club</option>
              <option value="Custom">Custom</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Sources (comma-separated)</label>
            <Input
              value={formData.dataSources}
              onChange={(e) => setFormData(prev => ({ ...prev, dataSources: e.target.value }))}
              placeholder="e.g., Lab notebook, Experimental results, Literature review"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Generate Presentation
            </Button>
          </div>
        </form>
        )}

        {/* AI Generation Button */}
        {aiGenerationMode !== 'manual' && !isGenerating && (
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={onAIGenerate}
              disabled={selectedDataSources.notebook.length === 0 && 
                       selectedDataSources.results.length === 0 && 
                       selectedDataSources.stats.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {aiGenerationMode === 'smart' ? 'Generate AI-Assisted Presentation' : 'Generate Full AI Presentation'}
            </Button>
          </div>
        )}

        {/* Close button when generating */}
        {isGenerating && (
          <div className="flex justify-end mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Presentation Detail Modal Component
const PresentationDetailModal: React.FC<{
  presentation: Presentation;
  onClose: () => void;
  onEdit: () => void;
}> = ({ presentation, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{presentation.title}</h2>
          <Button variant="outline" onClick={onClose}>✕</Button>
        </div>

        {/* Presentation Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Template:</span> {presentation.template}
            </div>
            <div>
              <span className="font-medium">Slides:</span> {presentation.slides.length}
            </div>
            <div>
              <span className="font-medium">Generated:</span> {presentation.generatedAt.toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Modified:</span> {presentation.lastModified.toLocaleDateString()}
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Data Sources:</span> {presentation.dataSources.join(', ')}
          </div>
        </div>

        {/* Slides Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Slides Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentation.slides.map(slide => (
              <div key={slide.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Slide {slide.slideNumber}: {slide.title}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Layout: {slide.layout}
                </div>
                <div className="text-xs text-gray-500">
                  {slide.content.text.length > 0 && `Text: ${slide.content.text.length} elements`}
                  {slide.content.charts.length > 0 && ` • Charts: ${slide.content.charts.length}`}
                  {slide.content.tables.length > 0 && ` • Tables: ${slide.content.tables.length}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onEdit}>
            Edit Presentation
          </Button>
          <Button>
            Export Presentation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutomatedPresentationsPage;
