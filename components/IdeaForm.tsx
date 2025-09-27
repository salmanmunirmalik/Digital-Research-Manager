import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  LightBulbIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon
} from '../components/icons';

interface IdeaFormProps {
  onSubmit: (idea: IdeaData) => void;
  onCancel: () => void;
  initialData?: Partial<IdeaData>;
}

interface IdeaData {
  title: string;
  description: string;
  category: 'research' | 'methodology' | 'collaboration' | 'equipment' | 'process' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  feasibility: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  resources_needed: string[];
  potential_collaborators: string[];
  related_projects: string[];
  tags: string[];
  notes: string;
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

const IdeaForm: React.FC<IdeaFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<IdeaData>({
    title: '',
    description: '',
    category: 'research',
    priority: 'medium',
    feasibility: 'medium',
    impact: 'medium',
    effort: 'medium',
    timeline: '',
    resources_needed: [''],
    potential_collaborators: [''],
    related_projects: [''],
    tags: [''],
    notes: '',
    lab_id: '',
    privacy_level: 'lab',
    ...initialData
  });

  const [newItem, setNewItem] = useState({
    resource: '',
    collaborator: '',
    project: '',
    tag: ''
  });

  const categories = [
    { value: 'research', label: 'Research Direction' },
    { value: 'methodology', label: 'Methodology Improvement' },
    { value: 'collaboration', label: 'Collaboration Opportunity' },
    { value: 'equipment', label: 'Equipment/Technology' },
    { value: 'process', label: 'Process Optimization' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const feasibilityLevels = [
    { value: 'low', label: 'Low Feasibility', color: 'text-red-600' },
    { value: 'medium', label: 'Medium Feasibility', color: 'text-yellow-600' },
    { value: 'high', label: 'High Feasibility', color: 'text-green-600' }
  ];

  const impactLevels = [
    { value: 'low', label: 'Low Impact', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium Impact', color: 'text-blue-600' },
    { value: 'high', label: 'High Impact', color: 'text-purple-600' }
  ];

  const effortLevels = [
    { value: 'low', label: 'Low Effort', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Effort', color: 'text-yellow-600' },
    { value: 'high', label: 'High Effort', color: 'text-red-600' }
  ];

  const handleInputChange = (field: keyof IdeaData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemAdd = (field: keyof IdeaData, item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), item.trim()]
      }));
    }
  };

  const handleArrayItemRemove = (field: keyof IdeaData, index: number) => {
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
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <LightBulbIcon className="w-6 h-6 mr-2 text-yellow-500" />
              New Research Idea
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
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief, descriptive title for your idea"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Detailed description of your research idea..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      options={categories}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                    <Input
                      value={formData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      placeholder="e.g., 3-6 months, Q2 2024"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Idea Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      options={priorities}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Feasibility</label>
                    <Select
                      value={formData.feasibility}
                      onChange={(e) => handleInputChange('feasibility', e.target.value)}
                      options={feasibilityLevels}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Potential Impact</label>
                    <Select
                      value={formData.impact}
                      onChange={(e) => handleInputChange('impact', e.target.value)}
                      options={impactLevels}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Effort</label>
                    <Select
                      value={formData.effort}
                      onChange={(e) => handleInputChange('effort', e.target.value)}
                      options={effortLevels}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resources and Collaboration */}
            <Card>
              <CardHeader>
                <CardTitle>Resources & Collaboration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resources Needed</label>
                  {formData.resources_needed.map((resource, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={resource}
                        onChange={(e) => {
                          const newResources = [...formData.resources_needed];
                          newResources[index] = e.target.value;
                          handleInputChange('resources_needed', newResources);
                        }}
                        placeholder="Resource needed"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('resources_needed', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.resource}
                      onChange={(e) => setNewItem(prev => ({ ...prev, resource: e.target.value }))}
                      placeholder="Add resource"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('resources_needed', newItem.resource);
                        setNewItem(prev => ({ ...prev, resource: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Potential Collaborators</label>
                  {formData.potential_collaborators.map((collaborator, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={collaborator}
                        onChange={(e) => {
                          const newCollaborators = [...formData.potential_collaborators];
                          newCollaborators[index] = e.target.value;
                          handleInputChange('potential_collaborators', newCollaborators);
                        }}
                        placeholder="Collaborator name or email"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('potential_collaborators', index)}
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
                        handleArrayItemAdd('potential_collaborators', newItem.collaborator);
                        setNewItem(prev => ({ ...prev, collaborator: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleArrayItemRemove('tags', index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes, considerations, or next steps..."
                  />
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
              Save Idea
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaForm;
