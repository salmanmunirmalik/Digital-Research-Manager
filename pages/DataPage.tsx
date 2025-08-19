
import React, { useState, useEffect, useMemo } from 'react';
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
  XIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  SaveIcon,
  RefreshCwIcon
} from '../components/icons';

// --- UNIFIED DATA ENTRY COMPONENT ---

interface UnifiedDataEntryProps {
  onClose: () => void;
  onSave: (data: ResultEntry) => void;
  initialData?: Partial<ResultEntry>;
  notebookEntryId?: string;
}

const UnifiedDataEntry: React.FC<UnifiedDataEntryProps> = ({ onClose, onSave, initialData, notebookEntryId }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'spreadsheet' | 'import'>('manual');
  const [formData, setFormData] = useState<DataEntryForm>({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    data_type: 'experiment',
    data_format: 'manual',
    lab_id: '',
    project_id: '',
    tags: [],
    privacy_level: 'lab',
    manual_data: {
      fields: [
        { name: 'Sample ID', type: 'text', value: '', required: true },
        { name: 'Temperature (°C)', type: 'number', value: '', required: true },
        { name: 'pH', type: 'number', value: '', required: true },
        { name: 'Concentration (mg/L)', type: 'number', value: '', required: true }
      ]
    },
    spreadsheet_data: {
      headers: ['Sample ID', 'Temperature (°C)', 'pH', 'Concentration (mg/L)'],
      rows: [['', '', '', ''], ['', '', '', ''], ['', '', '', '']],
      file_name: '',
      file_type: 'excel'
    }
  });

  const [labs, setLabs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<DataTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DataTemplate | null>(null);

  useEffect(() => {
    fetchLabs();
    fetchTemplates();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs || data);
        if (data.labs && data.labs.length > 0) {
          setFormData(prev => ({ ...prev, lab_id: data.labs[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/data/templates?lab_id=' + (formData.lab_id || ''), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleManualFieldChange = (index: number, field: string, value: any) => {
    if (!formData.manual_data) return;
    
    const updatedFields = [...formData.manual_data.fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    
    setFormData(prev => ({
      ...prev,
      manual_data: { ...prev.manual_data!, fields: updatedFields }
    }));
  };

  const addManualField = () => {
    if (!formData.manual_data) return;
    
    setFormData(prev => ({
      ...prev,
      manual_data: {
        ...prev.manual_data!,
        fields: [...prev.manual_data!.fields, { name: '', type: 'text', value: '', required: false }]
      }
    }));
  };

  const removeManualField = (index: number) => {
    if (!formData.manual_data) return;
    
    const updatedFields = formData.manual_data.fields.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      manual_data: { ...prev.manual_data!, fields: updatedFields }
    }));
  };

  const handleSpreadsheetRowChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!formData.spreadsheet_data) return;
    
    const updatedRows = [...formData.spreadsheet_data.rows];
    updatedRows[rowIndex] = [...updatedRows[rowIndex]];
    updatedRows[rowIndex][colIndex] = value;
    
    setFormData(prev => ({
      ...prev,
      spreadsheet_data: { ...prev.spreadsheet_data!, rows: updatedRows }
    }));
  };

  const addSpreadsheetRow = () => {
    if (!formData.spreadsheet_data) return;
    
    const newRow = new Array(formData.spreadsheet_data.headers.length).fill('');
    setFormData(prev => ({
      ...prev,
      spreadsheet_data: { ...prev.spreadsheet_data!, rows: [...prev.spreadsheet_data!.rows, newRow] }
    }));
  };

  const removeSpreadsheetRow = (index: number) => {
    if (!formData.spreadsheet_data) return;
    
    const updatedRows = formData.spreadsheet_data.rows.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      spreadsheet_data: { ...prev.spreadsheet_data!, rows: updatedRows }
    }));
  };

  const handleSave = async () => {
    try {
      const dataContent = activeTab === 'manual' ? formData.manual_data : formData.spreadsheet_data;
      
      const resultData = {
        title: formData.title,
        summary: formData.summary,
        data_type: formData.data_type,
        data_format: activeTab === 'manual' ? 'manual' : 'spreadsheet',
        data_content: dataContent,
        tags: formData.tags,
        privacy_level: formData.privacy_level,
        lab_id: formData.lab_id,
        project_id: formData.project_id,
        source: 'manual',
        notebook_entry_id: notebookEntryId
      };

      const response = await fetch('http://localhost:5001/api/data/results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resultData)
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result.result);
        onClose();
      } else {
        console.error('Failed to save result');
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const applyTemplate = (template: DataTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      manual_data: {
        fields: template.fields.map(field => ({
          name: field.name,
          type: field.type,
          value: field.default_value || '',
          required: field.required,
          options: field.options
        }))
      }
    }));
    setActiveTab('manual');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Unified Data Entry</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Quick Start Templates</h3>
              <div className="flex flex-wrap gap-2">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PencilIcon className="w-4 h-4 inline mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'spreadsheet' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableIcon className="w-4 h-4 inline mr-2" />
              Spreadsheet
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'import' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UploadIcon className="w-4 h-4 inline mr-2" />
              Import Data
            </button>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter data entry title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
              <Select
                value={formData.data_type}
                onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value as any }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
              <Select
                value={formData.lab_id}
                onChange={(e) => setFormData(prev => ({ ...prev, lab_id: e.target.value }))}
              >
                <option value="">Select Lab</option>
                {labs.map(lab => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
              <Select
                value={formData.privacy_level}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy_level: e.target.value as any }))}
              >
                <option value="personal">Personal</option>
                <option value="lab">Lab</option>
                <option value="global">Global</option>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief description of the data entry"
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Manual Data Fields</h3>
                <Button onClick={addManualField} size="sm">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.manual_data?.fields.map((field, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <Input
                      value={field.name}
                      onChange={(e) => handleManualFieldChange(index, 'name', e.target.value)}
                      placeholder="Field name"
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onChange={(e) => handleManualFieldChange(index, 'type', e.target.value)}
                      className="w-32"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                      <option value="select">Select</option>
                    </Select>
                    <Input
                      value={field.value}
                      onChange={(e) => handleManualFieldChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleManualFieldChange(index, 'required', e.target.checked)}
                        className="mr-2"
                      />
                      Required
                    </label>
                    <Button
                      onClick={() => removeManualField(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Spreadsheet Data</h3>
                <Button onClick={addSpreadsheetRow} size="sm">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Row
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr>
                      {formData.spreadsheet_data?.headers.map((header, index) => (
                        <th key={index} className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.spreadsheet_data?.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 px-3 py-2">
                            <Input
                              value={cell}
                              onChange={(e) => handleSpreadsheetRowChange(rowIndex, colIndex, e.target.value)}
                              className="border-0 p-0 focus:ring-0"
                            />
                          </td>
                        ))}
                        <td className="border border-gray-300 px-3 py-2">
                          <Button
                            onClick={() => removeSpreadsheetRow(rowIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports Excel (.xlsx, .xls), CSV, TSV, and Google Sheets
                </p>
                <Button className="mt-4" variant="outline">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <Input
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              }))}
              placeholder="Enter tags separated by commas"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Data Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DATA PAGE COMPONENT ---

const DataPage: React.FC = () => {
  const { user, token } = useAuth();
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [dataTypeFilter, setDataTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchLabs();
    if (labs.length > 0) {
      fetchResults();
      fetchStats();
    }
  }, [labs]);

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
      const queryParams = new URLSearchParams();
      if (labFilter) queryParams.append('lab_id', labFilter);
      if (dataTypeFilter) queryParams.append('data_type', dataTypeFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const response = await fetch(`http://localhost:5001/api/data/results?${queryParams}`, {
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
      const response = await fetch(`http://localhost:5001/api/data/results/stats/overview?lab_id=${labFilter || (labs[0]?.id || '')}`, {
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

  const handleSaveResult = (result: ResultEntry) => {
    setResults(prev => [result, ...prev]);
    fetchStats();
  };

  const handleDeleteResult = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/data/results/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setResults(prev => prev.filter(r => r.id !== id));
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const searchMatch = !searchTerm || 
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const labMatch = !labFilter || result.lab_id === labFilter;
      const dataTypeMatch = !dataTypeFilter || result.data_type === dataTypeFilter;
      
      return searchMatch && labMatch && dataTypeMatch;
    });
  }, [results, searchTerm, labFilter, dataTypeFilter]);

  return (
    <div className="space-y-6">
      {showDataEntry && (
        <UnifiedDataEntry
          onClose={() => setShowDataEntry(false)}
          onSave={handleSaveResult}
          lab_id={labFilter || (labs[0]?.id || '')}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data & Results</h1>
        <p className="mt-1 text-md text-gray-600">
          Unified data entry system - combine manual entry, spreadsheets, and imports in one powerful interface
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setShowDataEntry(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Data Entry
        </Button>
        <Button variant="outline">
          <UploadIcon className="w-5 h-5 mr-2" />
          Import Files
        </Button>
        <Button variant="outline">
          <DownloadIcon className="w-5 h-5 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChartIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Results</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_results || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.this_month || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PencilIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Manual Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.manual_entries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UploadIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Imports</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.imports || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilterIcon className="h-5 w-5 mr-2"/>
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search title or summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
            <Select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
            >
              <option value="">All Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
            <Select
              value={dataTypeFilter}
              onChange={(e) => setDataTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="experiment">Experiment</option>
              <option value="observation">Observation</option>
              <option value="measurement">Measurement</option>
              <option value="survey">Survey</option>
              <option value="simulation">Simulation</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map(result => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      result.source === 'Notebook Summary' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {result.data_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{result.summary}</p>
                
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    By {result.author}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedResult(result);
                        setShowDetailModal(true);
                      }}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteResult(result.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-lg bg-white">
          <BarChartIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Results Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {results.length === 0 ? 'Create your first data entry to get started.' : 'Try adjusting your filters or search term.'}
          </p>
          {results.length === 0 && (
            <Button
              onClick={() => setShowDataEntry(true)}
              className="mt-4"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Data Entry
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DataPage;
