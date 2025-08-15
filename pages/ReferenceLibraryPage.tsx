import React, { useState, useEffect } from 'react';
import { SearchIcon, BookOpenIcon, DocumentTextIcon, AcademicCapIcon, GlobeAltIcon, FilterIcon, DownloadIcon, BookmarkIcon, ShareIcon } from '../components/icons';

interface ReferenceItem {
  id: string;
  title: string;
  type: 'protocol' | 'standard' | 'guideline' | 'manual' | 'paper';
  category: string;
  description: string;
  author: string;
  institution: string;
  year: number;
  tags: string[];
  downloadUrl?: string;
  isBookmarked: boolean;
  rating: number;
  downloads: number;
}

const ReferenceLibraryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'rating' | 'downloads'>('relevance');
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [filteredReferences, setFilteredReferences] = useState<ReferenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockReferences: ReferenceItem[] = [
      {
        id: '1',
        title: 'Standard Operating Procedure for PCR Analysis',
        type: 'protocol',
        category: 'Molecular Biology',
        description: 'Comprehensive protocol for polymerase chain reaction analysis including primer design, reaction setup, and troubleshooting.',
        author: 'Dr. Sarah Johnson',
        institution: 'MIT Biology Department',
        year: 2024,
        tags: ['PCR', 'DNA', 'molecular biology', 'genetics'],
        downloadUrl: '#',
        isBookmarked: false,
        rating: 4.8,
        downloads: 1247
      },
      {
        id: '2',
        title: 'Laboratory Safety Guidelines 2024',
        type: 'guideline',
        category: 'Safety',
        description: 'Updated laboratory safety protocols covering chemical handling, biological safety, and emergency procedures.',
        author: 'Safety Committee',
        institution: 'National Institute of Standards',
        year: 2024,
        tags: ['safety', 'chemicals', 'biosafety', 'emergency'],
        downloadUrl: '#',
        isBookmarked: true,
        rating: 4.9,
        downloads: 2156
      },
      {
        id: '3',
        title: 'Statistical Analysis Methods for Research',
        type: 'manual',
        category: 'Data Analysis',
        description: 'Comprehensive guide to statistical methods commonly used in scientific research with practical examples.',
        author: 'Prof. Michael Chen',
        institution: 'Stanford Statistics Department',
        year: 2023,
        tags: ['statistics', 'data analysis', 'research methods', 'R'],
        downloadUrl: '#',
        isBookmarked: false,
        rating: 4.7,
        downloads: 892
      },
      {
        id: '4',
        title: 'Cell Culture Maintenance Protocol',
        type: 'protocol',
        category: 'Cell Biology',
        description: 'Detailed protocol for maintaining various cell lines including media preparation, passaging, and cryopreservation.',
        author: 'Dr. Emily Rodriguez',
        institution: 'Harvard Medical School',
        year: 2024,
        tags: ['cell culture', 'media', 'passaging', 'cryopreservation'],
        downloadUrl: '#',
        isBookmarked: false,
        rating: 4.6,
        downloads: 756
      },
      {
        id: '5',
        title: 'ISO 17025 Laboratory Accreditation Standard',
        type: 'standard',
        category: 'Quality Assurance',
        description: 'International standard for testing and calibration laboratories covering management and technical requirements.',
        author: 'International Organization for Standardization',
        institution: 'ISO',
        year: 2017,
        tags: ['accreditation', 'quality', 'calibration', 'testing'],
        downloadUrl: '#',
        isBookmarked: true,
        rating: 4.9,
        downloads: 3421
      },
      {
        id: '6',
        title: 'Microscopy Techniques Handbook',
        type: 'manual',
        category: 'Imaging',
        description: 'Comprehensive guide to various microscopy techniques including light, fluorescence, and electron microscopy.',
        author: 'Dr. Robert Kim',
        institution: 'UC Berkeley',
        year: 2023,
        tags: ['microscopy', 'imaging', 'fluorescence', 'electron'],
        downloadUrl: '#',
        isBookmarked: false,
        rating: 4.5,
        downloads: 634
      }
    ];

    setReferences(mockReferences);
    setFilteredReferences(mockReferences);
    setIsLoading(false);
  }, []);

  // Filter and search references
  useEffect(() => {
    let filtered = references.filter(ref => {
      const matchesSearch = ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ref.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ref.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'all' || ref.type === selectedType;
      const matchesCategory = selectedCategory === 'all' || ref.category === selectedCategory;
      
      return matchesSearch && matchesType && matchesCategory;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.year - a.year;
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0; // relevance - keep original order
      }
    });

    setFilteredReferences(filtered);
  }, [searchTerm, selectedType, selectedCategory, sortBy, references]);

  const toggleBookmark = (id: string) => {
    setReferences(prev => prev.map(ref => 
      ref.id === id ? { ...ref, isBookmarked: !ref.isBookmarked } : ref
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'protocol': return <BeakerIcon className="w-5 h-5" />;
      case 'standard': return <DocumentTextIcon className="w-5 h-5" />;
      case 'guideline': return <AcademicCapIcon className="w-5 h-5" />;
      case 'manual': return <BookOpenIcon className="w-5 h-5" />;
      case 'paper': return <GlobeAltIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'protocol': return 'bg-blue-100 text-blue-800';
      case 'standard': return 'bg-green-100 text-green-800';
      case 'guideline': return 'bg-purple-100 text-purple-800';
      case 'manual': return 'bg-orange-100 text-orange-800';
      case 'paper': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reference Library</h1>
              <p className="text-gray-600">Access protocols, standards, and research resources</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search references, protocols, standards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="protocol">Protocols</option>
                <option value="standard">Standards</option>
                <option value="guideline">Guidelines</option>
                <option value="manual">Manuals</option>
                <option value="paper">Papers</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Molecular Biology">Molecular Biology</option>
                <option value="Cell Biology">Cell Biology</option>
                <option value="Safety">Safety</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Imaging">Imaging</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex space-x-2">
              {[
                { value: 'relevance', label: 'Relevance' },
                { value: 'date', label: 'Date' },
                { value: 'rating', label: 'Rating' },
                { value: 'downloads', label: 'Downloads' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {filteredReferences.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No references found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            filteredReferences.map((ref) => (
              <div key={ref.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(ref.type)}`}>
                        {ref.type.charAt(0).toUpperCase() + ref.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{ref.category}</span>
                      <span className="text-sm text-gray-500">{ref.year}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{ref.title}</h3>
                    <p className="text-gray-600 mb-4">{ref.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span>By {ref.author}</span>
                      <span>•</span>
                      <span>{ref.institution}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      {ref.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">★</span>
                        <span>{ref.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DownloadIcon className="w-4 h-4" />
                        <span>{ref.downloads}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-3 ml-6">
                    <button
                      onClick={() => toggleBookmark(ref.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        ref.isBookmarked
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <BookmarkIcon className="w-5 h-5" />
                    </button>
                    
                    {ref.downloadUrl && (
                      <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <ShareIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Summary */}
        {filteredReferences.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredReferences.length} of {references.length} references
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceLibraryPage;
