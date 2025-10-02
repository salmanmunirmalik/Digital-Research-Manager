import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchIcon,
  FilterIcon,
  NewspaperIcon,
  StarIcon,
  GlobeIcon,
  EyeIcon,
  HeartIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,

  CurrencyDollarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  TrendingUpIcon
} from '../components/icons';

interface Publisher {
  id: string;
  name: string;
  short_name: string;
  country: string;
  website: string;
  is_open_access: boolean;
}

interface JournalCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface Journal {
  id: string;
  publisher_id: string;
  title: string;
  abbreviation: string;
  issn_print: string;
  issn_online: string;
  description: string;
  impact_factor: number;
  impact_factor_year: number;
  h_index: number;
  total_citations: number;
  sjmr_quartile: number;
  open_access_option: boolean;
  submission_fee: number;
  acceptance_rate: number;
  review_time_weeks: number;
  indexing: string[];
  keywords: string[];
  created_at: string;
  updated_at: string;
  status: string;
  publisher?: Publisher;
  categories: string[];
}

const JournalsDirectoryPage: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [categories, setCategories] = useState<JournalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [impactFactorRange, setImpactFactorRange] = useState<[number, number]>([0, 20]);
  const [openAccessFilter, setOpenAccessFilter] = useState<string>('all');
  const [publisherFilter, setPublisherFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('impact_factor');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API calls
      const mockPublishers: Publisher[] = [
        { id: '1', name: 'Nature Publishing Group', short_name: 'NPG', country: 'United Kingdom', website: 'https://www.nature.com', is_open_access: false },
        { id: '2', name: 'PLOS', short_name: 'PLOS', country: 'United States', website: 'https://journals.plos.org', is_open_access: true },
        { id: '3', name: 'Elsevier', short_name: 'Elsevier', country: 'Netherlands', website: 'https://www.elsevier.com', is_open_access: false },
        { id: '4', name: 'Springer Nature', short_name: 'Springer', country: 'Germany', website: 'https://www.springernature.com', is_open_access: false },
        { id: '5', name: 'Wiley', short_name: 'Wiley', country: 'United States', website: 'https://www.wiley.com', is_open_access: false },
      ];

      const mockCategories: JournalCategory[] = [
        { id: '1', name: 'Biology', description: 'Biological Sciences', color: 'bg-green-500', icon: 'dna' },
        { id: '2', name: 'Chemistry', description: 'Chemical Sciences', color: 'bg-blue-500', icon: 'flask' },
        { id: '3', name: 'Physics', description: 'Physical Sciences', color: 'bg-red-500', icon: 'atom' },
        { id: '4', name: 'Medicine', description: 'Medical Sciences', color: 'bg-purple-500', icon: 'heartbeat' },
        { id: '5', name: 'Computer Science', description: 'Computational Sciences', color: 'bg-indigo-500', icon: 'code' },
      ];

      const mockJournals: Journal[] = [
        {
          id: '1', publisher_id: '1', title: 'Nature', abbreviation: 'NAT', issn_print: '0028-0836', issn_online: '1476-4687',
          description: 'Leading multidisciplinary science journal.', impact_factor: 49.96, impact_factor_year: 2023, h_index: 1200, total_citations: 5000000,
          sjmr_quartile: 1, open_access_option: false, submission_fee: 0, acceptance_rate: 0.08, review_time_weeks: 12,
          indexing: ['Scopus', 'Web of Science'], keywords: ['biology', 'physics', 'chemistry'], created_at: '2023-01-01', updated_at: '2024-01-01', status: 'active', categories: ['Biology', 'Physics']
        },
        {
          id: '2', publisher_id: '2', title: 'PLOS Biology', abbreviation: 'PLOS Biol', issn_print: '1544-9173', issn_online: '1545-7885',
          description: 'Open-access journal publishing significant advances in biological science.', impact_factor: 9.5, impact_factor_year: 2023, h_index: 300, total_citations: 1000000,
          sjmr_quartile: 1, open_access_option: true, submission_fee: 2000, acceptance_rate: 0.15, review_time_weeks: 10,
          indexing: ['PubMed', 'Scopus'], keywords: ['biology', 'genetics', 'ecology'], created_at: '2023-01-05', updated_at: '2024-01-05', status: 'active', categories: ['Biology']
        },
        {
          id: '3', publisher_id: '3', title: 'Cell', abbreviation: 'CELL', issn_print: '0092-8674', issn_online: '1097-4172',
          description: 'Publishes exciting biology research papers.', impact_factor: 66.85, impact_factor_year: 2023, h_index: 1500, total_citations: 7000000,
          sjmr_quartile: 1, open_access_option: false, submission_fee: 0, acceptance_rate: 0.07, review_time_weeks: 14,
          indexing: ['Scopus', 'Web of Science'], keywords: ['molecular biology', 'cell biology'], created_at: '2023-01-10', updated_at: '2024-01-10', status: 'active', categories: ['Biology']
        },
        {
          id: '4', publisher_id: '1', title: 'Science', abbreviation: 'SCI', issn_print: '0036-8075', issn_online: '1095-9203',
          description: 'International journal for all scientific disciplines.', impact_factor: 56.9, impact_factor_year: 2023, h_index: 1300, total_citations: 6000000,
          sjmr_quartile: 1, open_access_option: false, submission_fee: 0, acceptance_rate: 0.09, review_time_weeks: 11,
          indexing: ['Scopus', 'Web of Science'], keywords: ['multidisciplinary', 'research'], created_at: '2023-01-15', updated_at: '2024-01-15', status: 'active', categories: ['Biology', 'Physics', 'Chemistry']
        },
        {
          id: '5', publisher_id: '4', title: 'Nature Communications', abbreviation: 'Nat Commun', issn_print: '2041-1723', issn_online: '2041-1723',
          description: 'Open Access multidisciplinary journal.', impact_factor: 16.6, impact_factor_year: 2023, h_index: 600, total_citations: 2500000,
          sjmr_quartile: 1, open_access_option: true, submission_fee: 5000, acceptance_rate: 0.12, review_time_weeks: 9,
          indexing: ['PubMed', 'Scopus'], keywords: ['biology', 'physics', 'chemistry', 'medicine'], created_at: '2023-01-20', updated_at: '2024-01-20', status: 'active', categories: ['Biology', 'Physics']
        },
        {
          id: '6', publisher_id: '3', title: 'The Lancet', abbreviation: 'LANCET', issn_print: '0140-6736', issn_online: '1474-547X',
          description: 'Leading medical journal publishing clinical research.', impact_factor: 168.9, impact_factor_year: 2023, h_index: 2000, total_citations: 8000000,
          sjmr_quartile: 1, open_access_option: false, submission_fee: 0, acceptance_rate: 0.05, review_time_weeks: 16,
          indexing: ['PubMed', 'Scopus', 'Web of Science'], keywords: ['medicine', 'clinical research', 'public health'], created_at: '2023-01-25', updated_at: '2024-01-25', status: 'active', categories: ['Medicine']
        },
        {
          id: '7', publisher_id: '5', title: 'Advanced Materials', abbreviation: 'Adv Mater', issn_print: '0935-9648', issn_online: '1521-4095',
          description: 'Top-tier journal for materials science research.', impact_factor: 32.1, impact_factor_year: 2023, h_index: 800, total_citations: 3000000,
          sjmr_quartile: 1, open_access_option: false, submission_fee: 0, acceptance_rate: 0.12, review_time_weeks: 8,
          indexing: ['Scopus', 'Web of Science'], keywords: ['materials science', 'nanotechnology', 'engineering'], created_at: '2023-01-30', updated_at: '2024-01-30', status: 'active', categories: ['Chemistry', 'Physics']
        },
        {
          id: '8', publisher_id: '2', title: 'PLOS ONE', abbreviation: 'PLOS ONE', issn_print: '1932-6203', issn_online: '1932-6203',
          description: 'Open access journal for all scientific disciplines.', impact_factor: 3.7, impact_factor_year: 2023, h_index: 500, total_citations: 2000000,
          sjmr_quartile: 2, open_access_option: true, submission_fee: 1800, acceptance_rate: 0.45, review_time_weeks: 6,
          indexing: ['PubMed', 'Scopus'], keywords: ['multidisciplinary', 'open access', 'research'], created_at: '2023-02-01', updated_at: '2024-02-01', status: 'active', categories: ['Biology', 'Chemistry', 'Physics']
        },
      ];

      setPublishers(mockPublishers);
      setCategories(mockCategories);
      setJournals(mockJournals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredJournals = useMemo(() => {
    return journals.filter(journal => {
      const matchesSearch = searchTerm === '' || 
        journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || journal.categories.includes(selectedCategory);
      const matchesImpactFactor = journal.impact_factor >= impactFactorRange[0] && journal.impact_factor <= impactFactorRange[1];
      const matchesOpenAccess = openAccessFilter === 'all' ||
        (openAccessFilter === 'true' && journal.open_access_option) ||
        (openAccessFilter === 'false' && !journal.open_access_option);
      const matchesPublisher = publisherFilter === 'all' || journal.publisher_id === publisherFilter;

      return matchesSearch && matchesCategory && matchesImpactFactor && matchesOpenAccess && matchesPublisher;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'impact_factor':
          return b.impact_factor - a.impact_factor;
        case 'h_index':
          return b.h_index - a.h_index;
        case 'citations':
          return b.total_citations - a.total_citations;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [journals, searchTerm, selectedCategory, impactFactorRange, openAccessFilter, publisherFilter, sortBy]);

  const toggleFavorite = (journalId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(journalId)) {
        newFavorites.delete(journalId);
      } else {
        newFavorites.add(journalId);
      }
      return newFavorites;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
      {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <NewspaperIcon className="w-6 h-6 text-white" />
            </div>
              <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Scientific Journals Directory
                </h1>
              <p className="text-gray-600 mt-1">
                Discover and explore research publications across all disciplines
                </p>
              </div>
            </div>
            
          {/* Quick Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <NewspaperIcon className="w-4 h-4" />
              <span>{journals.length} Journals</span>
            </div>
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="w-4 h-4" />
              <span>All Disciplines</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Peer Reviewed</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="w-4 h-4" />
              <span>Impact Factors</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
              placeholder="Search journal name, abbreviation, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Area</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Impact Factor Range</label>
                  <select
                value={impactFactorRange[1]}
                onChange={(e) => setImpactFactorRange([0, Number(e.target.value)])}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>Under 5</option>
                <option value={10}>Under 10</option>
                <option value={20}>Under 20</option>
                <option value={50}>Under 50</option>
                <option value={100}>All Impact Factors</option>
                  </select>
                </div>

                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Open Access</label>
                  <select
                value={openAccessFilter}
                onChange={(e) => setOpenAccessFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="true">Open Access Only</option>
                <option value="false">Subscription Only</option>
                  </select>
                </div>

                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="impact_factor">Impact Factor</option>
                <option value="h_index">H-Index</option>
                <option value="citations">Citations</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
            </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredJournals.length} of {journals.length} journals
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            <div className="text-sm text-gray-500">
              {favorites.size} favorites
              </div>
      </div>
    </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJournals.map(journal => {
  const publisher = publishers.find(p => p.id === journal.publisher_id);
            const isFavorite = favorites.has(journal.id);

  return (
              <div
                key={journal.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                {journal.title}
              </h3>
                    <p className="text-sm text-blue-600 font-medium mb-3">
                      {journal.abbreviation} • {publisher?.name}
              </p>
            </div>
            <button
                    onClick={() => toggleFavorite(journal.id)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isFavorite
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <HeartIcon className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

                <div className="space-y-4">
                  {/* Impact Factor and Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm text-blue-600 font-medium">Impact Factor</div>
                      <div className="text-xl font-bold text-blue-900">{journal.impact_factor}</div>
                      <div className="text-xs text-blue-600">({journal.impact_factor_year})</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-sm text-purple-600 font-medium">H-Index</div>
                      <div className="text-xl font-bold text-purple-900">{journal.h_index}</div>
                      <div className="text-xs text-purple-600">{journal.total_citations.toLocaleString()} citations</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
            {journal.description}
          </p>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {journal.categories.slice(0, 3).map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
              </div>

                  {/* Journal Details */}
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Acceptance Rate</span>
                      <span className="font-medium">{(journal.acceptance_rate * 100).toFixed(1)}%</span>
              </div>
                    <div className="flex items-center justify-between">
                      <span>Review Time</span>
                      <span className="font-medium">{journal.review_time_weeks} weeks</span>
            </div>
                    {journal.open_access_option && (
                      <div className="flex items-center justify-between">
                        <span>Open Access</span>
                        <span className="font-medium text-green-600">Available</span>
              </div>
                    )}
              </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2">
                      <EyeIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>Submit Paper</span>
                    </button>
                </div>
                </div>
              </div>
            );
          })}
            </div>
              
        {/* Empty State */}
        {filteredJournals.length === 0 && (
          <div className="text-center py-12">
            <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No journals found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setImpactFactorRange([0, 20]);
                setOpenAccessFilter('all');
                setPublisherFilter('all');
                setSortBy('impact_factor');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalsDirectoryPage;