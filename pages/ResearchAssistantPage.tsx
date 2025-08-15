import React, { useState, useEffect } from 'react';
import { LightbulbIcon, SearchIcon, BookOpenIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, SparklesIcon, ArrowUpIcon, ClockIcon, StarIcon } from '../components/icons';

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

const ResearchAssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'literature' | 'topics' | 'insights'>('assistant');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [researchQueries, setResearchQueries] = useState<ResearchQuery[]>([]);
  const [literatureResults, setLiteratureResults] = useState<LiteratureItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample research queries
  useEffect(() => {
    const sampleQueries: ResearchQuery[] = [
      {
        id: '1',
        question: 'How do I design a PCR experiment for gene expression analysis?',
        response: 'To design a PCR experiment for gene expression analysis, you\'ll need to consider several key factors:\n\n1. **Primer Design**: Design specific primers for your target gene and a housekeeping gene for normalization\n2. **RNA Extraction**: Use high-quality RNA extraction methods to prevent degradation\n3. **Reverse Transcription**: Convert RNA to cDNA using reverse transcriptase\n4. **Quantitative PCR**: Use qPCR with SYBR Green or TaqMan probes for quantification\n5. **Controls**: Include positive controls, negative controls, and no-template controls\n6. **Data Analysis**: Use the ΔΔCt method to calculate relative gene expression\n\nWould you like me to elaborate on any of these steps?',
        timestamp: new Date(Date.now() - 3600000),
        category: 'experimental_design',
        isFavorite: true
      },
      {
        id: '2',
        question: 'What statistical tests should I use for comparing two groups?',
        response: 'For comparing two groups, the choice of statistical test depends on your data characteristics:\n\n**Parametric Tests (when data is normally distributed):**\n- Independent t-test: for independent groups\n- Paired t-test: for related/matched groups\n\n**Non-parametric Tests (when data is not normally distributed):**\n- Mann-Whitney U test: for independent groups\n- Wilcoxon signed-rank test: for related groups\n\n**Before choosing:**\n1. Check normality using Shapiro-Wilk or Kolmogorov-Smirnov tests\n2. Check homogeneity of variance using Levene\'s test\n3. Consider sample size (parametric tests are more powerful with larger samples)\n\nFor small sample sizes (<30), non-parametric tests are often more appropriate.',
        timestamp: new Date(Date.now() - 7200000),
        category: 'statistics',
        isFavorite: false
      }
    ];
    setResearchQueries(sampleQueries);
  }, []);

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
    
    // Simulate AI response
    setTimeout(() => {
      const newQuery: ResearchQuery = {
        id: Date.now().toString(),
        question: query,
        response: `Here's a comprehensive answer to your question about "${query}":\n\nThis is a simulated AI response that would provide detailed, contextual information based on your research question. The actual AI would analyze your query and provide relevant scientific information, methodology suggestions, and references.\n\nKey points to consider:\n• Research methodology\n• Relevant literature\n• Best practices\n• Common pitfalls to avoid\n\nWould you like me to elaborate on any specific aspect?`,
        timestamp: new Date(),
        category: 'general',
        isFavorite: false
      };
      
      setResearchQueries(prev => [newQuery, ...prev]);
      setQuery('');
      setIsLoading(false);
    }, 2000);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'assistant', label: 'AI Assistant', icon: ChatBubbleLeftRightIcon },
              { id: 'literature', label: 'Literature Search', icon: BookOpenIcon },
              { id: 'topics', label: 'Research Topics', icon: DocumentTextIcon },
              { id: 'insights', label: 'AI Insights', icon: SparklesIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Chat Interface */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask Your Research Question</h3>
              
              <div className="space-y-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about research methodology, experimental design, data analysis, or scientific concepts..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                
                <button
                  onClick={handleQuerySubmit}
                  disabled={isLoading || !query.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon className="w-4 h-4" />
                      <span>Ask Question</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Example Questions:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• "How do I design a controlled experiment?"</li>
                  <li>• "What statistical test should I use for my data?"</li>
                  <li>• "How do I write a research proposal?"</li>
                  <li>• "What are the latest methods in my field?"</li>
                </ul>
              </div>
            </div>

            {/* Recent Queries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Questions</h3>
              
              {researchQueries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No questions asked yet. Start by asking your first research question!</p>
              ) : (
                <div className="space-y-4">
                  {researchQueries.slice(0, 3).map((query) => (
                    <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(query.category)}`}>
                          {query.category.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => toggleFavorite(query.id)}
                          className={`p-1 rounded transition-colors ${
                            query.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <StarIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{query.question}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{query.response}</p>
                      
                      <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                        <ClockIcon className="w-3 h-3" />
                        <span>{query.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'literature' && (
          <div className="space-y-6">
            {/* Search Interface */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for research papers, authors, or topics..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Relevance</option>
                    <option value="90">90%+ Relevant</option>
                    <option value="80">80%+ Relevant</option>
                    <option value="70">70%+ Relevant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Literature Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Literature Results</h3>
              
              {filteredLiterature.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No literature found. Try adjusting your search terms.</p>
              ) : (
                <div className="space-y-6">
                  {filteredLiterature.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.authors.join(', ')} • {item.journal} • {item.year}
                          </p>
                          <p className="text-gray-700 mb-3">{item.abstract}</p>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-500 mb-1">Relevance</div>
                          <div className="text-2xl font-bold text-blue-600">{item.relevance}%</div>
                          <div className="text-sm text-gray-500 mt-1">{item.citations} citations</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          DOI: <span className="text-blue-600">{item.doi}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                            View Paper
                          </button>
                          <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors">
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchTopics.map((topic) => (
              <div key={topic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    topic.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    topic.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{topic.description}</p>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {topic.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Estimated Time:</div>
                  <div className="font-medium">{topic.estimatedTime}</div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Resources:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {topic.resources.map((resource, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Start Learning
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Research Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">🔬 Trending Research Areas</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Single-cell multi-omics analysis</li>
                  <li>• AI-driven drug discovery</li>
                  <li>• CRISPR-based therapeutics</li>
                  <li>• Quantum computing in biology</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">📊 Research Methodology Trends</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Reproducible research practices</li>
                  <li>• Open science initiatives</li>
                  <li>• Collaborative research networks</li>
                  <li>• Data sharing platforms</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">💡 Innovation Opportunities</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Cross-disciplinary collaborations</li>
                  <li>• Citizen science projects</li>
                  <li>• Open-source research tools</li>
                  <li>• Sustainable research practices</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">⚠️ Research Challenges</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Data reproducibility issues</li>
                  <li>• Publication bias</li>
                  <li>• Funding constraints</li>
                  <li>• Ethical considerations</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchAssistantPage;
