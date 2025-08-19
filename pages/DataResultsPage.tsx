import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { ResultEntry, DataEntryForm, DataTemplate } from '../types';
import { 
  SearchIcon, 
  BarChartIcon, 
  ChevronRightIcon, 
  FilesIcon, 
  FilterIcon, 
  LineChartIcon, 
  LightbulbIcon, 
  CheckCircleIcon, 
  PencilIcon, 
  DatabaseIcon,
  PlusIcon,
  UploadIcon,
  TableIcon,
  ChartBarIcon,
  XMarkIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  SaveIcon,
  RefreshCwIcon,
  DocumentIcon,
  ImageIcon,
  CogIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  InformationCircleIcon
} from '../components/icons';

const DataResultsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'images' | 'manual' | 'presentations' | 'analytics'>('spreadsheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  
  // Enhanced data entry state
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Analytics state
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [analyticsResults, setAnalyticsResults] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [chartType, setChartType] = useState<'histogram' | 'scatter' | 'bar'>('histogram');
  const [selectedColumns, setSelectedColumns] = useState<{x: string, y: string}>({x: '', y: ''});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Performance optimization refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Simple data entry form state
  const [entryForm, setEntryForm] = useState({
    title: '',
    summary: '',
    data_type: 'experiment',
    tags: ''
  });

  useEffect(() => {
    fetchLabs();
    generateDummyData(); // Generate dummy data for testing
    if (labs.length > 0) {
      fetchResults();
      fetchStats();
    }
  }, [labs]);
  
  // Auto-select columns when switching to scatter plot
  useEffect(() => {
    if (chartType === 'scatter' && analyticsResults?.numericColumns && analyticsResults.numericColumns.length >= 2) {
      if (!selectedColumns.x || !selectedColumns.y) {
        setSelectedColumns({
          x: analyticsResults.numericColumns[0]?.header || '',
          y: analyticsResults.numericColumns[1]?.header || ''
        });
      }
    }
  }, [chartType, analyticsResults, selectedColumns]);

  // Optimize scroll performance to prevent flickering
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      const currentScrollTop = e.currentTarget.scrollTop;
      if (Math.abs(currentScrollTop - lastScrollTop.current) > 50) {
        lastScrollTop.current = currentScrollTop;
      }
    }, 16); // 60fps throttle
  }, []);

  // Memoize filtered results to prevent unnecessary re-renders
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const matchesSearch = result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [results, searchTerm]);



  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs || data);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/data/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/data/results/stats/overview?lab_id=${labs[0]?.id || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportStatus('idle');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImportStatus('importing');
    // Simulate import process
    setTimeout(() => {
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 2000);
    }, 2000);
  };

  // Generate dummy data for testing
  const generateDummyData = () => {
    const dummyResults = [
      {
        id: '1',
        title: 'Temperature vs. pH Study',
        summary: 'Investigation of pH changes with temperature variations in aqueous solutions',
        author: 'Dr. Sarah Chen',
        date: '2024-01-15',
        tags: ['temperature', 'pH', 'aqueous', 'chemistry'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Temperature (°C)', 'pH', 'Conductivity (mS/cm)', 'Sample ID'],
          rows: [
            [20, 7.2, 0.45, 'A1'],
            [25, 7.1, 0.48, 'A2'],
            [30, 7.0, 0.52, 'A3'],
            [35, 6.9, 0.55, 'A4'],
            [40, 6.8, 0.58, 'A5'],
            [45, 6.7, 0.62, 'A6'],
            [50, 6.6, 0.65, 'A7']
          ]
        },
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        title: 'Cell Growth Rate Analysis',
        summary: 'Measurement of bacterial cell growth rates under different nutrient conditions',
        author: 'Dr. Michael Rodriguez',
        date: '2024-01-14',
        tags: ['cell growth', 'bacteria', 'nutrients', 'microbiology'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Time (hours)', 'Cell Count (×10⁶)', 'Nutrient Level (%)', 'Replicate'],
          rows: [
            [0, 1.2, 100, 'R1'],
            [2, 2.8, 100, 'R1'],
            [4, 6.5, 100, 'R1'],
            [6, 15.2, 100, 'R1'],
            [8, 28.7, 100, 'R1'],
            [0, 1.1, 50, 'R2'],
            [2, 2.1, 50, 'R2'],
            [4, 4.8, 50, 'R2'],
            [6, 9.2, 50, 'R2'],
            [8, 16.5, 50, 'R2']
          ]
        },
        created_at: '2024-01-14T14:30:00Z'
      },
      {
        id: '3',
        title: 'Protein Concentration Assay',
        summary: 'Bradford assay results for protein quantification in cell lysates',
        author: 'Dr. Emily Watson',
        date: '2024-01-13',
        tags: ['protein', 'Bradford assay', 'cell lysate', 'biochemistry'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Sample ID', 'Absorbance (595nm)', 'Protein (μg/mL)', 'Dilution Factor'],
          rows: [
            ['Control', 0.12, 0, 1],
            ['Std1', 0.25, 5, 1],
            ['Std2', 0.48, 10, 1],
            ['Std3', 0.72, 15, 1],
            ['Std4', 0.95, 20, 1],
            ['Sample1', 0.68, 14.2, 1],
            ['Sample2', 0.71, 15.1, 1],
            ['Sample3', 0.65, 13.8, 1]
          ]
        },
        created_at: '2024-01-13T09:15:00Z'
      },
      {
        id: '4',
        title: 'Enzyme Kinetics Study',
        summary: 'Michaelis-Menten kinetics analysis of enzyme activity',
        author: 'Dr. James Thompson',
        date: '2024-01-12',
        tags: ['enzyme', 'kinetics', 'Michaelis-Menten', 'biochemistry'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Substrate (mM)', 'Velocity (μmol/min)', '1/[S] (mM⁻¹)', '1/V (min/μmol)'],
          rows: [
            [0.5, 0.25, 2.0, 4.0],
            [1.0, 0.40, 1.0, 2.5],
            [2.0, 0.60, 0.5, 1.67],
            [5.0, 0.80, 0.2, 1.25],
            [10.0, 0.90, 0.1, 1.11],
            [20.0, 0.95, 0.05, 1.05],
            [50.0, 0.98, 0.02, 1.02]
          ]
        },
        created_at: '2024-01-12T16:45:00Z'
      },
      {
        id: '5',
        title: 'Drug Dose Response',
        summary: 'IC50 determination for novel drug compound on cancer cell lines',
        author: 'Dr. Lisa Park',
        date: '2024-01-11',
        tags: ['drug', 'IC50', 'cancer', 'pharmacology'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Drug Concentration (μM)', 'Cell Viability (%)', 'Log[Concentration]', 'Response'],
          rows: [
            [0.001, 98.5, -3.0, 1.5],
            [0.01, 95.2, -2.0, 4.8],
            [0.1, 87.3, -1.0, 12.7],
            [1.0, 65.8, 0.0, 34.2],
            [10.0, 32.1, 1.0, 67.9],
            [100.0, 8.5, 2.0, 91.5],
            [1000.0, 2.1, 3.0, 97.9]
          ]
        },
        created_at: '2024-01-11T11:20:00Z'
      },
      {
        id: '6',
        title: 'Plant Growth Study',
        summary: 'Measurement of plant height and leaf count under different light conditions',
        author: 'Dr. Robert Kim',
        date: '2024-01-10',
        tags: ['plant growth', 'light', 'height', 'botany'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Light Hours', 'Height (cm)', 'Leaf Count', 'Week'],
          rows: [
            [6, 12.5, 8, 1],
            [8, 18.2, 12, 2],
            [10, 25.8, 18, 3],
            [12, 32.1, 24, 4],
            [14, 28.9, 22, 5],
            [16, 26.3, 20, 6],
            [6, 11.8, 7, 1],
            [8, 17.5, 11, 2],
            [10, 24.2, 17, 3],
            [12, 30.8, 23, 4],
            [14, 27.1, 21, 5],
            [16, 24.8, 19, 6]
          ]
        },
        created_at: '2024-01-10T13:45:00Z'
      },
      {
        id: '7',
        title: 'Chemical Reaction Kinetics',
        summary: 'Reaction rate analysis at different temperatures and concentrations',
        author: 'Dr. Maria Garcia',
        date: '2024-01-09',
        tags: ['kinetics', 'temperature', 'concentration', 'chemistry'],
        source: 'experiment',
        data_type: 'experiment',
        data_content: {
          type: 'spreadsheet',
          headers: ['Temperature (K)', 'Concentration (M)', 'Rate (M/s)', 'ln(Rate)'],
          rows: [
            [298, 0.1, 0.0023, -6.08],
            [298, 0.2, 0.0046, -5.38],
            [298, 0.3, 0.0069, -4.98],
            [308, 0.1, 0.0045, -5.40],
            [308, 0.2, 0.0090, -4.71],
            [308, 0.3, 0.0135, -4.31],
            [318, 0.1, 0.0087, -4.74],
            [318, 0.2, 0.0174, -4.05],
            [318, 0.3, 0.0261, -3.65]
          ]
        },
        created_at: '2024-01-09T15:20:00Z'
      }
    ];
    
    setResults(dummyResults);
  };

  const handleSaveResult = (result: ResultEntry) => {
    setResults(prev => [result, ...prev]);
    fetchStats();
  };

  // Enhanced Spreadsheet Tools
  const renderSpreadsheetTools = () => (
    <div className="space-y-6">
      {/* Enhanced Data Entry Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TableIcon className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>Unified Data Entry System</CardTitle>
                <CardDescription>Create, import, and manage research data with our enhanced tools</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowDataEntry(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Data Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_results || 0}</div>
                <div className="text-sm text-blue-600">Total Results</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.this_month || 0}</div>
                <div className="text-sm text-green-600">This Month</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.manual_entries || 0}</div>
                <div className="text-sm text-purple-600">Manual Entries</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.imports || 0}</div>
                <div className="text-sm text-orange-600">Imports</div>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Excel (.xlsx, .xls), CSV, TSV up to 10MB
            </p>
          </div>
          
          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button onClick={handleImport} disabled={importStatus === 'importing'}>
                  {importStatus === 'importing' ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
              {importStatus === 'success' && (
                <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Data imported successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Import Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TableIcon className="h-5 w-5 text-green-600" />
                  <CardTitle>Supported Formats</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Excel (.xlsx, .xls)', desc: 'Import from Excel spreadsheets', icon: '📊' },
                  { name: 'CSV Files', desc: 'Import comma-separated values', icon: '📄' },
                  { name: 'TSV Files', desc: 'Import tab-separated values', icon: '📋' },
                  { name: 'Google Sheets', desc: 'Import from Google Sheets', icon: '☁️' }
                ].map((format) => (
                  <div key={format.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{format.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{format.name}</p>
                      <p className="text-sm text-gray-600">{format.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CogIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle>Data Processing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Data Validation', desc: 'Check data integrity & format', icon: '✅' },
                  { name: 'Template Library', desc: 'Pre-built data entry forms', icon: '📚' },
                  { name: 'Format Detection', desc: 'Auto-detect file format', icon: '🔍' },
                  { name: 'Error Handling', desc: 'Graceful error management', icon: '⚠️' }
                ].map((tool) => (
                  <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{tool.name}</p>
                      <p className="text-sm text-gray-600">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Enhanced Image Tools
  const renderImageTools = () => (
    <div className="space-y-6">
      {/* Image Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Image & Document Upload</CardTitle>
              <CardDescription>Import and process various image and document formats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-purple-600 hover:text-purple-500 font-medium">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Images (PNG, JPG, TIFF), PDFs up to 50MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Processing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              <CardTitle>Research Images</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Microscope Images', desc: 'Import microscopy & imaging data', icon: '🔬' },
              { name: 'Gel Images', desc: 'Import electrophoresis gels', icon: '🧬' },
              { name: 'Charts & Graphs', desc: 'Import visual data representations', icon: '📈' },
              { name: 'Lab Photos', desc: 'Import experimental setup photos', icon: '📸' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-5 w-5 text-blue-600" />
              <CardTitle>Document Processing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'PDF Documents', desc: 'Extract data from PDF reports', icon: '📄' },
              { name: 'Lab Notebooks', desc: 'Import handwritten notes', icon: '📓' },
              { name: 'OCR Processing', desc: 'Convert images to text', icon: '🔤' },
              { name: 'Text Extraction', desc: 'Extract text from images', icon: '📝' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Enhanced Manual Entry
  const renderManualEntry = () => (
    <div className="space-y-6">
      {/* Form Builder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PencilIcon className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle>Enhanced Manual Data Entry</CardTitle>
                <CardDescription>Create custom data entry forms with our unified system</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowDataEntry(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Data Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
              <Input placeholder="Enter form name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
              <Select>
                <option>Experimental Data</option>
                <option>Sample Information</option>
                <option>Equipment Log</option>
                <option>Results Summary</option>
              </Select>
            </div>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </CardContent>
      </Card>

      {/* Manual Entry Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <PencilIcon className="h-5 w-5 text-orange-600" />
              <CardTitle>Data Entry Tools</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Form Builder', desc: 'Create custom data entry forms', icon: '📝' },
              { name: 'Bulk Entry', desc: 'Enter multiple records at once', icon: '📊' },
              { name: 'Data Templates', desc: 'Use predefined data structures', icon: '📋' },
              { name: 'Field Validation', desc: 'Real-time data validation', icon: '✅' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CogIcon className="h-5 w-5 text-gray-600" />
              <CardTitle>Data Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Validation Rules', desc: 'Set data quality standards', icon: '🔒' },
              { name: 'Auto-save', desc: 'Prevent data loss', icon: '💾' },
              { name: 'Data Review', desc: 'Review and approve entries', icon: '👁️' },
              { name: 'Audit Trail', desc: 'Track all data changes', icon: '📋' }
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{tool.name}</p>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Restored AI Presentations
  const renderPresentations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Presentations</CardTitle>
          <CardDescription>Create stunning presentations from your research data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PresentationChartLineIcon className="mx-auto h-16 w-16 text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Presentation Generator</h3>
            <p className="text-gray-600 mb-6">Transform your research data into professional presentations</p>
            <div className="flex justify-center gap-4">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Presentation
              </Button>
              <Button variant="outline">
                <InformationCircleIcon className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Simple Data Entry Modal
  const renderDataEntryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Data Entry</h2>
            <button onClick={() => setShowDataEntry(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <Input
                value={entryForm.title}
                onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter data entry title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
              <Select
                value={entryForm.data_type}
                onChange={(e) => setEntryForm(prev => ({ ...prev, data_type: e.target.value }))}
              >
                <option value="experiment">Experiment</option>
                <option value="observation">Observation</option>
                <option value="measurement">Measurement</option>
                <option value="survey">Survey</option>
                <option value="simulation">Simulation</option>
                <option value="other">Other</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
              <textarea
                value={entryForm.summary}
                onChange={(e) => setEntryForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief description of the data entry"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <Input
                value={entryForm.tags}
                onChange={(e) => setEntryForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowDataEntry(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle save logic here
              setShowDataEntry(false);
              setEntryForm({ title: '', summary: '', data_type: 'experiment', tags: '' });
            }} className="bg-blue-600 hover:bg-blue-700">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Analytics functions - optimized to prevent flickering
  const runAnalytics = useCallback((dataset: any) => {
    // Prevent multiple rapid calls
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setSelectedDataset(dataset);
    setShowAnalytics(true);
    
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
      // Perform statistical analysis
      const data = dataset.data_content;
      if (data.type === 'spreadsheet' && data.rows && data.headers) {
        const numericColumns = data.headers.map((header: string, index: number) => {
          const values = data.rows.map((row: any[]) => parseFloat(row[index])).filter(v => !isNaN(v));
          return { header, values, index };
        }).filter(col => col.values.length > 0);
        
        // Basic statistics
        const analysis = numericColumns.map(col => {
          const values = col.values;
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const sorted = [...values].sort((a, b) => a - b);
          const median = sorted.length % 2 === 0 
            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
            : sorted[Math.floor(sorted.length/2)];
          const min = Math.min(...values);
          const max = Math.max(...values);
          const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          // Additional statistics
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / values.length;
          
          return {
            column: col.header,
            mean: mean.toFixed(3),
            median: median.toFixed(3),
            min: min.toFixed(3),
            max: max.toFixed(3),
            stdDev: stdDev.toFixed(3),
            q1: q1.toFixed(3),
            q3: q3.toFixed(3),
            iqr: iqr.toFixed(3),
            skewness: skewness.toFixed(3),
            count: values.length,
            values: values // Keep for correlations and charts
          };
        });
        
        // Correlation analysis
        const correlations = [];
        for (let i = 0; i < numericColumns.length; i++) {
          for (let j = i + 1; j < numericColumns.length; j++) {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            
            if (col1.values.length === col2.values.length) {
              const correlation = calculateCorrelation(col1.values, col2.values);
              correlations.push({
                column1: col1.header,
                column2: col2.header,
                correlation: correlation.toFixed(3),
                strength: getCorrelationStrength(correlation)
              });
            }
          }
        }
        
        // Batch state updates to prevent flickering
        Promise.resolve().then(() => {
          setAnalyticsResults({
            basic: analysis,
            correlations: correlations,
            numericColumns: numericColumns
          });
          setIsAnalyzing(false);
        });
      }
    });
  }, [isAnalyzing]);

  // Memoize result card renderer to prevent flickering
  const renderResultCard = useCallback((result: any) => (
    <Card key={result.id} className="hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] will-change-transform">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            result.data_type === 'experiment' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {result.data_type}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(result.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{result.summary}</p>
        
        {result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {result.tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-3">
          By {result.author}
        </div>
        
        {result.data_content && result.data_content.type === 'spreadsheet' && (
          <div className="text-xs text-gray-500 mb-3">
            📊 {result.data_content.rows?.length || 0} rows × {result.data_content.headers?.length || 0} columns
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedDataset(result);
              setShowAnalytics(true);
              setAnalyticsResults(null);
            }}
            variant="outline"
            className="flex-1"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Data
          </Button>
          <Button
            onClick={() => runAnalytics(result)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            disabled={isAnalyzing}
          >
            <BarChartIcon className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Run Stats'}
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [isAnalyzing, runAnalytics, setSelectedDataset, setShowAnalytics, setAnalyticsResults]);
  
  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]) => {
    const n = x.length;
    if (n !== y.length) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };
  
  // Get correlation strength description
  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return { text: 'Very Strong', color: 'text-red-600', bg: 'bg-red-100' };
    if (abs >= 0.6) return { text: 'Strong', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (abs >= 0.4) return { text: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (abs >= 0.2) return { text: 'Weak', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { text: 'Very Weak', color: 'text-gray-600', bg: 'bg-gray-100' };
  };
  
  // Generate simple bar chart data for visualization
  const generateChartData = (column: any) => {
    const values = column.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binSize = range / binCount;
    
    const bins = new Array(binCount).fill(0);
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex]++;
    });
    
    const labels = bins.map((_, i) => {
      const start = min + i * binSize;
      const end = min + (i + 1) * binSize;
      return `${start.toFixed(1)}-${end.toFixed(1)}`;
    });
    
    return { labels, bins, maxBin: Math.max(...bins) };
  };
  
  // Calculate linear regression and R-squared
  const calculateLinearRegression = (x: number[], y: number[]) => {
    const n = x.length;
    if (n !== y.length || n < 2) return null;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((acc, val, i) => acc + Math.pow(val - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    // Generate trendline points
    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const trendlineX = [xMin, xMax];
    const trendlineY = trendlineX.map(x => slope * x + intercept);
    
    return {
      slope: slope.toFixed(4),
      intercept: intercept.toFixed(4),
      rSquared: rSquared.toFixed(4),
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
      trendlineX,
      trendlineY
    };
  };
  
  // Generate scatter plot data
  const generateScatterData = (xCol: any, yCol: any) => {
    if (!xCol || !yCol) return null;
    
    const data = xCol.values.map((x: number, i: number) => ({
      x: x,
      y: yCol.values[i]
    })).filter((point: any) => !isNaN(point.x) && !isNaN(point.y));
    
    const regression = calculateLinearRegression(
      data.map(p => p.x),
      data.map(p => p.y)
    );
    
    return { data, regression };
  };
  
  // Generate bar chart data for categorical comparison
  const generateBarChartData = (columns: any[]) => {
    if (columns.length < 2) return null;
    
    const xCol = columns[0];
    const yCol = columns[1];
    
    // Group by x values and calculate mean y values
    const grouped = new Map();
    xCol.values.forEach((x: any, i: number) => {
      if (!isNaN(x) && !isNaN(yCol.values[i])) {
        if (!grouped.has(x)) {
          grouped.set(x, []);
        }
        grouped.get(x).push(yCol.values[i]);
      }
    });
    
    const barData = Array.from(grouped.entries()).map(([x, yValues]) => ({
      x: x.toString(),
      y: yValues.reduce((a: number, b: number) => a + b, 0) / yValues.length
    }));
    
    return barData.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
  };
  
  // Calculate additional advanced statistics
  const calculateAdvancedStats = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    // Variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)];
    const q2 = sorted[Math.floor(n * 0.5)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    
    // Skewness and Kurtosis
    const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
    const kurtosis = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;
    
    // Outliers (using IQR method)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);
    
    // Coefficient of variation
    const cv = (stdDev / mean) * 100;
    
    // Standard error of mean
    const sem = stdDev / Math.sqrt(n);
    
    // Confidence interval (95%)
    const tValue = 1.96; // Approximate for large samples
    const ciLower = mean - tValue * sem;
    const ciUpper = mean + tValue * sem;
    
    return {
      q1: q1.toFixed(3),
      q2: q2.toFixed(3),
      q3: q3.toFixed(3),
      iqr: iqr.toFixed(3),
      skewness: skewness.toFixed(3),
      kurtosis: kurtosis.toFixed(3),
      outliers: outliers.length,
      cv: cv.toFixed(2),
      sem: sem.toFixed(3),
      ciLower: ciLower.toFixed(3),
      ciUpper: ciUpper.toFixed(3)
    };
  };

  // Analytics Modal
  const renderAnalyticsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Advanced Data Analytics</h2>
            <button onClick={() => setShowAnalytics(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Chart Type Selection */}
          {analyticsResults?.numericColumns && analyticsResults.numericColumns.length >= 2 && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Chart Type</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'histogram', label: 'Histogram', icon: '📊' },
                      { value: 'scatter', label: 'Scatter Plot', icon: '🔍' },
                      { value: 'bar', label: 'Bar Chart', icon: '📈' }
                    ].map(type => (
                      <button
                        key={type.value}
                        onClick={() => setChartType(type.value as any)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          chartType === type.value
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {chartType === 'scatter' && (
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">X Axis</label>
                      <select
                        value={selectedColumns.x}
                        onChange={(e) => setSelectedColumns(prev => ({ ...prev, x: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Column</option>
                        {analyticsResults.numericColumns.map((col: any) => (
                          <option key={col.header} value={col.header}>{col.header}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Y Axis</label>
                      <select
                        value={selectedColumns.y}
                        onChange={(e) => setSelectedColumns(prev => ({ ...prev, y: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Column</option>
                        {analyticsResults.numericColumns.map((col: any) => (
                          <option key={col.header} value={col.header}>{col.header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedDataset && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedDataset.title}</h3>
              <p className="text-gray-600">{selectedDataset.summary}</p>
            </div>
          )}
          
          {/* Data Display */}
          {selectedDataset && selectedDataset.data_content && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Dataset Preview</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedDataset.data_content.headers?.map((header: string, index: number) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDataset.data_content.rows?.slice(0, 10).map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-b">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedDataset.data_content.rows && selectedDataset.data_content.rows.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                    Showing first 10 rows of {selectedDataset.data_content.rows.length} total rows
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-blue-600 bg-blue-100 rounded-md">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing data and generating statistics...
              </div>
            </div>
          )}
          
          {/* Analytics Results */}
          {analyticsResults && !isAnalyzing && (
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-900 mb-3">Statistical Analysis Results</h4>
              
              {/* Basic Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsResults.basic?.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{result.column}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mean:</span>
                          <span className="font-medium">{result.mean}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Median:</span>
                          <span className="font-medium">{result.median}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min:</span>
                          <span className="font-medium">{result.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max:</span>
                          <span className="font-medium">{result.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Std Dev:</span>
                          <span className="font-medium">{result.stdDev}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Count:</span>
                          <span className="font-medium">{result.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Q1:</span>
                          <span className="font-medium">{result.q1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Q3:</span>
                          <span className="font-medium">{result.q3}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IQR:</span>
                          <span className="font-medium">{result.iqr}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Skewness:</span>
                          <span className="font-medium">{result.skewness}</span>
                        </div>
                      </div>
                      
                      {/* Simple Histogram Chart */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Distribution</h5>
                        <div className="space-y-1">
                          {(() => {
                            const chartData = generateChartData(result);
                            return chartData.labels.map((label, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-16">{label}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${(chartData.bins[i] / chartData.maxBin) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 w-8">{chartData.bins[i]}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Correlation Analysis */}
              {analyticsResults.correlations && analyticsResults.correlations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Correlation Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsResults.correlations.map((corr, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">
                              {corr.column1} ↔ {corr.column2}
                            </div>
                            <div className={`text-2xl font-bold ${corr.strength.color} mb-2`}>
                              {corr.correlation}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${corr.strength.bg} ${corr.strength.color}`}>
                              {corr.strength.text}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Advanced Chart Visualizations */}
              {analyticsResults?.numericColumns && analyticsResults.numericColumns.length >= 2 && (
                <div className="space-y-6">
                  <h4 className="font-semibold text-gray-900">Advanced Visualizations</h4>
                  
                  {/* Chart Display */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {chartType === 'histogram' && (
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Distribution Histograms</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {analyticsResults.basic?.slice(0, 4).map((result, index) => (
                            <div key={index} className="space-y-3">
                              <h6 className="font-medium text-gray-800">{result.column}</h6>
                              <div className="space-y-2">
                                {(() => {
                                  const chartData = generateChartData(result);
                                  return chartData.labels.map((label, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 w-16">{label}</span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                                        <div 
                                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
                                          style={{ width: `${(chartData.bins[i] / chartData.maxBin) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-600 w-8">{chartData.bins[i]}</span>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {chartType === 'scatter' && selectedColumns.x && selectedColumns.y && (
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Scatter Plot: {selectedColumns.x} vs {selectedColumns.y}</h5>
                        {(() => {
                          const xCol = analyticsResults.numericColumns.find((col: any) => col.header === selectedColumns.x);
                          const yCol = analyticsResults.numericColumns.find((col: any) => col.header === selectedColumns.y);
                          const scatterData = generateScatterData(xCol, yCol);
                          
                          if (!scatterData) return <p className="text-gray-500">No valid data for selected columns</p>;
                          
                          return (
                            <div className="space-y-4">
                              {/* Simple Scatter Plot Visualization */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-center text-sm text-gray-600 mb-2">
                                  Data Points: {scatterData.data.length}
                                </div>
                                <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
                                  {scatterData.data.slice(0, 64).map((point, i) => (
                                    <div
                                      key={i}
                                      className="w-3 h-3 bg-blue-500 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                      title={`${point.x}, ${point.y}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Regression Analysis */}
                              {scatterData.regression && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h6 className="font-medium text-blue-900 mb-3">Linear Regression Analysis</h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-blue-700">Slope:</span>
                                      <div className="font-semibold text-blue-900">{scatterData.regression.slope}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">Intercept:</span>
                                      <div className="font-semibold text-blue-900">{scatterData.regression.intercept}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">R²:</span>
                                      <div className="font-semibold text-blue-900">{scatterData.regression.rSquared}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-700">Equation:</span>
                                      <div className="font-semibold text-blue-900 text-xs">{scatterData.regression.equation}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {chartType === 'bar' && (
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Bar Chart Analysis</h5>
                        {(() => {
                          const barData = generateBarChartData(analyticsResults.numericColumns.slice(0, 2));
                          
                          if (!barData) return <p className="text-gray-500">Need at least 2 numeric columns for bar chart</p>;
                          
                          const maxValue = Math.max(...barData.map(d => d.y));
                          
                          return (
                            <div className="space-y-3">
                              {barData.map((bar, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700 w-16">{bar.x}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-6 rounded-full transition-all duration-500"
                                      style={{ width: `${(bar.y / maxValue) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 w-16 text-right">{bar.y.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Advanced Statistics */}
              {analyticsResults?.basic && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Advanced Statistical Measures</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsResults.basic.map((result, index) => {
                      const advancedStats = calculateAdvancedStats(result.values);
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg">{result.column}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Kurtosis:</span>
                                <span className="font-medium">{advancedStats.kurtosis}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Outliers:</span>
                                <span className="font-medium">{advancedStats.outliers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">CV (%):</span>
                                <span className="font-medium">{advancedStats.cv}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">SEM:</span>
                                <span className="font-medium">{advancedStats.sem}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">95% CI:</span>
                                <span className="font-medium text-xs">{advancedStats.ciLower} - {advancedStats.ciUpper}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Statistical Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
                <p className="text-blue-800 text-sm">
                  Analysis performed on {analyticsResults.basic?.length || 0} numeric columns with {analyticsResults.basic?.reduce((acc, r) => acc + r.count, 0) || 0} total data points.
                  {analyticsResults.correlations && analyticsResults.correlations.length > 0 && 
                    ` Found ${analyticsResults.correlations.length} correlation relationships.`
                  }
                  Advanced statistics include kurtosis, outlier detection, confidence intervals, and regression analysis with R-squared values.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Restored Data Analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Analytics & Insights</CardTitle>
          <CardDescription>Comprehensive analysis tools for your research data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChartIcon className="mx-auto h-16 w-16 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Data Analytics</h3>
            <p className="text-gray-600 mb-6">Professional statistical analysis and visualization tools</p>
            <div className="flex justify-center gap-4">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <BarChartIcon className="w-5 h-5 mr-2" />
                Launch Analytics
              </Button>
              <Button variant="outline">
                <InformationCircleIcon className="w-5 h-5 mr-2" />
                View Examples
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {showDataEntry && renderDataEntryModal()}
      {showAnalytics && (
        <div key="analytics-modal" className="fixed inset-0 z-50">
          {renderAnalyticsModal()}
        </div>
      )}
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto"
        ref={scrollRef} 
        onScroll={handleScroll}
        style={{ 
          scrollBehavior: 'smooth',
          willChange: 'scroll-position',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data & Results</h1>
          <p className="text-gray-600 text-lg">
            Comprehensive data entry and management tools with AI-powered analytics
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search data entry tools, import options, or data sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'spreadsheet'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📈 Enhanced Data Entry
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'images'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🖼️ Image & Documents
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('presentations')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'presentations'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🎯 AI Presentations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Data Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'spreadsheet' && renderSpreadsheetTools()}
        {activeTab === 'images' && renderImageTools()}
        {activeTab === 'manual' && renderManualEntry()}
        {activeTab === 'presentations' && renderPresentations()}
        {activeTab === 'analytics' && renderAnalytics()}
        
        {/* Results Display Section - Optimized */}
        {results.length > 0 && (
          <div className="mt-8" style={{ willChange: 'contents' }}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChartIcon className="h-5 w-5 mr-2"/>
                  Available Datasets for Analysis ({results.length})
                </CardTitle>
                <CardDescription>
                  Click "Run Stats" on any dataset to perform statistical analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.map(renderResultCard)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataResultsPage;

