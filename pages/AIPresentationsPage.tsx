import React, { useState, useEffect } from 'react';
import { 
  PresentationChartLineIcon,
  SparklesIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import AdvancedPresentationEditor from '../components/AdvancedPresentationEditor';

interface Presentation {
  id: string;
  title: string;
  description: string;
  theme: string;
  slides: any[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  status: 'draft' | 'published' | 'archived';
}

const AIPresentationsPage: React.FC = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPresentations: Presentation[] = [
      {
        id: '1',
        title: 'Research Findings: Molecular Biology Study',
        description: 'Comprehensive analysis of protein interactions in cellular pathways',
        theme: 'research-professional',
        slides: [],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
        isFavorite: true,
        status: 'published'
      },
      {
        id: '2',
        title: 'Lab Meeting Presentation',
        description: 'Weekly progress update on ongoing experiments',
        theme: 'lab-meeting',
        slides: [],
        createdAt: '2024-01-18T09:15:00Z',
        updatedAt: '2024-01-22T16:20:00Z',
        isFavorite: false,
        status: 'draft'
      },
      {
        id: '3',
        title: 'Conference Abstract Presentation',
        description: 'Preparing for upcoming molecular biology conference',
        theme: 'conference',
        slides: [],
        createdAt: '2024-01-10T13:45:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
        isFavorite: true,
        status: 'published'
      }
    ];
    
    setTimeout(() => {
      setPresentations(mockPresentations);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredPresentations = presentations.filter(presentation => {
    const matchesSearch = presentation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         presentation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || presentation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePresentation = () => {
    setShowAdvancedEditor(true);
  };

  const handleEditPresentation = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setShowAdvancedEditor(true);
  };

  const handlePresentationCreated = (newPresentation: Presentation) => {
    setPresentations(prev => [newPresentation, ...prev]);
    setShowCreateModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'research-professional': return <AcademicCapIcon className="w-5 h-5" />;
      case 'lab-meeting': return <BeakerIcon className="w-5 h-5" />;
      case 'conference': return <PresentationChartLineIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading presentations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <PresentationChartLineIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Presentations</h1>
                <p className="text-sm text-gray-600">Create intelligent presentations with AI assistance</p>
              </div>
            </div>
            <button
              onClick={handleCreatePresentation}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <SparklesIcon className="w-5 h-5" />
              Create with AI
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search presentations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <DocumentTextIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'draft', 'published', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Presentations</p>
                <p className="text-2xl font-bold text-gray-900">{presentations.length}</p>
              </div>
              <PresentationChartLineIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {presentations.filter(p => p.status === 'published').length}
                </p>
              </div>
              <EyeIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {presentations.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <PencilIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-purple-600">
                  {presentations.filter(p => p.isFavorite).length}
                </p>
              </div>
              <LightBulbIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Presentations Grid */}
        {filteredPresentations.length === 0 ? (
          <div className="text-center py-12">
            <PresentationChartLineIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No presentations found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first AI-powered presentation'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={handleCreatePresentation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <SparklesIcon className="w-5 h-5" />
                Create Presentation
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresentations.map((presentation) => (
              <div
                key={presentation.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {getThemeIcon(presentation.theme)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {presentation.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(presentation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`p-1 rounded-full transition-colors ${
                        presentation.isFavorite 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-300 hover:text-yellow-500'
                      }`}
                    >
                      <LightBulbIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {presentation.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(presentation.status)}`}>
                      {presentation.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditPresentation(presentation)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                        <ShareIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <DocumentArrowDownIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Presentation Editor */}
      {showAdvancedEditor && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedPresentation ? 'Edit Presentation' : 'Create New Presentation'}
                  </h2>
                  <p className="text-gray-600 text-sm">Advanced AI-powered presentation editor</p>
                </div>
                <button
                  onClick={() => {
                    setShowAdvancedEditor(false);
                    setSelectedPresentation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Editor */}
            <div className="flex-1">
              <AdvancedPresentationEditor
                presentation={selectedPresentation}
                onSave={(presentation) => {
                  console.log('Presentation saved:', presentation);
                  setShowAdvancedEditor(false);
                  setSelectedPresentation(null);
                  // Refresh presentations list
                }}
                onClose={() => {
                  setShowAdvancedEditor(false);
                  setSelectedPresentation(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPresentationsPage;
