import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  ClipboardListIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  DocumentTextIcon
} from '../components/icons';

interface SampleManagementFormProps {
  onSubmit: (sample: SampleData) => void;
  onCancel: () => void;
  initialData?: Partial<SampleData>;
}

interface SampleData {
  sample_id: string;
  name: string;
  description: string;
  type: string;
  source: string;
  collection_date: string;
  collection_method: string;
  collector: string;
  location: string;
  storage_location: string;
  storage_conditions: string;
  quantity: number;
  unit: string;
  status: 'active' | 'archived' | 'consumed' | 'expired' | 'lost';
  experiment_id: string;
  lab_id: string;
  notes: string;
  tags: string[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

const SampleManagementForm: React.FC<SampleManagementFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SampleData>({
    sample_id: '',
    name: '',
    description: '',
    type: '',
    source: '',
    collection_date: '',
    collection_method: '',
    collector: user?.username || '',
    location: '',
    storage_location: '',
    storage_conditions: '',
    quantity: 1,
    unit: 'ml',
    status: 'active',
    experiment_id: '',
    lab_id: user?.lab_id || '',
    notes: '',
    tags: [],
    privacy_level: 'lab',
    ...initialData
  });

  const [newTag, setNewTag] = useState('');

  const sampleTypes = [
    { value: 'biological', label: 'Biological Sample' },
    { value: 'chemical', label: 'Chemical Sample' },
    { value: 'environmental', label: 'Environmental Sample' },
    { value: 'clinical', label: 'Clinical Sample' },
    { value: 'research', label: 'Research Sample' },
    { value: 'reference', label: 'Reference Sample' },
    { value: 'control', label: 'Control Sample' },
    { value: 'other', label: 'Other' }
  ];

  const units = [
    { value: 'ml', label: 'ml' },
    { value: 'ul', label: 'μl' },
    { value: 'mg', label: 'mg' },
    { value: 'g', label: 'g' },
    { value: 'pieces', label: 'pieces' },
    { value: 'tubes', label: 'tubes' },
    { value: 'plates', label: 'plates' },
    { value: 'other', label: 'other' }
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'consumed', label: 'Consumed' },
    { value: 'expired', label: 'Expired' },
    { value: 'lost', label: 'Lost' }
  ];

  const privacyLevels = [
    { value: 'personal', label: 'Personal' },
    { value: 'team', label: 'Team' },
    { value: 'lab', label: 'Lab' },
    { value: 'institution', label: 'Institution' },
    { value: 'global', label: 'Global' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardListIcon className="h-6 w-6 text-teal-600" />
              Sample Management
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample ID *
                </label>
                <Input
                  value={formData.sample_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, sample_id: e.target.value }))}
                  placeholder="e.g., SAMPLE-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter sample name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the sample..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Sample Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Type *
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="">Select sample type...</option>
                  {sampleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="Sample source"
                />
              </div>
            </div>

            {/* Collection Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Date *
                </label>
                <Input
                  type="date"
                  value={formData.collection_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, collection_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collector *
                </label>
                <Input
                  value={formData.collector}
                  onChange={(e) => setFormData(prev => ({ ...prev, collector: e.target.value }))}
                  placeholder="Collector name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Method
              </label>
              <Input
                value={formData.collection_method}
                onChange={(e) => setFormData(prev => ({ ...prev, collection_method: e.target.value }))}
                placeholder="How was the sample collected?"
              />
            </div>

            {/* Storage Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location *
                </label>
                <Input
                  value={formData.storage_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, storage_location: e.target.value }))}
                  placeholder="e.g., Freezer A, Shelf 2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Conditions
                </label>
                <Input
                  value={formData.storage_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, storage_conditions: e.target.value }))}
                  placeholder="e.g., -80°C, Room temperature"
                />
              </div>
            </div>

            {/* Quantity and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <Select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  required
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  required
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Experiment and Lab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experiment ID
                </label>
                <Input
                  value={formData.experiment_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, experiment_id: e.target.value }))}
                  placeholder="Link to experiment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Level
                </label>
                <Select
                  value={formData.privacy_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, privacy_level: e.target.value as any }))}
                >
                  {privacyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-teal-600 hover:text-teal-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the sample..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Save Sample
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SampleManagementForm;
