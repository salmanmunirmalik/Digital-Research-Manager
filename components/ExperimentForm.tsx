import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  BeakerIcon,
  PlusIcon,
  MinusIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  CogIcon,
  EyeIcon,
  TrashIcon,
  EditIcon,
  ChartBarIcon
} from '../components/icons';

interface ExperimentFormData {
  title: string;
  startDate: string;
  startTime: string;
  description: string;
  protocolId: string;
  protocolModifications: string;
  problems: string;
  troubleshooting: string;
  resultsLink: string;
}

interface Protocol {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
}

interface ExperimentFormProps {
  initialData?: Partial<ExperimentFormData>;
  protocols?: Protocol[];
  onSubmit: (data: ExperimentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({
  initialData,
  protocols = [],
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ExperimentFormData>({
    title: '',
    startDate: '',
    startTime: '',
    description: '',
    protocolId: '',
    protocolModifications: '',
    problems: '',
    troubleshooting: '',
    resultsLink: '',
    ...initialData
  });

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Title, date, time, and description' },
    { id: 2, title: 'Protocol Selection', description: 'Choose and modify protocol' },
    { id: 3, title: 'Problems & Troubleshooting', description: 'Document issues and solutions' },
    { id: 4, title: 'Results & Review', description: 'Link results and final review' }
  ];

  const handleProtocolSelect = (protocolId: string) => {
    const protocol = protocols.find(p => p.id === protocolId);
    if (protocol) {
      setSelectedProtocol(protocol);
      setFormData(prev => ({
        ...prev,
        protocolId: protocolId
      }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const nextStep = () => {
    if (step < steps.length) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BeakerIcon className="h-6 w-6 text-blue-600" />
              {initialData ? 'Edit Experiment' : 'Create New Experiment'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => (
                <div key={stepItem.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step >= stepItem.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepItem.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      step >= stepItem.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {stepItem.title}
                    </p>
                    <p className="text-xs text-gray-500">{stepItem.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                      step > stepItem.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experiment Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter experiment title"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the experiment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Protocol Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Protocol Selection</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Protocol *
                  </label>
                  <Select
                    value={formData.protocolId}
                    onChange={(e) => handleProtocolSelect(e.target.value)}
                  >
                    <option value="">Choose a protocol...</option>
                    {protocols.map(protocol => (
                      <option key={protocol.id} value={protocol.id}>
                        {protocol.title} - {protocol.category}
                      </option>
                    ))}
                  </Select>
                </div>

                {selectedProtocol && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Selected Protocol: {selectedProtocol.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedProtocol.description}</p>
                    <div className="bg-gray-50 rounded p-3">
                      <h5 className="font-medium text-gray-700 mb-2">Protocol Content:</h5>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedProtocol.content}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protocol Modifications (Optional)
                  </label>
                  <textarea
                    value={formData.protocolModifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, protocolModifications: e.target.value }))}
                    placeholder="Describe any modifications you made to the protocol..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Problems & Troubleshooting */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Problems & Troubleshooting</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Problems Encountered (Optional)
                  </label>
                  <textarea
                    value={formData.problems}
                    onChange={(e) => setFormData(prev => ({ ...prev, problems: e.target.value }))}
                    placeholder="Describe any problems or issues you encountered during the experiment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Troubleshooting Steps (Optional)
                  </label>
                  <textarea
                    value={formData.troubleshooting}
                    onChange={(e) => setFormData(prev => ({ ...prev, troubleshooting: e.target.value }))}
                    placeholder="Describe the steps you took to resolve the problems..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Results & Review */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Results & Review</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ChartBarIcon className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-blue-900 mb-2">Add Results & Data</h4>
                      <p className="text-blue-700 mb-4">
                        Create detailed results entries with data, analysis, and visualizations. You can add multiple result entries for this experiment.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          onClick={() => window.open('/data-results', '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <ChartBarIcon className="h-4 w-4 mr-2" />
                          Open Results Page
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const resultsUrl = `${window.location.origin}/data-results?experiment=${encodeURIComponent(formData.title)}`;
                            navigator.clipboard.writeText(resultsUrl);
                            alert('Results page URL copied to clipboard!');
                          }}
                        >
                          Copy Results URL
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Results Summary
                  </label>
                  <textarea
                    value={formData.resultsLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, resultsLink: e.target.value }))}
                    placeholder="Brief summary of results obtained, key findings, or link to detailed results..."
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Provide a brief summary of your results or paste the URL to your detailed results page.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-green-900 mb-2">Results Integration</h4>
                      <p className="text-green-700 mb-2">
                        Your results will be automatically linked to this experiment entry. You can:
                      </p>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Create multiple result entries for different data types</li>
                        <li>• Add charts, graphs, and visualizations</li>
                        <li>• Include raw data files and analysis</li>
                        <li>• Collaborate with team members on results</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h4 className="font-medium text-gray-900">Experiment Summary</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <strong>Title:</strong> {formData.title}
                      </p>
                      <p className="text-gray-600">
                        <strong>Start Date:</strong> {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not set'}
                      </p>
                      <p className="text-gray-600">
                        <strong>Start Time:</strong> {formData.startTime || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <strong>Protocol:</strong> {selectedProtocol?.title || 'Not selected'}
                      </p>
                      <p className="text-gray-600">
                        <strong>Category:</strong> {selectedProtocol?.category || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {formData.description && (
                    <div>
                      <p className="text-gray-600">
                        <strong>Description:</strong> {formData.description}
                      </p>
                    </div>
                  )}

                  {formData.protocolModifications && (
                    <div>
                      <p className="text-gray-600">
                        <strong>Protocol Modifications:</strong> {formData.protocolModifications}
                      </p>
                    </div>
                  )}

                  {formData.problems && (
                    <div>
                      <p className="text-gray-600">
                        <strong>Problems:</strong> {formData.problems}
                      </p>
                    </div>
                  )}

                  {formData.troubleshooting && (
                    <div>
                      <p className="text-gray-600">
                        <strong>Troubleshooting:</strong> {formData.troubleshooting}
                      </p>
                    </div>
                  )}

                  {formData.resultsLink && (
                    <div>
                      <p className="text-gray-600">
                        <strong>Results Link:</strong> 
                        <a href={formData.resultsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                          {formData.resultsLink}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div>
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                
                {step < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Experiment'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExperimentForm;
