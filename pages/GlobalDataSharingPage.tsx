import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  SharedData, 
  DataRequest, 
  DataType 
} from '../types';

const GlobalDataSharingPage: React.FC = () => {
  const [sharedData, setSharedData] = useState<SharedData[]>([]);
  const [filteredData, setFilteredData] = useState<SharedData[]>([]);
  const [selectedData, setSelectedData] = useState<SharedData | null>(null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDataType, setSelectedDataType] = useState<DataType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'downloads' | 'citations'>('date');

  // Mock data for demonstration
  useEffect(() => {
    const mockData: SharedData[] = [
      {
        id: '1',
        title: 'RNA-seq Analysis Pipeline for Cancer Research',
        description: 'Complete RNA-seq analysis pipeline including quality control, alignment, quantification, and differential expression analysis. Tested on multiple cancer datasets.',
        dataType: 'Analysis Scripts',
        category: 'Bioinformatics',
        subcategory: 'RNA-seq',
        authorId: 'user1',
        authorName: 'Dr. Maria Rodriguez',
        labId: 'lab1',
        institution: 'Stanford University',
        visibility: 'Global',
        accessLevel: 'Download',
        tags: ['RNA-seq', 'cancer', 'bioinformatics', 'pipeline'],
        keywords: ['transcriptomics', 'differential expression', 'cancer genomics'],
        dataSize: 2.5, // GB
        fileFormat: 'Python/R scripts + documentation',
        version: '2.1.0',
        citation: 'Rodriguez et al. (2024) Nature Methods',
        license: 'MIT',
        createdAt: new Date('2024-07-15'),
        updatedAt: new Date('2024-08-01'),
        downloadCount: 156,
        citationCount: 23,
        collaborators: ['user2', 'user3'],
        requests: [
          {
            id: 'req1',
            dataId: '1',
            requesterId: 'user4',
            requesterName: 'Dr. James Chen',
            institution: 'MIT',
            purpose: 'Cancer immunotherapy research',
            intendedUse: 'Analyzing patient response data',
            collaborationProposed: true,
            status: 'Approved',
            createdAt: new Date('2024-07-20'),
            respondedAt: new Date('2024-07-22'),
            response: 'Approved for collaboration. Looking forward to working together!'
          }
        ]
      },
      {
        id: '2',
        title: 'High-Resolution Cryo-EM Dataset: Membrane Protein Structure',
        description: 'Raw cryo-EM data for a novel membrane protein complex. Includes particle picking, 2D classification, and 3D reconstruction data.',
        dataType: 'Raw Data',
        category: 'Structural Biology',
        subcategory: 'Cryo-EM',
        authorId: 'user2',
        authorName: 'Prof. Sarah Johnson',
        labId: 'lab2',
        institution: 'UC Berkeley',
        visibility: 'Collaborators',
        accessLevel: 'Collaborate',
        tags: ['cryo-EM', 'membrane proteins', 'structural biology'],
        keywords: ['electron microscopy', 'protein structure', 'membrane complexes'],
        dataSize: 45.2, // GB
        fileFormat: 'MRC, STAR, RELION',
        version: '1.0.0',
        citation: 'Johnson et al. (2024) Science',
        license: 'Collaborative Research Agreement',
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-07-15'),
        downloadCount: 12,
        citationCount: 8,
        collaborators: ['user5', 'user6'],
        requests: []
      },
      {
        id: '3',
        title: 'Metabolomics Dataset: Drug Response in Cell Lines',
        description: 'Comprehensive metabolomics profiling of cancer cell lines treated with various drug combinations. Includes LC-MS data and analysis results.',
        dataType: 'Processed Data',
        category: 'Metabolomics',
        subcategory: 'Drug Response',
        authorId: 'user3',
        authorName: 'Dr. Alex Thompson',
        labId: 'lab3',
        institution: 'Harvard Medical School',
        visibility: 'Global',
        accessLevel: 'View',
        tags: ['metabolomics', 'drug response', 'cancer', 'LC-MS'],
        keywords: ['metabolic profiling', 'pharmacology', 'precision medicine'],
        dataSize: 8.7, // GB
        fileFormat: 'CSV, Excel, R data files',
        version: '1.2.0',
        citation: 'Thompson et al. (2024) Cell Metabolism',
        license: 'Creative Commons Attribution 4.0',
        createdAt: new Date('2024-05-10'),
        updatedAt: new Date('2024-07-30'),
        downloadCount: 89,
        citationCount: 15,
        collaborators: [],
        requests: []
      }
    ];

    setSharedData(mockData);
    setFilteredData(mockData);
  }, []);

  // Filter and sort data
  useEffect(() => {
    let filtered = sharedData.filter(data => {
      const matchesSearch = data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           data.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           data.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           data.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || data.category === selectedCategory;
      const matchesDataType = selectedDataType === 'All' || data.dataType === selectedDataType;
      
      return matchesSearch && matchesCategory && matchesDataType;
    });

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'relevance':
          return b.downloadCount + b.citationCount - (a.downloadCount + a.citationCount);
        case 'downloads':
          return b.downloadCount - a.downloadCount;
        case 'citations':
          return b.citationCount - a.citationCount;
        default:
          return 0;
      }
    });

    setFilteredData(filtered);
  }, [sharedData, searchTerm, selectedCategory, selectedDataType, sortBy]);

  const handleShareData = (data: Omit<SharedData, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'citationCount' | 'requests'>) => {
    const newData: SharedData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      downloadCount: 0,
      citationCount: 0,
      requests: []
    };
    setSharedData(prev => [newData, ...prev]);
    setShowShareForm(false);
  };

  const handleDataRequest = (dataId: string, request: Omit<DataRequest, 'id' | 'createdAt'>) => {
    const newRequest: DataRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setSharedData(prev => prev.map(data => 
      data.id === dataId 
        ? { ...data, requests: [...data.requests, newRequest] }
        : data
    ));
    setShowRequestForm(false);
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'View': return 'text-blue-600 bg-blue-100';
      case 'Download': return 'text-green-600 bg-green-100';
      case 'Collaborate': return 'text-purple-600 bg-purple-100';
      case 'Full Access': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'Personal': return 'text-gray-600 bg-gray-100';
      case 'Lab': return 'text-blue-600 bg-blue-100';
      case 'Team': return 'text-green-600 bg-green-100';
      case 'Global': return 'text-purple-600 bg-purple-100';
      case 'Collaborators': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (size: number) => {
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} TB`;
    }
    return `${size} GB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Data Sharing</h1>
          <p className="text-gray-600">
            Share your research data with the global science community and discover valuable datasets 
            from researchers worldwide. Promote collaboration and accelerate scientific discovery.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{sharedData.length}</div>
              <div className="text-sm text-gray-600">Datasets Shared</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {sharedData.reduce((sum, data) => sum + data.downloadCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Downloads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {sharedData.reduce((sum, data) => sum + data.citationCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Citations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {sharedData.filter(data => data.visibility === 'Global').length}
              </div>
              <div className="text-sm text-gray-600">Public Datasets</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="max-w-xs"
              >
                <option value="All">All Categories</option>
                <option value="Bioinformatics">Bioinformatics</option>
                <option value="Structural Biology">Structural Biology</option>
                <option value="Metabolomics">Metabolomics</option>
                <option value="Genomics">Genomics</option>
                <option value="Proteomics">Proteomics</option>
                <option value="Cell Biology">Cell Biology</option>
                <option value="Neuroscience">Neuroscience</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Physics">Physics</option>
              </Select>
              <Select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value as DataType | 'All')}
                className="max-w-xs"
              >
                <option value="All">All Data Types</option>
                <option value="Experimental Results">Experimental Results</option>
                <option value="Protocol Data">Protocol Data</option>
                <option value="Analysis Scripts">Analysis Scripts</option>
                <option value="Raw Data">Raw Data</option>
                <option value="Processed Data">Processed Data</option>
                <option value="Metadata">Metadata</option>
                <option value="Literature Review">Literature Review</option>
                <option value="Methodology">Methodology</option>
                <option value="Software Tools">Software Tools</option>
              </Select>
            </div>
            <div className="flex gap-4">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'relevance' | 'downloads' | 'citations')}
                className="max-w-xs"
              >
                <option value="date">Sort by Date</option>
                <option value="relevance">Sort by Relevance</option>
                <option value="downloads">Sort by Downloads</option>
                <option value="citations">Sort by Citations</option>
              </Select>
              <Button onClick={() => setShowShareForm(true)}>
                Share Your Data
              </Button>
            </div>
          </div>
        </div>

        {/* Datasets Grid */}
        <div className="grid gap-6">
          {filteredData.map(data => (
            <Card key={data.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 cursor-pointer hover:text-blue-600"
                               onClick={() => setSelectedData(data)}>
                      {data.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(data.accessLevel)}`}>
                        {data.accessLevel}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVisibilityColor(data.visibility)}`}>
                        {data.visibility}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                        {data.category}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        {data.dataType}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{data.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {data.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      By {data.authorName} • {data.institution} • {new Date(data.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div className="text-lg font-semibold text-blue-600">{formatFileSize(data.dataSize)}</div>
                    <div className="text-xs">{data.fileFormat}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <span>⬇️ {data.downloadCount}</span>
                      <span>📚 {data.citationCount}</span>
                      <span>💬 {data.requests.length}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">License:</span> {data.license} • 
                    <span className="font-medium ml-2">Citation:</span> {data.citation}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedData(data)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      View Details
                    </Button>
                    {data.accessLevel !== 'View' && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedData(data);
                          setShowRequestForm(true);
                        }}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Request Access
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Share Data Form Modal */}
        {showShareForm && (
          <ShareDataForm 
            onSubmit={handleShareData}
            onCancel={() => setShowShareForm(false)}
          />
        )}

        {/* Data Detail Modal */}
        {selectedData && (
          <DataDetailModal
            data={selectedData}
            onClose={() => setSelectedData(null)}
            onRequest={handleDataRequest}
            showRequestForm={showRequestForm}
            onShowRequestForm={setShowRequestForm}
          />
        )}
      </div>
    </div>
  );
};

// Share Data Form Component
const ShareDataForm: React.FC<{
  onSubmit: (data: Omit<SharedData, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'citationCount' | 'requests'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dataType: 'Experimental Results' as DataType,
    category: '',
    subcategory: '',
    visibility: 'Lab' as 'Personal' | 'Lab' | 'Team' | 'Global' | 'Collaborators',
    accessLevel: 'View' as 'View' | 'Download' | 'Collaborate' | 'Full Access',
    tags: '',
    keywords: '',
    dataSize: '',
    fileFormat: '',
    version: '1.0.0',
    citation: '',
    license: 'Creative Commons Attribution 4.0'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      authorId: 'currentUser',
      authorName: 'Current User',
      labId: 'currentLab',
      institution: 'Current Institution',
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      keywords: formData.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
      dataSize: parseFloat(formData.dataSize),
      collaborators: []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Share Your Research Data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Descriptive title for your dataset"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
              <Select
                value={formData.dataType}
                onChange={(e) => setFormData(prev => ({ ...prev, dataType: e.target.value as DataType }))}
                required
              >
                <option value="Experimental Results">Experimental Results</option>
                <option value="Protocol Data">Protocol Data</option>
                <option value="Analysis Scripts">Analysis Scripts</option>
                <option value="Raw Data">Raw Data</option>
                <option value="Processed Data">Processed Data</option>
                <option value="Metadata">Metadata</option>
                <option value="Literature Review">Literature Review</option>
                <option value="Methodology">Methodology</option>
                <option value="Software Tools">Software Tools</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of your dataset, methodology, and potential applications"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Bioinformatics, Cell Biology"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <Input
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                placeholder="e.g., RNA-seq, Microscopy"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <Select
                value={formData.visibility}
                onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
                required
              >
                <option value="Personal">Personal (Only you)</option>
                <option value="Lab">Lab (Lab members only)</option>
                <option value="Team">Team (Team members only)</option>
                <option value="Collaborators">Collaborators (Selected researchers)</option>
                <option value="Global">Global (Public access)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
              <Select
                value={formData.accessLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value as any }))}
                required
              >
                <option value="View">View (Metadata only)</option>
                <option value="Download">Download (Full dataset)</option>
                <option value="Collaborate">Collaborate (Shared access)</option>
                <option value="Full Access">Full Access (Complete access)</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Size (GB)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.dataSize}
                onChange={(e) => setFormData(prev => ({ ...prev, dataSize: e.target.value }))}
                placeholder="e.g., 2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Format</label>
              <Input
                value={formData.fileFormat}
                onChange={(e) => setFormData(prev => ({ ...prev, fileFormat: e.target.value }))}
                placeholder="e.g., CSV, Python scripts, MRC files"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., RNA-seq, cancer, bioinformatics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g., transcriptomics, differential expression, precision medicine"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Citation</label>
              <Input
                value={formData.citation}
                onChange={(e) => setFormData(prev => ({ ...prev, citation: e.target.value }))}
                placeholder="e.g., Author et al. (2024) Journal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License</label>
              <Select
                value={formData.license}
                onChange={(e) => setFormData(prev => ({ ...prev, license: e.target.value }))}
                required
              >
                <option value="Creative Commons Attribution 4.0">Creative Commons Attribution 4.0</option>
                <option value="Creative Commons Attribution-NonCommercial 4.0">Creative Commons Attribution-NonCommercial 4.0</option>
                <option value="MIT License">MIT License</option>
                <option value="GPL v3">GPL v3</option>
                <option value="Collaborative Research Agreement">Collaborative Research Agreement</option>
                <option value="Custom">Custom License</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Share Dataset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Data Detail Modal Component
const DataDetailModal: React.FC<{
  data: SharedData;
  onClose: () => void;
  onRequest: (dataId: string, request: Omit<DataRequest, 'id' | 'createdAt'>) => void;
  showRequestForm: boolean;
  onShowRequestForm: (show: boolean) => void;
}> = ({ data, onClose, onRequest, showRequestForm, onShowRequestForm }) => {
  const [requestData, setRequestData] = useState({
    purpose: '',
    intendedUse: '',
    collaborationProposed: false
  });

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    onRequest(data.id, {
      dataId: data.id,
      requesterId: 'currentUser',
      requesterName: 'Current User',
      institution: 'Current Institution',
      purpose: requestData.purpose,
      intendedUse: requestData.intendedUse,
      collaborationProposed: requestData.collaborationProposed,
      status: 'Pending'
    });
    setRequestData({ purpose: '', intendedUse: '', collaborationProposed: false });
    onShowRequestForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{data.title}</h2>
          <Button variant="outline" onClick={onClose}>✕</Button>
        </div>

        {/* Data Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(data.accessLevel)}`}>
              {data.accessLevel}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVisibilityColor(data.visibility)}`}>
              {data.visibility}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
              {data.category}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
              {data.dataType}
            </span>
          </div>
          <p className="text-gray-700 mb-3">{data.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Author:</span> {data.authorName} ({data.institution})
            </div>
            <div>
              <span className="font-medium">Data Size:</span> {formatFileSize(data.dataSize)}
            </div>
            <div>
              <span className="font-medium">File Format:</span> {data.fileFormat}
            </div>
            <div>
              <span className="font-medium">Version:</span> {data.version}
            </div>
            <div>
              <span className="font-medium">License:</span> {data.license}
            </div>
            <div>
              <span className="font-medium">Citation:</span> {data.citation}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Dataset Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{data.downloadCount}</div>
              <div className="text-sm text-gray-600">Downloads</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{data.citationCount}</div>
              <div className="text-sm text-gray-600">Citations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{data.requests.length}</div>
              <div className="text-sm text-gray-600">Access Requests</div>
            </div>
          </div>
        </div>

        {/* Access Requests */}
        {data.requests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Access Requests ({data.requests.length})</h3>
            <div className="space-y-3">
              {data.requests.map(request => (
                <div key={request.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{request.requesterName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <div><span className="font-medium">Institution:</span> {request.institution}</div>
                    <div><span className="font-medium">Purpose:</span> {request.purpose}</div>
                    <div><span className="font-medium">Intended Use:</span> {request.intendedUse}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'Approved' ? 'bg-green-100 text-green-600' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {request.status}
                    </span>
                    {request.collaborationProposed && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">
                        Collaboration Proposed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Request Access to Dataset</h3>
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={requestData.purpose}
                  onChange={(e) => setRequestData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Brief description of your research purpose"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intended Use</label>
                <textarea
                  value={requestData.intendedUse}
                  onChange={(e) => setRequestData(prev => ({ ...prev, intendedUse: e.target.value }))}
                  placeholder="How do you plan to use this dataset?"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="collaboration"
                  checked={requestData.collaborationProposed}
                  onChange={(e) => setRequestData(prev => ({ ...prev, collaborationProposed: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="collaboration" className="text-sm text-gray-700">
                  I would like to propose collaboration with the data owner
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onShowRequestForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Action Buttons */}
        {!showRequestForm && (
          <div className="flex justify-end">
            <Button onClick={() => onShowRequestForm(true)}>
              Request Access
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for access level colors
const getAccessLevelColor = (level: string) => {
  switch (level) {
    case 'View': return 'text-blue-600 bg-blue-100';
    case 'Download': return 'text-green-600 bg-green-100';
    case 'Collaborate': return 'text-purple-600 bg-purple-100';
    case 'Full Access': return 'text-orange-600 bg-orange-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// Helper function for visibility colors
const getVisibilityColor = (visibility: string) => {
  switch (visibility) {
    case 'Personal': return 'text-gray-600 bg-gray-100';
    case 'Lab': return 'text-blue-600 bg-blue-100';
    case 'Team': return 'text-green-600 bg-green-100';
    case 'Global': return 'text-purple-600 bg-purple-100';
    case 'Collaborators': return 'text-orange-600 bg-orange-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// Helper function for file size formatting
const formatFileSize = (size: number) => {
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} TB`;
  }
  return `${size} GB`;
};

export default GlobalDataSharingPage;
