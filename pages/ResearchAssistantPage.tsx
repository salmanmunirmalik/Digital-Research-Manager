/**
 * Consolidated Research Assistant Page
 * Includes AI Assistant, Literature Search, Research Topics, AI Insights, and Paper Library
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  LightbulbIcon, 
  SearchIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  ArrowUpIcon, 
  ClockIcon, 
  StarIcon,
  PlusIcon,
  XMarkIcon,
  DownloadIcon,
  TagIcon,
  FolderIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  LinkIcon,
  BeakerIcon,
  QuestionMarkCircleIcon,
  TrendingUpIcon,
  ChartBarIcon
} from '../components/icons';

interface ResearchQuery {
  id: string;
  question: string;
  response: string;
  timestamp: Date;
  category: string;
  isFavorite: boolean;
}

interface LiteratureItem {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  journal: string;
  year: number;
  doi: string;
  relevance: number;
  citations: number;
}

interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  resources: string[];
}

interface Paper {
  id?: string;
  doi?: string;
  pmid?: string;
  arxiv_id?: string;
  title: string;
  authors: any[];
  abstract?: string;
  journal?: string;
  year: number;
  citation_count?: number;
  url?: string;
  pdf_url?: string;
  save_type?: string;
  ai_summary?: string;
  ai_key_findings?: string[];
  my_notes?: string;
  tags?: string[];
  is_favorite?: boolean;
  read_status?: string;
  folder?: string;
}

const ResearchAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assistant' | 'literature-papers'>('assistant');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [researchQueries, setResearchQueries] = useState<ResearchQuery[]>([]);
  const [literatureResults, setLiteratureResults] = useState<LiteratureItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paper Library states
  const [paperLibraryView, setPaperLibraryView] = useState<'library' | 'add-paper'>('library');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [paperSearchTerm, setPaperSearchTerm] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [fetchedPaper, setFetchedPaper] = useState<Paper | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saveType, setSaveType] = useState<'full' | 'summary_only' | 'both'>('full');
  const [myNotes, setMyNotes] = useState('');
  const [tags, setTags] = useState('');
  const [folder, setFolder] = useState('');
  const [showOrcidImport, setShowOrcidImport] = useState(false);
  const [orcidId, setOrcidId] = useState('');
  
  // AI Learning Status
  const [aiLearningStatus, setAiLearningStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  
  // AI Training states
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState('');
  const [personalizedMode, setPersonalizedMode] = useState(true);

  // Sample research queries
  useEffect(() => {
    // Start with empty queries - users can begin fresh conversations
    setResearchQueries([]);
    fetchAiLearningStatus();
  }, []);

  const fetchAiLearningStatus = async () => {
    try {
      setLoadingStatus(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/ai-training/training-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiLearningStatus(response.data);
    } catch (error) {
      console.error('Error fetching AI learning status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Sample literature results
  useEffect(() => {
    const sampleLiterature: LiteratureItem[] = [
      {
        id: '1',
        title: 'Recent advances in CRISPR-Cas9 genome editing technology',
        authors: ['Zhang, F.', 'Doudna, J.A.', 'Charpentier, E.'],
        abstract: 'This review discusses the latest developments in CRISPR-Cas9 technology, including improved specificity, reduced off-target effects, and novel applications in therapeutic genome editing.',
        journal: 'Nature Reviews Genetics',
        year: 2024,
        doi: '10.1038/nrg.2024.001',
        relevance: 95,
        citations: 1247
      },
      {
        id: '2',
        title: 'Machine learning approaches for drug discovery and development',
        authors: ['Smith, A.', 'Johnson, B.', 'Williams, C.'],
        abstract: 'We present a comprehensive overview of machine learning applications in drug discovery, covering target identification, compound screening, and clinical trial optimization.',
        journal: 'Nature Machine Intelligence',
        year: 2023,
        doi: '10.1038/s42256-023-00123-4',
        relevance: 88,
        citations: 892
      },
      {
        id: '3',
        title: 'Single-cell RNA sequencing in cancer research',
        authors: ['Brown, D.', 'Davis, E.', 'Miller, F.'],
        abstract: 'This study demonstrates the application of single-cell RNA sequencing to identify novel cell populations and understand tumor heterogeneity in various cancer types.',
        journal: 'Cell',
        year: 2024,
        doi: '10.1016/j.cell.2024.01.015',
        relevance: 92,
        citations: 156
      }
    ];
    setLiteratureResults(sampleLiterature);
  }, []);

  // Fetch AI training status
  useEffect(() => {
    fetchTrainingStatus();
  }, []);

  const fetchTrainingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/ai-training/training-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainingStatus(response.data);
    } catch (error) {
      console.error('Error fetching training status:', error);
    }
  };

  const handleTrainAI = async () => {
    setIsTraining(true);
    setTrainingProgress('Starting training...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/ai-training/train', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTrainingProgress(`Training complete! Processed ${response.data.processed} documents.`);
      await fetchTrainingStatus();
      
      setTimeout(() => {
        setIsTraining(false);
        setTrainingProgress('');
      }, 3000);
    } catch (error) {
      console.error('Error training AI:', error);
      setTrainingProgress('Training failed. Please try again.');
      setIsTraining(false);
    }
  };

  const handleClearTraining = async () => {
    if (!confirm('Are you sure you want to clear all training data? This cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/ai-training/clear-training', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchTrainingStatus();
      alert('Training data cleared successfully');
    } catch (error) {
      console.error('Error clearing training:', error);
      alert('Failed to clear training data');
    }
  };

  const fetchMyPapers = async () => {
    try {
      setLoadingPapers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/papers/my-papers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setPapers(response.data);
      } else {
        setPapers([]);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      setPapers([]);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleFetchPaper = async () => {
    if (!identifier.trim()) {
      alert('Please enter a DOI, PMID, or arXiv ID');
      return;
    }

    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/papers/fetch', 
        { identifier: identifier.trim() },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setFetchedPaper(response.data);
    } catch (error: any) {
      console.error('Error fetching paper:', error);
      alert(error.response?.data?.error || 'Failed to fetch paper');
    } finally {
      setFetching(false);
    }
  };

  const handleSavePaper = async () => {
    if (!fetchedPaper) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/papers/save-paper', {
        paper: fetchedPaper,
        save_type: saveType,
        my_notes: myNotes || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        folder: folder || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Paper saved to your library!');
      setPaperLibraryView('library');
      setFetchedPaper(null);
      setIdentifier('');
      setMyNotes('');
      setTags('');
      setFolder('');
      fetchMyPapers();
    } catch (error) {
      console.error('Error saving paper:', error);
      alert('Failed to save paper');
    }
  };

  const handleOrcidImport = async () => {
    if (!orcidId.trim()) {
      alert('Please enter an ORCID ID');
      return;
    }

    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/papers/fetch-by-orcid',
        { orcid: orcidId.trim() },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert(`✅ Found ${response.data.count} papers! You can now save them to your library.`);
      setShowOrcidImport(false);
    } catch (error: any) {
      console.error('Error fetching by ORCID:', error);
      alert('Failed to fetch papers from ORCID');
    } finally {
      setFetching(false);
    }
  };

  // Sample research topics
  const researchTopics: ResearchTopic[] = [
    {
      id: '1',
      title: 'CRISPR-Cas9 Genome Editing',
      description: 'Learn the fundamentals of CRISPR-Cas9 technology for precise genome editing in various organisms.',
      keywords: ['CRISPR', 'genome editing', 'genetics', 'biotechnology'],
      difficulty: 'intermediate',
      estimatedTime: '2-3 months',
      resources: ['Lab protocols', 'Safety guidelines', 'Analysis software']
    },
    {
      id: '2',
      title: 'Single-Cell Analysis',
      description: 'Master single-cell sequencing techniques for understanding cellular heterogeneity and gene expression.',
      keywords: ['single-cell', 'sequencing', 'bioinformatics', 'transcriptomics'],
      difficulty: 'advanced',
      estimatedTime: '4-6 months',
      resources: ['Sequencing protocols', 'Bioinformatics tools', 'Statistical methods']
    },
    {
      id: '3',
      title: 'Machine Learning in Biology',
      description: 'Apply machine learning algorithms to analyze biological data and make predictions.',
      keywords: ['machine learning', 'bioinformatics', 'data analysis', 'AI'],
      difficulty: 'intermediate',
      estimatedTime: '3-4 months',
      resources: ['Python tutorials', 'ML frameworks', 'Biological datasets']
    }
  ];

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Call personalized AI endpoint if personalized mode is enabled
      if (personalizedMode && trainingStatus?.trained) {
        const response = await axios.post('/api/ai-training/chat', {
          question: query,
          include_context: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const newQuery: ResearchQuery = {
          id: Date.now().toString(),
          question: query,
          response: response.data.answer,
          timestamp: new Date(),
          category: 'general',
          isFavorite: false
        };
        
        setResearchQueries(prev => [newQuery, ...prev]);
        setQuery('');
        setIsLoading(false);
        return;
      }
      
      // Fallback to simulated response
    setTimeout(() => {
      const newQuery: ResearchQuery = {
        id: Date.now().toString(),
        question: query,
          response: `Here's a comprehensive answer to your question about "${query}":\n\nThis is a simulated AI response. ${personalizedMode && !trainingStatus?.trained ? 'Please train your AI first to get personalized responses!' : 'Enable personalized mode to get answers based on your research.'}\n\nKey points to consider:\n• Research methodology\n• Relevant literature\n• Best practices\n• Common pitfalls to avoid\n\nWould you like me to elaborate on any specific aspect?`,
        timestamp: new Date(),
        category: 'general',
        isFavorite: false
      };
      
      setResearchQueries(prev => [newQuery, ...prev]);
      setQuery('');
      setIsLoading(false);
    }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setResearchQueries(prev => prev.map(q => 
      q.id === id ? { ...q, isFavorite: !q.isFavorite } : q
    ));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      experimental_design: 'bg-blue-100 text-blue-800',
      statistics: 'bg-green-100 text-green-800',
      methodology: 'bg-purple-100 text-purple-800',
      literature: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  const filteredLiterature = literatureResults.filter(item => 
    selectedCategory === 'all' || item.relevance >= parseInt(selectedCategory)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        data-testid="research-assistant-page"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
              <LightbulbIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Research Assistant</h1>
              <p className="text-gray-600">Get AI-powered help with your research questions and literature search</p>
            </div>
          </div>
          
              {/* AI Learning Status Indicator */}
              {aiLearningStatus && aiLearningStatus.documents && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${aiLearningStatus.documents.total > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        AI Learning Status
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {aiLearningStatus.documents.total} documents indexed
                    </span>
                  </div>

                  {aiLearningStatus.documents.total > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {aiLearningStatus.documents.notebooks > 0 && (
                        <div className="bg-blue-50 rounded p-2 text-center">
                          <div className="text-lg font-bold text-blue-900">{aiLearningStatus.documents.notebooks}</div>
                          <div className="text-xs text-blue-700">Lab Entries</div>
                        </div>
                      )}
                      {aiLearningStatus.documents.papers > 0 && (
                        <div className="bg-purple-50 rounded p-2 text-center">
                          <div className="text-lg font-bold text-purple-900">{aiLearningStatus.documents.papers}</div>
                          <div className="text-xs text-purple-700">Papers</div>
                        </div>
                      )}
                      {aiLearningStatus.documents.protocols > 0 && (
                        <div className="bg-green-50 rounded p-2 text-center">
                          <div className="text-lg font-bold text-green-900">{aiLearningStatus.documents.protocols}</div>
                          <div className="text-xs text-green-700">Protocols</div>
                        </div>
                      )}
                      {aiLearningStatus.documents.research_data > 0 && (
                        <div className="bg-orange-50 rounded p-2 text-center">
                          <div className="text-lg font-bold text-orange-900">{aiLearningStatus.documents.research_data}</div>
                          <div className="text-xs text-orange-700">Data</div>
                        </div>
                      )}
                      {aiLearningStatus.documents.negative_results > 0 && (
                        <div className="bg-red-50 rounded p-2 text-center">
                          <div className="text-lg font-bold text-red-900">{aiLearningStatus.documents.negative_results}</div>
                          <div className="text-xs text-red-700">Failed Exp.</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p>🧠 Your AI is ready to learn! Start creating content and it will automatically learn from your research.</p>
                    </div>
                  )}
                </div>
              )}
        </div>

        {/* Navigation Tabs */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8"
          data-testid="research-assistant-tabs"
        >
          <div className="flex space-x-1 flex-wrap" role="tablist">
            {[
              { id: 'assistant', label: 'AI Assistant', icon: ChatBubbleLeftRightIcon },
              { id: 'literature-papers', label: 'Literature & Papers', icon: BookOpenIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'literature-papers') {
                    fetchMyPapers();
                  }
                }}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                data-testid={`research-assistant-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'assistant' && (
          <div
            className="h-[calc(100vh-280px)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            data-testid="assistant-tab-panel"
          >
            {/* Chat Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Research Assistant</h3>
                  <p className="text-sm text-gray-600">Ask me anything about your research</p>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
              data-testid="assistant-chat-history"
            >
              {researchQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <LightbulbIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Research Assistant</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    Ask me anything about experimental design, data analysis, methodology, or scientific concepts.
                  </p>
                  
                  {/* Example Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    <button
                      onClick={() => setQuery('How do I design a controlled experiment?')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1">Experimental Design</div>
                      <div className="text-xs text-gray-600">How do I design a controlled experiment?</div>
                    </button>
                    <button
                      onClick={() => setQuery('What statistical test should I use for my data?')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1">Data Analysis</div>
                      <div className="text-xs text-gray-600">What statistical test should I use?</div>
                    </button>
                    <button
                      onClick={() => setQuery('How do I write a research proposal?')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1">Proposal Writing</div>
                      <div className="text-xs text-gray-600">How do I write a research proposal?</div>
                    </button>
                    <button
                      onClick={() => setQuery('What are the latest methods in my field?')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1">Latest Methods</div>
                      <div className="text-xs text-gray-600">What are the latest methods?</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {researchQueries.map((query) => (
                    <div key={query.id} className="space-y-4">
                      {/* User Question */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">You</span>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-gray-900">{query.question}</p>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleFavorite(query.id)}
                                className={`p-1 rounded transition-colors ${
                                  query.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                                }`}
                              >
                                <StarIcon className="w-4 h-4" />
                              </button>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(query.category)}`}>
                                {query.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {query.response}
                          </div>
                          <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                            <ClockIcon className="w-3 h-3" />
                            <span>{query.timestamp.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div
              className="border-t border-gray-200 px-6 py-4 bg-gray-50"
              data-testid="assistant-input-area"
            >
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask me anything about your research..."
                    rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleQuerySubmit();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleQuerySubmit}
                  disabled={isLoading || !query.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon className="w-5 h-5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{researchQueries.length} conversation{researchQueries.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'literature-papers' && (
          <div data-testid="literature-tab-panel">
            {/* Literature & Papers Header */}
            <div className="mb-6 flex items-center justify-between" data-testid="literature-header">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Literature & Papers</h2>
                <p className="text-gray-600 text-sm">Search for papers and manage your personal library</p>
                  </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowOrcidImport(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <AcademicCapIcon className="w-4 h-4" />
                  <span>Import from ORCID</span>
                </button>
                <button
                  onClick={() => setPaperLibraryView('add-paper')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Paper</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="mb-6 flex space-x-2 border-b border-gray-200" data-testid="paper-subtabs">
                        <button
                onClick={() => {
                  setPaperLibraryView('library');
                  fetchMyPapers();
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  paperLibraryView === 'library'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Library
              </button>
              <button
                onClick={() => setPaperLibraryView('add-paper')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  paperLibraryView === 'add-paper'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Add Paper
                        </button>
                      </div>
                      
            {/* Library View */}
            {paperLibraryView === 'library' && (
              <div data-testid="paper-library-view">
                {loadingPapers ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your library...</p>
                  </div>
                ) : papers.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your library is empty</h3>
                    <p className="text-gray-600 mb-4">
                      Start building your personal research library by adding papers via DOI, PMID, or arXiv ID
                    </p>
                    <button
                      onClick={() => setPaperLibraryView('add-paper')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Your First Paper
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {papers.map((paper) => (
                      <div key={paper.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{paper.title}</h3>
                            
                            <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
                              {paper.authors && paper.authors.length > 0 && (
                                <span>
                                  {paper.authors[0].firstName} {paper.authors[0].lastName}
                                  {paper.authors.length > 1 && ` et al.`}
                                </span>
                              )}
                              {paper.journal && <span>• {paper.journal}</span>}
                              {paper.year && <span>• {paper.year}</span>}
                      </div>

                            {paper.ai_summary && (
                              <div className="bg-purple-50 border-l-4 border-purple-400 p-3 mb-3">
                                <div className="flex items-start space-x-2">
                                  <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium text-purple-800 mb-1">AI Summary</div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{paper.ai_summary}</p>
                    </div>
                                </div>
                              </div>
                            )}

                            {paper.tags && paper.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {paper.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {tag}
                                  </span>
                  ))}
                </div>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {paper.save_type && (
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                  Saved: {paper.save_type.replace('_', ' ')}
                                </span>
                              )}
                              {paper.read_status && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                  {paper.read_status.replace('_', ' ')}
                                </span>
                              )}
                              {paper.is_favorite && (
                                <StarIcon className="w-5 h-5 text-yellow-500" />
              )}
            </div>
                        </div>
                        
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                            >
                              <LinkIcon className="w-4 h-4" />
                              <span>View</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
          </div>
        )}

            {/* Add Paper View */}
            {paperLibraryView === 'add-paper' && (
              <div className="max-w-3xl mx-auto" data-testid="paper-add-view">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Add Paper to Library</h2>
                  
                  {/* Fetch Paper Section */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter DOI, PMID, or arXiv ID
                      </label>
                      <div className="flex space-x-2">
                    <input
                      type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g., 10.1038/nature12373 or PMID:23722158"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleFetchPaper()}
                        />
                        <button
                          onClick={handleFetchPaper}
                          disabled={fetching}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {fetching ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Fetching...</span>
                            </>
                          ) : (
                            <>
                              <SearchIcon className="w-5 h-5" />
                              <span>Fetch</span>
                            </>
                          )}
                        </button>
                  </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports DOI, PMID, and arXiv ID - automatically fetches from CrossRef, PubMed, or arXiv
                      </p>
                </div>
                
                    {/* Fetched Paper Display */}
                    {fetchedPaper && (
                      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{fetchedPaper.title}</h3>
                            <div className="text-sm text-gray-600">
                              {fetchedPaper.authors && fetchedPaper.authors.length > 0 && (
                                <span>
                                  {fetchedPaper.authors.slice(0, 3).map((a: any) => `${a.firstName} ${a.lastName}`).join(', ')}
                                  {fetchedPaper.authors.length > 3 && ` et al.`}
                                </span>
                              )}
                              {fetchedPaper.journal && ` · ${fetchedPaper.journal}`}
                              {fetchedPaper.year && ` · ${fetchedPaper.year}`}
                </div>
              </div>
                          <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>

                        {fetchedPaper.abstract && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-3">{fetchedPaper.abstract}</p>
                        )}

                        {/* Save Options */}
                        <div className="border-t border-green-200 pt-4 mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            💾 How do you want to save this?
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="full"
                                checked={saveType === 'full'}
                                onChange={(e) => setSaveType(e.target.value as any)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">Save full paper (complete metadata & abstract)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="summary_only"
                                checked={saveType === 'summary_only'}
                                onChange={(e) => setSaveType(e.target.value as any)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">Save AI summary only (when AI integrated)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="both"
                                checked={saveType === 'both'}
                                onChange={(e) => setSaveType(e.target.value as any)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">Save both full paper & AI summary</span>
                            </label>
                        </div>
                        
                          <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                              <label className="block text-xs text-gray-600 mb-1">Folder (optional)</label>
                              <input
                                type="text"
                                value={folder}
                                onChange={(e) => setFolder(e.target.value)}
                                placeholder="e.g., Gene Therapy"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Tags (comma-separated)</label>
                              <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g., CRISPR, review"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                        </div>
                      </div>
                      
                          <div className="mt-3">
                            <label className="block text-xs text-gray-600 mb-1">My Notes (optional)</label>
                            <textarea
                              value={myNotes}
                              onChange={(e) => setMyNotes(e.target.value)}
                              placeholder="Add personal notes about this paper..."
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={2}
                            />
                        </div>
                        
                          <button
                            onClick={handleSavePaper}
                            className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center space-x-2"
                          >
                            <DownloadIcon className="w-5 h-5" />
                            <span>Save to Library</span>
                          </button>
                        </div>
              </div>
                    )}
                      </div>
                    </div>
                </div>
              )}
          </div>
        )}
              </div>
              
      {/* ORCID Import Modal */}
      {showOrcidImport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="orcid-modal-overlay"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" data-testid="orcid-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Papers from ORCID</h3>
              <button
                onClick={() => setShowOrcidImport(false)}
                className="text-gray-400 hover:text-gray-600"
                data-testid="orcid-modal-close"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              </div>
              
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ORCID ID
                </label>
                <input
                  type="text"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="e.g., 0000-0002-1825-0097"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically fetches all your publications from ORCID
                </p>
              </div>
              
              <button
                onClick={handleOrcidImport}
                disabled={fetching}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                data-testid="orcid-modal-submit"
              >
                {fetching ? 'Fetching...' : 'Import All Papers'}
              </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ResearchAssistantPage;
