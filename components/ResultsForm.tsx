import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  ChartBarIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  PhotoIcon,
  DocumentIcon
} from '../components/icons';

interface ResultsFormProps {
  onSubmit: (results: ResultsData) => void;
  onCancel: () => void;
  initialData?: Partial<ResultsData>;
}

interface ResultsData {
  title: string;
  description: string;
  result_type: 'data' | 'analysis' | 'visualization' | 'summary' | 'raw_data' | 'processed_data';
  experiment_id: string;
  protocol_id: string;
  data_source: 'manual' | 'instrument' | 'software' | 'calculation' | 'simulation';
  methodology: string;
  key_findings: string[];
  statistical_analysis: string;
  confidence_level: 'low' | 'medium' | 'high';
  significance: 'not_significant' | 'marginally_significant' | 'significant' | 'highly_significant';
  limitations: string[];
  next_steps: string[];
  conclusions: string;
  implications: string;
  reproducibility_notes: string;
  data_files: string[];
  figures: string[];
  references: string[];
  collaborators: string[];
  tags: string[];
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

const ResultsForm: React.FC<ResultsFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ResultsData>({
    title: '',
    description: '',
    result_type: 'data',
    experiment_id: '',
    protocol_id: '',
    data_source: 'manual',
    methodology: '',
    key_findings: [''],
    statistical_analysis: '',
    confidence_level: 'medium',
    significance: 'not_significant',
    limitations: [''],
    next_steps: [''],
    conclusions: '',
    implications: '',
    reproducibility_notes: '',
    data_files: [''],
    figures: [''],
    references: [''],
    collaborators: [''],
    tags: [''],
    lab_id: '',
    privacy_level: 'lab',
    ...initialData
  });

  const [newItem, setNewItem] = useState({
    finding: '',
    limitation: '',
    next_step: '',
    data_file: '',
    figure: '',
    reference: '',
    collaborator: '',
    tag: ''
  });

  const resultTypes = [
    { value: 'data', label: 'Raw Data' },
    { value: 'analysis', label: 'Data Analysis' },
    { value: 'visualization', label: 'Data Visualization' },
    { value: 'summary', label: 'Results Summary' },
    { value: 'processed_data', label: 'Processed Data' }
  ];

  const dataSources = [
    { value: 'manual', label: 'Manual Entry' },
    { value: 'instrument', label: 'Instrument Output' },
    { value: 'software', label: 'Software Analysis' },
    { value: 'calculation', label: 'Calculation' },
    { value: 'simulation', label: 'Simulation' }
  ];

  const confidenceLevels = [
    { value: 'low', label: 'Low Confidence', color: 'text-red-600' },
    { value: 'medium', label: 'Medium Confidence', color: 'text-yellow-600' },
    { value: 'high', label: 'High Confidence', color: 'text-green-600' }
  ];

  const significanceLevels = [
    { value: 'not_significant', label: 'Not Significant' },
    { value: 'marginally_significant', label: 'Marginally Significant' },
    { value: 'significant', label: 'Significant' },
    { value: 'highly_significant', label: 'Highly Significant' }
  ];

