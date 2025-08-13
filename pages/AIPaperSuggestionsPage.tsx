import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  PaperSuggestion, 
  ResearchInterest 
} from '../types';

const AIPaperSuggestionsPage: React.FC = () => {
  const [paperSuggestions, setPaperSuggestions] = useState<PaperSuggestion[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PaperSuggestion[]>([]);
  const [researchInterests, setResearchInterests] = useState<ResearchInterest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'journal'>('relevance');
  const [showInterestForm, setShowInterestForm] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
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
      },
      {
        id: '3',
        userId: 'user1',
        topic: 'Single-Cell RNA Sequencing',
        keywords: ['scRNA-seq', 'single-cell', 'transcriptomics', 'cell heterogeneity', 'bioinformatics'],
        priority: 'High',
        lastUpdated: new Date('2024-08-05')
      }
    ];

    const mockPapers: PaperSuggestion[] = [
      {
        id: '1',
        title: 'Novel CAR-T Cell Therapy for Solid Tumors: Overcoming the Tumor Microenvironment',
        abstract: 'This study presents a breakthrough in CAR-T cell therapy for solid tumors by engineering cells to overcome immunosuppressive tumor microenvironment barriers. Results show 60% complete response rate in preclinical models.',
        authors: ['Dr. Sarah Chen', 'Prof. Michael Rodriguez', 'Dr. Emily Watson'],
        journal: 'Nature Medicine',
        year: 2024,
        doi: '10.1038/s41591-024-02567-8',
        relevanceScore: 95,
        relevanceFactors: ['High keyword match', 'Recent publication', 'Top-tier journal', 'Directly related to research'],
        userInterests: ['Cancer Immunotherapy', 'CRISPR Gene Editing'],
        researchContext: 'Directly addresses your interest in cancer immunotherapy and could inform your CAR-T cell research',
        suggestedAt: new Date('2024-08-12'),
        read: false,
        saved: false,
        notes: ''
      },
      {
        id: '2',
        title: 'CRISPR-Cas9 Mediated Genome Editing in Primary Human T Cells for Enhanced Immunotherapy',
        abstract: 'We demonstrate efficient CRISPR-Cas9 editing in primary human T cells to enhance their therapeutic potential. This approach improves CAR-T cell persistence and efficacy.',
        authors: ['Dr. James Wilson', 'Dr. Lisa Park', 'Prof. David Kim'],
        journal: 'Cell',
        year: 2024,
        doi: '10.1016/j.cell.2024.06.045',
        relevanceScore: 92,
        relevanceFactors: ['CRISPR technology', 'T cell engineering', 'Immunotherapy application', 'High impact factor'],
        userInterests: ['CRISPR Gene Editing', 'Cancer Immunotherapy'],
        researchContext: 'Combines your interests in CRISPR and immunotherapy - perfect for your research direction',
        suggestedAt: new Date('2024-08-11'),
        read: false,
        saved: false,
        notes: ''
      },
      {
        id: '3',
        title: 'Single-Cell Transcriptomics Reveals Novel Cell States in Tumor-Infiltrating Lymphocytes',
        abstract: 'Using scRNA-seq, we identified previously unknown T cell states within the tumor microenvironment that correlate with immunotherapy response.',
        authors: ['Dr. Alex Thompson', 'Dr. Maria Rodriguez', 'Prof. Sarah Johnson'],
        journal: 'Science',
        year: 2024,
        doi: '10.1126/science.abc1234',
        relevanceScore: 88,
        relevanceFactors: ['Single-cell analysis', 'Immunology focus', 'Therapeutic implications', 'Cutting-edge technology'],
        userInterests: ['Single-Cell RNA Sequencing', 'Cancer Immunotherapy'],
        researchContext: 'Aligns with your scRNA-seq expertise and immunotherapy interests',
        suggestedAt: new Date('2024-08-10'),
        read: false,
        saved: false,
        notes: ''
      },
      {
        id: '4',
        title: 'Machine Learning Approaches for Predicting CRISPR Off-Target Effects',
        abstract: 'We developed a novel ML algorithm to predict CRISPR off-target effects with 95% accuracy, significantly improving the safety of gene editing applications.',
        authors: ['Dr. Robert Chen', 'Dr. Amanda Lee', 'Prof. Thomas Brown'],
        journal: 'Nature Biotechnology',
        year: 2024,
        doi: '10.1038/s41587-024-02067-9',
        relevanceScore: 85,
        relevanceFactors: ['CRISPR safety', 'Machine learning', 'Bioinformatics', 'Practical applications'],
        userInterests: ['CRISPR Gene Editing'],
        researchContext: 'Important for your CRISPR work - addresses safety concerns in gene editing',
        suggestedAt: new Date('2024-08-09'),
        read: false,
        saved: false,
        notes: ''
      },
      {
        id: '5',
        title: 'Spatial Transcriptomics in Cancer: Mapping the Tumor Landscape at Single-Cell Resolution',
        abstract: 'This study combines spatial information with single-cell transcriptomics to map the spatial organization of tumor cells and immune infiltrates.',
        authors: ['Dr. Jennifer Wang', 'Dr. Carlos Martinez', 'Prof. Rachel Green'],
        journal: 'Nature',
        year: 2024,
        doi: '10.1038/s41586-024-07567-8',
        relevanceScore: 82,
        relevanceFactors: ['Spatial transcriptomics', 'Single-cell technology', 'Cancer research', 'Innovative methodology'],
        userInterests: ['Single-Cell RNA Sequencing'],
        researchContext: 'Advances your scRNA-seq knowledge with spatial context - valuable for your research',
        suggestedAt: new Date('2024-08-08'),
        read: false,
        saved: false,
        notes: ''
      }
    ];

    setResearchInterests(mockInterests);
    setPaperSuggestions(mockPapers);
    setFilteredPapers(mockPapers);
  }, []);

  // Filter and sort papers
  useEffect(() => {
    let filtered = paperSuggestions.filter(paper => {
      const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesInterest = selectedInterest === 'All' || 
                             paper.userInterests.includes(selectedInterest);
      
      return matchesSearch && matchesInterest;
    });

    // Sort papers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'date':
          return b.year - a.year;
        case 'journal':
          return a.journal.localeCompare(b.journal);
        default:
          return 0;
      }
    });

    setFilteredPapers(filtered);
  }, [paperSuggestions, searchTerm, selectedInterest, sortBy]);

  const handleAddInterest = (interest: Omit<ResearchInterest, 'id' | 'lastUpdated'>) => {
    const newInterest: ResearchInterest = {
      ...interest,
      id: Date.now().toString(),
      lastUpdated: new Date()
    };
    setResearchInterests(prev => [...prev, newInterest]);
    setShowInterestForm(false);
  };

  const handleUpdateInterest = (id: string, updates: Partial<ResearchInterest>) => {
    setResearchInterests(prev => prev.map(interest => 
      interest.id === id 
        ? { ...interest, ...updates, lastUpdated: new Date() }
        : interest
    ));
  };

  const handleDeleteInterest = (id: string) => {
    setResearchInterests(prev => prev.filter(interest => interest.id !== id));
  };

  const handlePaperAction = (paperId: string, action: 'read' | 'saved', value: boolean) => {
    setPaperSuggestions(prev => prev.map(paper => 
      paper.id === paperId 
        ? { ...paper, [action]: value }
        : paper
    ));
  };

  const handleAddNotes = (paperId: string, notes: string) => {
    setPaperSuggestions(prev => prev.map(paper => 
      paper.id === paperId 
        ? { ...paper, notes }
        : paper
    ));
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Paper Suggestions</h1>
          <p className="text-gray-600">
            Get personalized paper recommendations based on your research interests. Our AI algorithm 
            analyzes your work and suggests the most relevant papers to advance your research.
          </p>
        </div>

        {/* Research Interests Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Research Interests</CardTitle>
              <Button onClick={() => setShowInterestForm(true)}>
                Add Interest
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {researchInterests.map(interest => (
                <div key={interest.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{interest.topic}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(interest.priority)}`}>
                      {interest.priority}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {interest.keywords.map(keyword => (
                      <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Updated: {interest.lastUpdated.toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateInterest(interest.id, { priority: interest.priority === 'High' ? 'Medium' : 'High' })}
                      >
                        Toggle Priority
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteInterest(interest.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paper Suggestions Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="max-w-xs"
              >
                <option value="All">All Interests</option>
                {researchInterests.map(interest => (
                  <option key={interest.id} value={interest.topic}>
                    {interest.topic}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-4">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'journal')}
                className="max-w-xs"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="date">Sort by Date</option>
                <option value="journal">Sort by Journal</option>
              </Select>
              <Button variant="outline">
                Refresh Suggestions
              </Button>
            </div>
          </div>
        </div>

        {/* Paper Suggestions */}
        <div className="grid gap-6">
          {filteredPapers.map(paper => (
            <Card key={paper.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(paper.relevanceScore)}`}>
                        {paper.relevanceScore}% Relevant
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                        {paper.journal}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        {paper.year}
                      </span>
                    </div>
                    <CardTitle className="text-lg mb-2 cursor-pointer hover:text-blue-600">
                      {paper.title}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>Authors:</strong> {paper.authors.join(', ')}
                    </div>
                    <p className="text-gray-700 mb-3">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {paper.userInterests.map(interest => (
                        <span key={interest} className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Why Relevant:</strong> {paper.researchContext}
                    </div>
                    <div className="text-sm text-gray-500">
                      Suggested on {paper.suggestedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div className="text-xs mb-2">DOI: {paper.doi}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <span>📖 {paper.read ? 'Read' : 'Unread'}</span>
                      <span>💾 {paper.saved ? 'Saved' : 'Not Saved'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Relevance Factors:</span> {paper.relevanceFactors.join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handlePaperAction(paper.id, 'read', !paper.read)}
                      className={paper.read ? 'text-green-600 border-green-600' : 'text-blue-600 border-blue-600'}
                    >
                      {paper.read ? 'Mark Unread' : 'Mark Read'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handlePaperAction(paper.id, 'saved', !paper.saved)}
                      className={paper.saved ? 'text-green-600 border-green-600' : 'text-blue-600 border-blue-600'}
                    >
                      {paper.saved ? 'Remove from Saved' : 'Save Paper'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`https://doi.org/${paper.doi}`, '_blank')}
                      className="text-purple-600 border-purple-600"
                    >
                      View Paper
                    </Button>
                  </div>
                </div>
                {paper.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-1">Your Notes:</div>
                    <div className="text-sm text-yellow-700">{paper.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Interest Form Modal */}
        {showInterestForm && (
          <AddInterestForm 
            onSubmit={handleAddInterest}
            onCancel={() => setShowInterestForm(false)}
          />
        )}
      </div>
    </div>
  );
};

// Add Interest Form Component
const AddInterestForm: React.FC<{
  onSubmit: (interest: Omit<ResearchInterest, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId: 'currentUser',
      topic: formData.topic,
      keywords: formData.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
      priority: formData.priority
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add Research Interest</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Research Topic</label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Cancer Immunotherapy, CRISPR Gene Editing"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g., immunotherapy, cancer, T cells, checkpoint inhibitors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Add Interest
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIPaperSuggestionsPage;
