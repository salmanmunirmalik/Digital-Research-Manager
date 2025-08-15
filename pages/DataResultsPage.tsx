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
  EditIcon
} from '../components/icons';

const DataResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'images' | 'manual'>('spreadsheet');
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
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'spreadsheet' && renderSpreadsheetTools()}
        {activeTab === 'images' && renderImageTools()}

        {activeTab === 'manual' && renderManualEntry()}
      </div>
    </div>
  );
};

export default DataResultsPage;
