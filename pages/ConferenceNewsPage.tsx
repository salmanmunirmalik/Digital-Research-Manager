import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  ConferenceEvent, 
  ResearchInterest 
} from '../types';

const ConferenceNewsPage: React.FC = () => {
  const [conferences, setConferences] = useState<ConferenceEvent[]>([]);
  const [filteredConferences, setFilteredConferences] = useState<ConferenceEvent[]>([]);
  const [researchInterests, setResearchInterests] = useState<ResearchInterest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'location' | 'type'>('date');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
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

    const mockConferences: ConferenceEvent[] = [
      {
        id: '1',
        title: 'American Association for Cancer Research (AACR) Annual Meeting 2025',
        description: 'The premier cancer research conference featuring cutting-edge discoveries in cancer biology, prevention, diagnosis, and treatment. Special focus on immunotherapy and precision medicine.',
        type: 'Conference',
        category: 'Cancer Research',
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-04-19'),
        location: 'San Diego, CA, USA',
        venue: 'San Diego Convention Center',
        organizer: 'AACR',
        website: 'https://www.aacr.org/meeting/aacr-annual-meeting-2025/',
        registrationDeadline: new Date('2025-03-15'),
        abstractDeadline: new Date('2025-01-15'),
        earlyBirdDeadline: new Date('2025-02-15'),
        relevanceScore: 95,
        relevanceFactors: ['Directly matches cancer immunotherapy interest', 'High impact factor', 'Networking opportunities'],
        userInterests: ['Cancer Immunotherapy'],
        registrationFee: {
          early: 850,
          regular: 1100,
          student: 450,
          currency: 'USD'
        },
        features: [
          'Keynote speakers from top institutions',
          'Poster sessions',
          'Networking events',
          'Career development workshops',
          'Exhibition hall'
        ],
        tags: ['cancer', 'immunotherapy', 'precision medicine', 'clinical trials', 'biomarkers'],
        saved: false,
        notes: ''
      },
      {
        id: '2',
        title: 'CRISPR Therapeutics Summit 2025',
        description: 'Leading conference on CRISPR technology applications in therapeutics, featuring the latest advances in gene editing for disease treatment and drug development.',
        type: 'Summit',
        category: 'Gene Editing',
        startDate: new Date('2025-03-20'),
        endDate: new Date('2025-03-22'),
        location: 'Boston, MA, USA',
        venue: 'Boston Marriott Copley Place',
        organizer: 'Cambridge Healthtech Institute',
        website: 'https://crisprsummit.com/2025',
        registrationDeadline: new Date('2025-02-20'),
        abstractDeadline: new Date('2025-01-20'),
        earlyBirdDeadline: new Date('2025-02-05'),
        relevanceScore: 92,
        relevanceFactors: ['Perfect match for CRISPR interest', 'Industry-focused', 'Practical applications'],
        userInterests: ['CRISPR Gene Editing'],
        registrationFee: {
          early: 1200,
          regular: 1500,
          student: 600,
          currency: 'USD'
        },
        features: [
          'Expert panels on clinical applications',
          'Case studies from industry leaders',
          'Regulatory discussions',
          'Networking sessions',
          'Technology showcase'
        ],
        tags: ['CRISPR', 'gene editing', 'therapeutics', 'clinical trials', 'drug development'],
        saved: false,
        notes: ''
      },
      {
        id: '3',
        title: 'Single Cell Genomics Conference 2025',
        description: 'International conference on single-cell technologies, computational biology, and their applications in understanding cellular heterogeneity and disease mechanisms.',
        type: 'Conference',
        category: 'Genomics',
        startDate: new Date('2025-06-10'),
        endDate: new Date('2025-06-12'),
        location: 'Amsterdam, Netherlands',
        venue: 'Amsterdam RAI Exhibition and Convention Centre',
        organizer: 'European Society for Single Cell Genomics',
        website: 'https://singlecellgenomics.eu/2025',
        registrationDeadline: new Date('2025-05-10'),
        abstractDeadline: new Date('2025-04-10'),
        earlyBirdDeadline: new Date('2025-04-25'),
        relevanceScore: 88,
        relevanceFactors: ['Matches scRNA-seq interest', 'International scope', 'Computational focus'],
        userInterests: ['Single-Cell RNA Sequencing'],
        registrationFee: {
          early: 650,
          regular: 850,
          student: 350,
          currency: 'EUR'
        },
        features: [
          'Technical workshops',
          'Software demonstrations',
          'Poster presentations',
          'Industry exhibitions',
          'Networking dinners'
        ],
        tags: ['single-cell', 'genomics', 'transcriptomics', 'bioinformatics', 'computational biology'],
        saved: false,
        notes: ''
      },
      {
        id: '4',
        title: 'Immuno-Oncology World Congress 2025',
        description: 'Focused conference on the intersection of immunology and oncology, featuring the latest developments in cancer immunotherapy and combination therapies.',
        type: 'Congress',
        category: 'Immuno-Oncology',
        startDate: new Date('2025-05-05'),
        endDate: new Date('2025-05-07'),
        location: 'Miami, FL, USA',
        venue: 'Miami Beach Convention Center',
        organizer: 'Immuno-Oncology World',
        website: 'https://immuno-oncology-world.com/2025',
        registrationDeadline: new Date('2025-04-05'),
        abstractDeadline: new Date('2025-03-05'),
        earlyBirdDeadline: new Date('2025-03-20'),
        relevanceScore: 90,
        relevanceFactors: ['High relevance to immunotherapy research', 'Combination therapy focus', 'Clinical applications'],
        userInterests: ['Cancer Immunotherapy'],
        registrationFee: {
          early: 950,
          regular: 1200,
          student: 500,
          currency: 'USD'
        },
        features: [
          'Clinical trial updates',
          'Biomarker discovery sessions',
          'Industry partnerships forum',
          'Patient advocacy panels',
          'Technology innovation showcase'
        ],
        tags: ['immuno-oncology', 'cancer immunotherapy', 'combination therapy', 'biomarkers', 'clinical trials'],
        saved: false,
        notes: ''
      },
      {
        id: '5',
        title: 'Gene Editing Safety & Ethics Workshop',
        description: 'Intensive workshop focusing on safety considerations, ethical implications, and regulatory aspects of gene editing technologies in research and clinical applications.',
        type: 'Workshop',
        category: 'Gene Editing',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-02-16'),
        location: 'Washington, DC, USA',
        venue: 'National Academy of Sciences',
        organizer: 'National Academy of Sciences',
        website: 'https://nas.edu/gene-editing-workshop-2025',
        registrationDeadline: new Date('2025-01-15'),
        abstractDeadline: new Date('2025-01-01'),
        earlyBirdDeadline: new Date('2025-01-10'),
        relevanceScore: 85,
        relevanceFactors: ['Important for CRISPR safety', 'Regulatory knowledge', 'Ethical considerations'],
        userInterests: ['CRISPR Gene Editing'],
        registrationFee: {
          early: 400,
          regular: 500,
          student: 200,
          currency: 'USD'
        },
        features: [
          'Expert-led discussions',
          'Case study analysis',
          'Regulatory updates',
          'Ethics panel discussions',
          'Networking opportunities'
        ],
        tags: ['gene editing', 'safety', 'ethics', 'regulation', 'CRISPR'],
        saved: false,
        notes: ''
      },
      {
        id: '6',
        title: 'Bioinformatics for Single-Cell Analysis',
        description: 'Hands-on workshop covering computational methods, tools, and best practices for analyzing single-cell genomics data.',
        type: 'Workshop',
        category: 'Bioinformatics',
        startDate: new Date('2025-07-20'),
        endDate: new Date('2025-07-22'),
        location: 'San Francisco, CA, USA',
        venue: 'UCSF Mission Bay Conference Center',
        organizer: 'UCSF Bioinformatics Core',
        website: 'https://bioinformatics.ucsf.edu/single-cell-workshop-2025',
        registrationDeadline: new Date('2025-06-20'),
        abstractDeadline: new Date('2025-06-01'),
        earlyBirdDeadline: new Date('2025-06-10'),
        relevanceScore: 87,
        relevanceFactors: ['Directly relevant to scRNA-seq work', 'Hands-on training', 'Practical skills'],
        userInterests: ['Single-Cell RNA Sequencing'],
        registrationFee: {
          early: 750,
          regular: 900,
          student: 400,
          currency: 'USD'
        },
        features: [
          'Hands-on coding sessions',
          'Software tutorials',
          'Data analysis projects',
          'Expert Q&A sessions',
          'Resource sharing'
        ],
        tags: ['bioinformatics', 'single-cell', 'data analysis', 'computational biology', 'R/Python'],
        saved: false,
        notes: ''
      }
    ];

    setResearchInterests(mockInterests);
    setConferences(mockConferences);
    setFilteredConferences(mockConferences);
  }, []);

  // Filter and sort conferences
  useEffect(() => {
    let filtered = conferences.filter(conference => {
      const matchesSearch = conference.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conference.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conference.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesInterest = selectedInterest === 'All' || 
                             conference.userInterests.includes(selectedInterest);
      
      const matchesTimeframe = selectedTimeframe === 'all' || 
                              isInTimeframe(conference.startDate, selectedTimeframe);
      
      return matchesSearch && matchesInterest && matchesTimeframe;
    });

    // Sort conferences
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return a.startDate.getTime() - b.startDate.getTime();
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'location':
          return a.location.localeCompare(b.location);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    setFilteredConferences(filtered);
  }, [conferences, searchTerm, selectedInterest, selectedTimeframe, sortBy]);

  const isInTimeframe = (date: Date, timeframe: string): boolean => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeframe) {
      case 'month':
        return diffDays <= 30;
      case 'quarter':
        return diffDays <= 90;
      case 'year':
        return diffDays <= 365;
      default:
        return true;
    }
  };

  const handleAddInterest = (interest: Omit<ResearchInterest, 'id' | 'lastUpdated'>) => {
    const newInterest: ResearchInterest = {
      ...interest,
      id: Date.now().toString(),
      lastUpdated: new Date()
    };
    setResearchInterests(prev => [...prev, newInterest]);
    setShowInterestForm(false);
  };

  const handleSaveConference = (conferenceId: string) => {
    setConferences(prev => prev.map(conference => 
      conference.id === conferenceId 
        ? { ...conference, saved: !conference.saved }
        : conference
    ));
  };

  const handleAddNotes = (conferenceId: string, notes: string) => {
    setConferences(prev => prev.map(conference => 
      conference.id === conferenceId 
        ? { ...conference, notes }
        : conference
    ));
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Conference': return 'text-blue-600 bg-blue-100';
      case 'Summit': return 'text-purple-600 bg-purple-100';
      case 'Workshop': return 'text-green-600 bg-green-100';
      case 'Congress': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) return 'text-red-600 bg-red-100';
    if (diffDays <= 90) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conference News</h1>
          <p className="text-gray-600">
            Stay updated with upcoming conferences, workshops, and events in your research field. 
            Get personalized recommendations based on your interests and never miss important deadlines.
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      interest.priority === 'High' ? 'text-red-600 bg-red-100' : 
                      interest.priority === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 
                      'text-green-600 bg-green-100'
                    }`}>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conference Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search conferences..."
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
              <Select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="max-w-xs"
              >
                <option value="all">All Time</option>
                <option value="month">Next Month</option>
                <option value="quarter">Next Quarter</option>
                <option value="year">Next Year</option>
              </Select>
            </div>
            <div className="flex gap-4">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="max-w-xs"
              >
                <option value="date">Sort by Date</option>
                <option value="relevance">Sort by Relevance</option>
                <option value="location">Sort by Location</option>
                <option value="type">Sort by Type</option>
              </Select>
              <Button variant="outline">
                Refresh Events
              </Button>
            </div>
          </div>
        </div>

        {/* Conferences Grid */}
        <div className="grid gap-6">
          {filteredConferences.map(conference => (
            <Card key={conference.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(conference.relevanceScore)}`}>
                        {conference.relevanceScore}% Relevant
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(conference.type)}`}>
                        {conference.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(conference.startDate)}`}>
                        {conference.startDate.toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {conference.category}
                      </span>
                    </div>
                    <CardTitle className="text-lg mb-2 cursor-pointer hover:text-blue-600">
                      {conference.title}
                    </CardTitle>
                    <p className="text-gray-700 mb-3">{conference.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {conference.userInterests.map(interest => (
                        <span key={interest} className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Location:</span> {conference.location}
                      </div>
                      <div>
                        <span className="font-medium">Venue:</span> {conference.venue}
                      </div>
                      <div>
                        <span className="font-medium">Organizer:</span> {conference.organizer}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {conference.startDate.toLocaleDateString()} - {conference.endDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Why Relevant:</span> {conference.relevanceFactors.join(', ')}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div className="flex items-center gap-4 mt-2">
                      <span>💾 {conference.saved ? 'Saved' : 'Not Saved'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Deadlines */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Important Deadlines</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Early Bird:</span>
                        <span className={conference.earlyBirdDeadline < new Date() ? 'text-red-600' : 'text-gray-600'}>
                          {conference.earlyBirdDeadline.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Abstract:</span>
                        <span className={conference.abstractDeadline < new Date() ? 'text-red-600' : 'text-gray-600'}>
                          {conference.abstractDeadline.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registration:</span>
                        <span className={conference.registrationDeadline < new Date() ? 'text-red-600' : 'text-gray-600'}>
                          {conference.registrationDeadline.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Fees */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Registration Fees</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Early Bird:</span>
                        <span>{conference.registrationFee.early} {conference.registrationFee.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Regular:</span>
                        <span>{conference.registrationFee.regular} {conference.registrationFee.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student:</span>
                        <span>{conference.registrationFee.student} {conference.registrationFee.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {conference.features.map(feature => (
                      <span key={feature} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {conference.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Relevance Factors:</span> {conference.relevanceFactors.join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleSaveConference(conference.id)}
                      className={conference.saved ? 'text-green-600 border-green-600' : 'text-blue-600 border-blue-600'}
                    >
                      {conference.saved ? 'Remove from Saved' : 'Save Event'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(conference.website, '_blank')}
                      className="text-purple-600 border-purple-600"
                    >
                      Visit Website
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(conference.title)}&dates=${conference.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${conference.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(conference.description)}&location=${encodeURIComponent(conference.venue)}`, '_blank')}
                      className="text-green-600 border-green-600"
                    >
                      Add to Calendar
                    </Button>
                  </div>
                </div>

                {conference.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-1">Your Notes:</div>
                    <div className="text-sm text-yellow-700">{conference.notes}</div>
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

export default ConferenceNewsPage;
