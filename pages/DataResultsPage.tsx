import React, { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  BarChartIcon, 
  FilesIcon, 
  FilterIcon, 
  LineChartIcon, 
  LightbulbIcon, 
  CheckCircleIcon, 
  PencilIcon, 
  DocumentIcon,
  ImageIcon,
  TableIcon,
  ChartBarIcon,
  CogIcon,
  UploadIcon,
  DownloadIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  SigmaIcon,
  BrainCircuitIcon
} from '../components/icons';

const DataResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'images' | 'manual' | 'analysis' | 'presentations'>('spreadsheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');

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

  const renderSpreadsheetTools = () => (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TableIcon className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle>File Upload & Import</CardTitle>
              <CardDescription>Upload and import data from various spreadsheet formats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

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
    </div>
  );

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



  const renderDataAnalysis = () => (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Datasets</p>
                <p className="text-3xl font-bold">1,247</p>
              </div>
              <BarChartIcon className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Analysis</p>
                <p className="text-3xl font-bold">23</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Insights Found</p>
                <p className="text-3xl font-bold">156</p>
              </div>
              <LightbulbIcon className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Accuracy Score</p>
                <p className="text-3xl font-bold">98.7%</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChartIcon className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle>Statistical Analysis</CardTitle>
                <CardDescription>Advanced statistical methods and hypothesis testing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start">
                <BarChartIcon className="h-4 w-4 mr-2" />
                Descriptive Stats
              </Button>
              <Button variant="outline" className="justify-start">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Correlation Analysis
              </Button>
              <Button variant="outline" className="justify-start">
                <SigmaIcon className="h-4 w-4 mr-2" />
                Hypothesis Testing
              </Button>
              <Button variant="outline" className="justify-start">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Regression Models
              </Button>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Quick Analysis</h4>
              <p className="text-sm text-purple-700">Select your dataset and choose analysis type for instant insights</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Data Visualization</CardTitle>
                <CardDescription>Create stunning charts and interactive dashboards</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start">
                <BarChartIcon className="h-4 w-4 mr-2" />
                Bar Charts
              </Button>
              <Button variant="outline" className="justify-start">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Line Graphs
              </Button>
              <Button variant="outline" className="justify-start">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Scatter Plots
              </Button>
              <Button variant="outline" className="justify-start">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Heat Maps
              </Button>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Interactive Features</h4>
              <p className="text-sm text-blue-700">Zoom, pan, and hover for detailed data exploration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Learning & AI */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BrainCircuitIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <CardTitle>Machine Learning & AI</CardTitle>
              <CardDescription>Advanced AI-powered data analysis and pattern recognition</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-900 mb-2">Pattern Recognition</h4>
              <p className="text-sm text-indigo-700 mb-3">AI algorithms identify hidden patterns in your data</p>
              <Button size="sm" className="w-full">Analyze Patterns</Button>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Predictive Analytics</h4>
              <p className="text-sm text-green-700 mb-3">Forecast future trends and outcomes</p>
              <Button size="sm" className="w-full" variant="outline">Make Predictions</Button>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">Anomaly Detection</h4>
              <p className="text-sm text-purple-700 mb-3">Find unusual data points automatically</p>
              <Button size="sm" className="w-full" variant="outline">Detect Anomalies</Button>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-900 mb-2">AI Insights Engine</h4>
            <p className="text-sm text-indigo-700 mb-3">
              Our advanced AI analyzes your data and provides actionable insights, 
              statistical significance, and recommended next steps for your research.
            </p>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <BrainCircuitIcon className="h-4 w-4 mr-2" />
              Generate AI Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPresentations = () => (
    <div className="space-y-6">
      {/* AI Presentation Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <CardTitle>AI Presentation Generator</CardTitle>
              <CardDescription>Create stunning presentations from your research data automatically</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Research Topic</label>
              <Input placeholder="Enter your research topic or title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Presentation Type</label>
              <Select>
                <option>Conference Talk</option>
                <option>Lab Meeting</option>
                <option>Grant Proposal</option>
                <option>Journal Club</option>
                <option>Poster Presentation</option>
              </Select>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-900 mb-2">AI Enhancement</h4>
            <p className="text-sm text-indigo-700 mb-3">
              Our AI will analyze your data, create compelling slides, suggest key talking points, 
              and generate professional visualizations automatically.
            </p>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate AI Presentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Presentation Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <PresentationChartLineIcon className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle>Professional Templates</CardTitle>
              <CardDescription>Choose from our curated collection of research presentation templates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Modern Research', style: 'Clean, professional design', color: 'from-blue-500 to-blue-600' },
              { name: 'Scientific Discovery', style: 'Bold, impactful visuals', color: 'from-green-500 to-green-600' },
              { name: 'Data Storytelling', style: 'Narrative-driven layout', color: 'from-purple-500 to-purple-600' },
              { name: 'Conference Ready', style: 'Academic standard format', color: 'from-orange-500 to-orange-600' },
              { name: 'Innovation Lab', style: 'Creative, modern approach', color: 'from-red-500 to-red-600' },
              { name: 'Executive Summary', style: 'Business professional', color: 'from-indigo-500 to-indigo-600' }
            ].map((template) => (
              <div key={template.name} className={`bg-gradient-to-r ${template.color} text-white p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow`}>
                <h4 className="font-medium mb-1">{template.name}</h4>
                <p className="text-sm opacity-90">{template.style}</p>
                <Button size="sm" variant="outline" className="mt-3 w-full border-white text-white hover:bg-white hover:text-gray-900">
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Content Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LightbulbIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <CardTitle>Smart Content Suggestions</CardTitle>
              <CardDescription>AI-powered recommendations for your presentation content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">Key Points</h4>
              <p className="text-sm text-yellow-700 mb-3">AI suggests the most important findings to highlight</p>
              <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">Get Suggestions</Button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Visual Elements</h4>
              <p className="text-sm text-blue-700 mb-3">Recommended charts, graphs, and images</p>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">View Options</Button>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-blue-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-2">Presentation Flow</h4>
            <p className="text-sm text-gray-700 mb-3">
              Our AI analyzes your research narrative and suggests the optimal presentation structure, 
              ensuring your audience follows your scientific journey from hypothesis to conclusion.
            </p>
            <Button className="bg-gradient-to-r from-yellow-600 to-blue-600 hover:from-yellow-700 hover:to-blue-700">
              <LightbulbIcon className="h-4 w-4 mr-2" />
              Optimize Flow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderManualEntry = () => (
    <div className="space-y-6">
      {/* Form Builder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <PencilIcon className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle>Custom Form Builder</CardTitle>
              <CardDescription>Create custom data entry forms for your research needs</CardDescription>
            </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data & Results</h1>
          <p className="text-gray-600 text-lg">
            Comprehensive data entry and management tools for your research laboratory
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
              📈 Spreadsheet Import
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
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Data Analysis
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
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'spreadsheet' && renderSpreadsheetTools()}
        {activeTab === 'images' && renderImageTools()}

        {activeTab === 'manual' && renderManualEntry()}
        {activeTab === 'analysis' && renderDataAnalysis()}
        {activeTab === 'presentations' && renderPresentations()}
      </div>
    </div>
  );
};

export default DataResultsPage;