  const handleInputChange = (field: keyof ResultsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemAdd = (field: keyof ResultsData, item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), item.trim()]
      }));
    }
  };

  const handleArrayItemRemove = (field: keyof ResultsData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="w-6 h-6 mr-2 text-purple-500" />
              Add Results
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Results Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief, descriptive title for your results"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Detailed description of the results..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Result Type *</label>
                    <Select
                      value={formData.result_type}
                      onChange={(e) => handleInputChange('result_type', e.target.value)}
                      options={resultTypes}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Source *</label>
                    <Select
                      value={formData.data_source}
                      onChange={(e) => handleInputChange('data_source', e.target.value)}
                      options={dataSources}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experiment ID</label>
                    <Input
                      value={formData.experiment_id}
                      onChange={(e) => handleInputChange('experiment_id', e.target.value)}
                      placeholder="Related experiment ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Protocol ID</label>
                    <Input
                      value={formData.protocol_id}
                      onChange={(e) => handleInputChange('protocol_id', e.target.value)}
                      placeholder="Related protocol ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Methodology</label>
                    <Input
                      value={formData.methodology}
                      onChange={(e) => handleInputChange('methodology', e.target.value)}
                      placeholder="Analysis method used"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Findings */}
            <Card>
              <CardHeader>
                <CardTitle>Key Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.key_findings.map((finding, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={finding}
                      onChange={(e) => {
                        const newFindings = [...formData.key_findings];
                        newFindings[index] = e.target.value;
                        handleInputChange('key_findings', newFindings);
                      }}
                      placeholder="Key finding or observation"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleArrayItemRemove('key_findings', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={newItem.finding}
                    onChange={(e) => setNewItem(prev => ({ ...prev, finding: e.target.value }))}
                    placeholder="Add key finding"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleArrayItemAdd('key_findings', newItem.finding);
                      setNewItem(prev => ({ ...prev, finding: '' }));
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistical Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Statistical Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statistical Analysis</label>
                  <textarea
                    value={formData.statistical_analysis}
                    onChange={(e) => handleInputChange('statistical_analysis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe statistical tests, p-values, effect sizes, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                    <Select
                      value={formData.confidence_level}
                      onChange={(e) => handleInputChange('confidence_level', e.target.value)}
                      options={confidenceLevels}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statistical Significance</label>
                    <Select
                      value={formData.significance}
                      onChange={(e) => handleInputChange('significance', e.target.value)}
                      options={significanceLevels}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limitations and Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Limitations & Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Limitations</label>
                  {formData.limitations.map((limitation, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={limitation}
                        onChange={(e) => {
                          const newLimitations = [...formData.limitations];
                          newLimitations[index] = e.target.value;
                          handleInputChange('limitations', newLimitations);
                        }}
                        placeholder="Study limitation"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('limitations', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.limitation}
                      onChange={(e) => setNewItem(prev => ({ ...prev, limitation: e.target.value }))}
                      placeholder="Add limitation"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('limitations', newItem.limitation);
                        setNewItem(prev => ({ ...prev, limitation: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps</label>
                  {formData.next_steps.map((step, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...formData.next_steps];
                          newSteps[index] = e.target.value;
                          handleInputChange('next_steps', newSteps);
                        }}
                        placeholder="Next step or follow-up"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('next_steps', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.next_step}
                      onChange={(e) => setNewItem(prev => ({ ...prev, next_step: e.target.value }))}
                      placeholder="Add next step"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('next_steps', newItem.next_step);
                        setNewItem(prev => ({ ...prev, next_step: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conclusions and Implications */}
            <Card>
              <CardHeader>
                <CardTitle>Conclusions & Implications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
                  <textarea
                    value={formData.conclusions}
                    onChange={(e) => handleInputChange('conclusions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="What conclusions can be drawn from these results?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Implications</label>
                  <textarea
                    value={formData.implications}
                    onChange={(e) => handleInputChange('implications', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="What are the broader implications of these findings?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reproducibility Notes</label>
                  <textarea
                    value={formData.reproducibility_notes}
                    onChange={(e) => handleInputChange('reproducibility_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Notes on how to reproduce these results..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Files and References */}
            <Card>
              <CardHeader>
                <CardTitle>Files & References</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Files</label>
                  {formData.data_files.map((file, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={file}
                        onChange={(e) => {
                          const newFiles = [...formData.data_files];
                          newFiles[index] = e.target.value;
                          handleInputChange('data_files', newFiles);
                        }}
                        placeholder="Data file name or URL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('data_files', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.data_file}
                      onChange={(e) => setNewItem(prev => ({ ...prev, data_file: e.target.value }))}
                      placeholder="Add data file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('data_files', newItem.data_file);
                        setNewItem(prev => ({ ...prev, data_file: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Figures/Images</label>
                  {formData.figures.map((figure, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={figure}
                        onChange={(e) => {
                          const newFigures = [...formData.figures];
                          newFigures[index] = e.target.value;
                          handleInputChange('figures', newFigures);
                        }}
                        placeholder="Figure name or URL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('figures', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.figure}
                      onChange={(e) => setNewItem(prev => ({ ...prev, figure: e.target.value }))}
                      placeholder="Add figure"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('figures', newItem.figure);
                        setNewItem(prev => ({ ...prev, figure: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
                  {formData.references.map((reference, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={reference}
                        onChange={(e) => {
                          const newReferences = [...formData.references];
                          newReferences[index] = e.target.value;
                          handleInputChange('references', newReferences);
                        }}
                        placeholder="Reference citation"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('references', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.reference}
                      onChange={(e) => setNewItem(prev => ({ ...prev, reference: e.target.value }))}
                      placeholder="Add reference"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('references', newItem.reference);
                        setNewItem(prev => ({ ...prev, reference: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaborators and Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Collaborators & Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collaborators</label>
                  {formData.collaborators.map((collaborator, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={collaborator}
                        onChange={(e) => {
                          const newCollaborators = [...formData.collaborators];
                          newCollaborators[index] = e.target.value;
                          handleInputChange('collaborators', newCollaborators);
                        }}
                        placeholder="Collaborator name or email"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('collaborators', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.collaborator}
                      onChange={(e) => setNewItem(prev => ({ ...prev, collaborator: e.target.value }))}
                      placeholder="Add collaborator"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('collaborators', newItem.collaborator);
                        setNewItem(prev => ({ ...prev, collaborator: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleArrayItemRemove('tags', index)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.tag}
                      onChange={(e) => setNewItem(prev => ({ ...prev, tag: e.target.value }))}
                      placeholder="Add tag"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('tags', newItem.tag);
                        setNewItem(prev => ({ ...prev, tag: '' }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
                  <Select
                    value={formData.privacy_level}
                    onChange={(e) => handleInputChange('privacy_level', e.target.value)}
                    options={[
                      { value: 'personal', label: 'Only Me' },
                      { value: 'team', label: 'My Team' },
                      { value: 'lab', label: 'My Lab' },
                      { value: 'institution', label: 'My Institution' },
                      { value: 'global', label: 'Global (Public)' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Save Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsForm;
