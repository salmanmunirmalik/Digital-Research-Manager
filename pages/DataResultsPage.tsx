import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ResultEntry } from '../types';
import { 
  SearchIcon, 
  BarChartIcon, 
  PlusIcon,
  UploadIcon,
  TableIcon,
  ChartBarIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  DatabaseIcon,
  FilesIcon,
  ImageIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  FilterIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  ArrowRightIcon,
  LightbulbIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  ShareIcon,
  DocumentTextIcon,
  BeakerIcon,
  AcademicCapIcon,
  TrendingUpIcon
} from '../components/icons';

// Enhanced data structure for real research needs
interface ResearchDataEntry {
  id: string;
  title: string;
  type: 'experiment' | 'analysis' | 'image' | 'document' | 'protocol' | 'code';
  category: 'molecular_biology' | 'cell_biology' | 'biochemistry' | 'microbiology' | 'bioinformatics' | 'other';
  date: Date;
  status: 'draft' | 'published' | 'archived' | 'under_review';
  tags: string[];
  summary: string;
  author: string;
  lab: string;
  
  // File information
  files: {
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }[];
  
  // Metadata
  metadata: {
    experimentDate?: Date;
    sampleCount?: number;
    replicates?: number;
    conditions?: string[];
    instruments?: string[];
    reagents?: string[];
    notes?: string;
  };
  
  // Analysis specific
  analysis?: {
    method: string;
    software: string;
    parameters: Record<string, any>;
    results: string;
  };
  
  // Protocol specific
  protocol?: {
    steps: string[];
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    equipment: string[];
  };
}

const DataResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Enhanced state management
  const [dataEntries, setDataEntries] = useState<ResearchDataEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ResearchDataEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'experiment' | 'analysis' | 'image' | 'document' | 'protocol' | 'code'>('experiment');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch data from API
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, using mock data');
        loadMockData();
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDataEntries(data.results || data || []);
      } else {
        console.log('API request failed, using mock data');
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      loadMockData();
    }
  };

  // Load mock data
  const loadMockData = () => {
    const mockData: ResearchDataEntry[] = [
      {
        id: '1',
        title: 'PCR Optimization Results',
        type: 'experiment',
        category: 'molecular_biology',
        date: new Date('2024-01-15'),
        status: 'published',
        tags: ['PCR', 'molecular biology', 'optimization', 'Taq polymerase'],
        summary: 'Temperature gradient optimization for Taq polymerase in PCR reactions',
        author: 'Dr. Sarah Chen',
        lab: 'Molecular Biology Lab',
        files: [
          {
            name: 'pcr_results.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 245760,
            url: '/files/pcr_results.xlsx',
            uploadedAt: new Date('2024-01-15')
          },
          {
            name: 'gel_image.jpg',
            type: 'image/jpeg',
            size: 1024000,
            url: '/files/gel_image.jpg',
            uploadedAt: new Date('2024-01-15')
          }
        ],
        metadata: {
          experimentDate: new Date('2024-01-14'),
          sampleCount: 24,
          replicates: 3,
          conditions: ['50°C', '55°C', '60°C', '65°C'],
          instruments: ['Thermal Cycler', 'Gel Electrophoresis'],
          reagents: ['Taq Polymerase', 'dNTPs', 'Primers', 'Template DNA'],
          notes: 'Optimized annealing temperature for new primer set'
        }
      },
      {
        id: '2',
        title: 'Protein Expression Analysis',
        type: 'analysis',
        category: 'biochemistry',
        date: new Date('2024-01-14'),
        status: 'published',
        tags: ['protein', 'expression', 'western blot', 'quantification'],
        summary: 'Quantitative analysis of recombinant protein expression in E. coli',
        author: 'Alex Rodriguez',
        lab: 'Biochemistry Lab',
        files: [
          {
            name: 'western_blot_analysis.pdf',
            type: 'application/pdf',
            size: 2048000,
            url: '/files/western_blot_analysis.pdf',
            uploadedAt: new Date('2024-01-14')
          },
          {
            name: 'quantification_data.csv',
            type: 'text/csv',
            size: 51200,
            url: '/files/quantification_data.csv',
            uploadedAt: new Date('2024-01-14')
          }
        ],
        metadata: {
          experimentDate: new Date('2024-01-13'),
          sampleCount: 12,
          replicates: 2,
          conditions: ['IPTG induction', 'No induction'],
          instruments: ['Western Blot System', 'ImageJ'],
          reagents: ['Anti-His antibody', 'HRP-conjugated secondary'],
          notes: 'Expression levels quantified using ImageJ densitometry'
        },
        analysis: {
          method: 'Western Blot Quantification',
          software: 'ImageJ',
          parameters: {
            normalization: 'GAPDH',
            exposure_time: '30s',
            dilution: '1:1000'
          },
          results: '2.3-fold increase in protein expression with IPTG induction'
        }
      },
      {
        id: '3',
        title: 'Cell Culture Microscopy',
        type: 'image',
        category: 'cell_biology',
        date: new Date('2024-01-13'),
        status: 'draft',
        tags: ['cell culture', 'microscopy', 'HEK293', 'transfection'],
        summary: 'Phase contrast microscopy of transfected HEK293 cells',
        author: 'Maria Garcia',
        lab: 'Cell Biology Lab',
        files: [
          {
            name: 'cell_images.tif',
            type: 'image/tiff',
            size: 5120000,
            url: '/files/cell_images.tif',
            uploadedAt: new Date('2024-01-13')
          }
        ],
        metadata: {
          experimentDate: new Date('2024-01-12'),
          sampleCount: 8,
          replicates: 1,
          conditions: ['Transfected', 'Control'],
          instruments: ['Phase Contrast Microscope'],
          reagents: ['Lipofectamine', 'Plasmid DNA'],
          notes: 'Images taken 24h post-transfection'
        }
      },
      {
        id: '4',
        title: 'Protein Purification Protocol',
        type: 'protocol',
        category: 'biochemistry',
        date: new Date('2024-01-12'),
        status: 'published',
        tags: ['protocol', 'protein purification', 'His-tag', 'Ni-NTA'],
        summary: 'Standardized protocol for His-tagged protein purification using Ni-NTA resin',
        author: 'Dr. James Wilson',
        lab: 'Protein Biochemistry Lab',
        files: [
          {
            name: 'purification_protocol.pdf',
            type: 'application/pdf',
            size: 1024000,
            url: '/files/purification_protocol.pdf',
            uploadedAt: new Date('2024-01-12')
          }
        ],
        metadata: {
          notes: 'Optimized for high yield and purity'
        },
        protocol: {
          steps: [
            'Cell lysis and centrifugation',
            'Ni-NTA column equilibration',
            'Sample loading and washing',
            'Elution with imidazole gradient',
            'Dialysis and concentration'
          ],
          duration: '6-8 hours',
          difficulty: 'intermediate',
          equipment: ['Centrifuge', 'Ni-NTA Column', 'FPLC System', 'Dialysis Membrane']
        }
      }
    ];
    setDataEntries(mockData);
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Create new data entry
  const createDataEntry = async (entryData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: entryData.title,
          type: entryData.type,
          category: entryData.category,
          summary: entryData.summary,
          description: entryData.description,
          methodology: entryData.methodology,
          results: entryData.results,
          conclusions: entryData.conclusions,
          tags: entryData.tags || [],
          privacy_level: entryData.privacy_level || 'lab',
          lab_id: '550e8400-e29b-41d4-a716-446655440000',
          files: entryData.files || {},
          metadata: entryData.metadata || {}
        })
      });

      if (response.ok) {
        const newEntry = await response.json();
        setDataEntries(prev => [newEntry, ...prev]);
        setShowAddModal(false);
      } else {
        console.error('Failed to create data entry');
        // Fallback to local state if API fails
        const newEntry: ResearchDataEntry = {
          id: Date.now().toString(),
          title: entryData.title,
          type: entryData.type,
          category: entryData.category,
          date: new Date(),
          status: 'draft',
          tags: entryData.tags || [],
          summary: entryData.summary,
          author: user?.username || 'Current User',
          lab: 'Current Lab',
          files: entryData.files || [],
          metadata: entryData.metadata || {}
        };
        setDataEntries(prev => [newEntry, ...prev]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error creating data entry:', error);
      // Fallback to local state if API fails
      const newEntry: ResearchDataEntry = {
        id: Date.now().toString(),
        title: entryData.title,
        type: entryData.type,
        category: entryData.category,
        date: new Date(),
        status: 'draft',
        tags: entryData.tags || [],
        summary: entryData.summary,
        author: user?.username || 'Current User',
        lab: 'Current Lab',
        files: entryData.files || [],
        metadata: entryData.metadata || {}
      };
      setDataEntries(prev => [newEntry, ...prev]);
      setShowAddModal(false);
    }
  };

  // Update data entry
  const updateDataEntry = async (id: string, entryData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: entryData.title,
          type: entryData.type,
          category: entryData.category,
          summary: entryData.summary,
          description: entryData.description,
          methodology: entryData.methodology,
          results: entryData.results,
          conclusions: entryData.conclusions,
          tags: entryData.tags || [],
          privacy_level: entryData.privacy_level || 'lab',
          files: entryData.files || {},
          metadata: entryData.metadata || {}
        })
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        setDataEntries(prev => prev.map(entry => entry.id === id ? updatedEntry : entry));
      } else {
        console.error('Failed to update data entry');
        // Fallback to local state if API fails
        setDataEntries(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...entryData } : entry
        ));
      }
    } catch (error) {
      console.error('Error updating data entry:', error);
      // Fallback to local state if API fails
      setDataEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...entryData } : entry
      ));
    }
  };

  // Delete data entry
  const deleteDataEntry = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/data/results/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDataEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        console.error('Failed to delete data entry');
        // Fallback to local state if API fails
        setDataEntries(prev => prev.filter(entry => entry.id !== id));
      }
    } catch (error) {
      console.error('Error deleting data entry:', error);
      // Fallback to local state if API fails
      setDataEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Filtered and sorted data
  const filteredData = dataEntries
    .filter(entry => {
      const matchesType = filterType === 'all' || entry.type === filterType;
      const matchesSearch = searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced Add Data Modal
  const EnhancedAddModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Add Research Data</h3>
            <button 
              onClick={() => {
                setShowAddModal(false);
                setUploadedFiles([]);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
                <select
                  value={addModalType}
                  onChange={(e) => setAddModalType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="experiment">🧪 Experiment</option>
                  <option value="analysis">📊 Analysis</option>
                  <option value="image">🖼️ Image</option>
                  <option value="document">📄 Document</option>
                  <option value="protocol">📋 Protocol</option>
                  <option value="code">💻 Code</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter descriptive title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select name="category" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="molecular_biology">Molecular Biology</option>
                  <option value="cell_biology">Cell Biology</option>
                  <option value="biochemistry">Biochemistry</option>
                  <option value="microbiology">Microbiology</option>
                  <option value="bioinformatics">Bioinformatics</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                <textarea
                  name="summary"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the data..."
                />
              </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas..."
                />
              </div>
            </div>
            
            {/* Right Column - Files and Metadata */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Files & Metadata</h4>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600 mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>
                      <span> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                      multiple
                onChange={handleFileUpload}
                className="hidden"
                      accept=".csv,.xlsx,.pdf,.jpg,.jpeg,.png,.tif,.tiff,.doc,.docx,.txt,.py,.r,.ipynb"
              />
            </div>
                  <p className="text-xs text-gray-500">
                    CSV, Excel, PDF, Images, Documents, Code files
            </p>
          </div>
          
                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FilesIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
                )}
              </div>
              
              {/* Type-specific metadata */}
              {addModalType === 'experiment' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">Experiment Details</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sample Count</label>
                      <input type="number" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Replicates</label>
                      <input type="number" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Instruments</label>
                    <input type="text" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="e.g., PCR Machine, Microscope" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reagents</label>
                    <input type="text" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="e.g., Taq Polymerase, Primers" />
                  </div>
                </div>
              )}
              
              {addModalType === 'analysis' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">Analysis Details</h5>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                    <input type="text" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="e.g., Western Blot, qPCR" />
            </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Software</label>
                    <input type="text" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="e.g., ImageJ, GraphPad" />
            </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Results Summary</label>
                    <textarea className="w-full px-2 py-1 text-sm border border-gray-300 rounded" rows={2} placeholder="Brief summary of findings..." />
                  </div>
                </div>
              )}
              
              {addModalType === 'protocol' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">Protocol Details</h5>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input type="text" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="e.g., 2 hours, 1 day" />
              </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
                    <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
            </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Equipment</label>
                    <input type="text" className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="e.g., Centrifuge, Microscope" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddModal(false);
                setUploadedFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                setIsUploading(true);
                try {
                  const formData = new FormData();
                  const form = document.querySelector('form');
                  if (form) {
                    const formElements = form.elements;
                    const entryData = {
                      title: (formElements.namedItem('title') as HTMLInputElement)?.value || '',
                      type: addModalType,
                      category: (formElements.namedItem('category') as HTMLSelectElement)?.value || 'other',
                      summary: (formElements.namedItem('summary') as HTMLTextAreaElement)?.value || '',
                      tags: (formElements.namedItem('tags') as HTMLInputElement)?.value?.split(',').map(t => t.trim()) || [],
                      files: uploadedFiles.map(file => ({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: URL.createObjectURL(file),
                        uploadedAt: new Date()
                      })),
                      metadata: {}
                    };
                    await createDataEntry(entryData);
                  }
                } catch (error) {
                  console.error('Error saving data:', error);
                } finally {
                  setIsUploading(false);
                  setShowAddModal(false);
                  setUploadedFiles([]);
                }
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Save Data'}
            </Button>
                </div>
              </div>
      </div>
    </div>
  );

  // Data Entry Card Component
  const DataEntryCard = ({ entry }: { entry: ResearchDataEntry }) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'experiment': return <BarChartIcon className="w-5 h-5" />;
        case 'analysis': return <ChartBarIcon className="w-5 h-5" />;
        case 'image': return <ImageIcon className="w-5 h-5" />;
        case 'document': return <FilesIcon className="w-5 h-5" />;
        default: return <DatabaseIcon className="w-5 h-5" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'published': return 'bg-green-100 text-green-800';
        case 'draft': return 'bg-yellow-100 text-yellow-800';
        case 'archived': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="cursor-pointer" onClick={() => setSelectedEntry(entry)}>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-blue-600">
                {getTypeIcon(entry.type)}
              </div>
              <h3 className="font-semibold text-gray-900 truncate">{entry.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(entry.status)}`}>
                {entry.status}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete "${entry.title}"?`)) {
                    deleteDataEntry(entry.id);
                  }
                }}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete entry"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{entry.summary}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              <span>{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'No date'}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              <span>{entry.username || entry.author || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {(entry.tags || []).slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {(entry.tags || []).length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{(entry.tags || []).length - 3}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  };

  // Main Content
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Data</h1>
              <p className="text-gray-600">Manage and analyze your research data in one place</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Data
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
          <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
                  placeholder="Search data entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="experiment">Experiments</option>
                <option value="analysis">Analysis</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="type">Sort by Type</option>
              </select>

            <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOrder === 'asc' ? <SortAscendingIcon className="w-4 h-4" /> : <SortDescendingIcon className="w-4 h-4" />}
            </button>

            <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {viewMode === 'grid' ? <TableIcon className="w-4 h-4" /> : <BarChartIcon className="w-4 h-4" />}
            </button>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredData.map((entry) => (
            <DataEntryCard key={entry.id} entry={entry} />
          ))}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <DatabaseIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No data found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first data entry'}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Data
            </Button>
          </div>
        )}

        {/* Enhanced Add Modal */}
        {showAddModal && <EnhancedAddModal />}

        {/* Selected Entry Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEntry.title}</h3>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {selectedEntry.created_at ? new Date(selectedEntry.created_at).toLocaleDateString() : 'No date'}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {selectedEntry.username || selectedEntry.author || 'Unknown'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedEntry.status === 'published' ? 'bg-green-100 text-green-800' :
                      selectedEntry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEntry.status}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-600">{selectedEntry.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedEntry.tags || []).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        // Open edit modal
                        setShowEditModal(true);
                        console.log('Edit clicked for entry:', selectedEntry?.id);
                      }}
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        console.log('Download clicked for entry:', selectedEntry?.id);
                        if (selectedEntry?.files && selectedEntry.files.length > 0) {
                          // Create download links for each file
                          selectedEntry.files.forEach((file: any) => {
                            const link = document.createElement('a');
                            link.href = file.url || '#';
                            link.download = file.name || 'download';
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          });
                        } else {
                          alert('No files available for download');
                        }
                      }}
                    >
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => {
                        // Open detailed view modal
                        setShowViewModal(true);
                        console.log('View Details clicked for entry:', selectedEntry?.id);
                      }}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Data Entry</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedData = {
                  title: formData.get('title') as string,
                  summary: formData.get('summary') as string,
                  description: formData.get('description') as string,
                  tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()) || [],
                };
                
                await updateDataEntry(selectedEntry.id, updatedData);
                setShowEditModal(false);
                setSelectedEntry(null);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedEntry.title}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                    <textarea
                      name="summary"
                      defaultValue={selectedEntry.summary}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={selectedEntry.description}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      defaultValue={selectedEntry.tags?.join(', ') || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detailed View Modal */}
        {showViewModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Detailed View: {selectedEntry.title}</h3>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Type:</span> {selectedEntry.type}</div>
                      <div><span className="font-medium">Status:</span> {selectedEntry.status}</div>
                      <div><span className="font-medium">Created:</span> {selectedEntry.created_at ? new Date(selectedEntry.created_at).toLocaleDateString() : 'Unknown'}</div>
                      <div><span className="font-medium">Author:</span> {selectedEntry.username || selectedEntry.author || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-sm text-gray-600">{selectedEntry.summary || 'No summary available'}</p>
                  </div>
                </div>
                
                {selectedEntry.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedEntry.description}</p>
                  </div>
                )}
                
                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEntry.files && selectedEntry.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Files</h4>
                    <div className="space-y-2">
                      {selectedEntry.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FilesIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{file.name}</div>
                              <div className="text-xs text-gray-500">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url || '#';
                              link.download = file.name || 'download';
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default DataResultsPage;
