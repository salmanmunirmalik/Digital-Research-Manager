import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Protocol, ProtocolCategory, ProtocolSubcategory } from '../types';
import { 
  BeakerIcon, 
  CogIcon, 
  ShieldExclamationIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  StarIcon
} from './icons';

interface EnhancedProtocolFormProps {
  protocol?: Partial<Protocol>;
  onSave: (protocol: Partial<Protocol>) => void;
  onCancel: () => void;
}

const CATEGORIES: ProtocolCategory[] = [
  'Molecular Biology',
  'Cell Biology',
  'Biochemistry',
  'Genetics',
  'Microbiology',
  'Immunology',
  'Neuroscience',
  'Bioinformatics',
  'Chemistry',
  'Physics',
  'Engineering',
  'Other'
];

const SUBCATEGORIES: Record<ProtocolCategory, ProtocolSubcategory[]> = {
  'Molecular Biology': [
    'DNA/RNA Extraction',
    'PCR & Amplification',
    'Cloning & Transformation',
    'Protein Expression'
  ],
  'Cell Biology': [
    'Cell Culture',
    'Flow Cytometry',
    'Microscopy',
    'Western Blot'
  ],
  'Biochemistry': [
    'Protein Purification',
    'Enzyme Assays',
    'Metabolite Analysis',
    'Buffer Preparation'
  ],
  'Genetics': [
    'Genotyping',
    'Gene Editing',
    'Sequencing',
    'Mutagenesis'
  ],
  'Microbiology': [
    'Bacterial Culture',
    'Antibiotic Testing',
    'Plasmid Isolation',
    'Transformation'
  ],
  'Immunology': [
    'ELISA',
    'Western Blot',
    'Flow Cytometry',
    'Cell Staining'
  ],
  'Neuroscience': [
    'Electrophysiology',
    'Calcium Imaging',
    'Behavioral Assays',
    'Tissue Processing'
  ],
  'Bioinformatics': [
    'Sequence Analysis',
    'Data Visualization',
    'Statistical Analysis',
    'Database Mining'
  ],
  'Chemistry': [
    'Synthesis',
    'Characterization',
    'Purification',
    'Analysis'
  ],
  'Physics': [
    'Optics',
    'Electronics',
    'Mechanics',
    'Thermodynamics'
  ],
  'Engineering': [
    'Device Fabrication',
    'System Design',
    'Prototyping',
    'Testing'
  ],
  'Other': ['Other']
};

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const ACCESS_LEVELS = ['Public', 'Lab Only', 'Private', 'Collaborative'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Extreme'];

export const EnhancedProtocolForm: React.FC<EnhancedProtocolFormProps> = ({
  protocol,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Protocol>>({
    title: protocol?.title || '',
    description: protocol?.description || '',
    abstract: protocol?.abstract || '',
    tags: protocol?.tags || [],
    category: protocol?.category || 'Molecular Biology',
    subcategory: protocol?.subcategory || 'DNA/RNA Extraction',
    difficulty: protocol?.difficulty || 'Beginner',
    access: protocol?.access || 'Lab Only',
    estimatedTime: protocol?.estimatedTime || {
      preparation: 30,
      execution: 120,
      analysis: 60,
      total: 210
    },
    equipment: protocol?.equipment || {
      essential: [],
      optional: [],
      shared: []
    },
    reagents: protocol?.reagents || {
      essential: [],
      optional: [],
      alternatives: []
    },
    safety: protocol?.safety || {
      riskLevel: 'Low',
      hazards: [],
      ppe: [],
      emergencyProcedures: [],
      disposalRequirements: []
    },
    validation: protocol?.validation || {
      testedBy: [],
      validationDate: new Date().toISOString().split('T')[0],
      successRate: 95,
      notes: ''
    },
    publications: protocol?.publications || {},
    keywords: protocol?.keywords || [],
    language: protocol?.language || 'en',
    ...protocol
  });

  const [newTag, setNewTag] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newReagent, setNewReagent] = useState('');
  const [newHazard, setNewHazard] = useState('');
  const [newPPE, setNewPPE] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof Protocol],
        [childField]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addEquipment = (type: 'essential' | 'optional' | 'shared') => {
    if (newEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          [type]: [...(prev.equipment?.[type] || []), newEquipment.trim()]
        }
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (type: 'essential' | 'optional' | 'shared', item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [type]: prev.equipment?.[type]?.filter(eq => eq !== item) || []
      }
    }));
  };

  const addReagent = (type: 'essential' | 'optional') => {
    if (newReagent.trim()) {
      setFormData(prev => ({
        ...prev,
        reagents: {
          ...prev.reagents,
          [type]: [...(prev.reagents?.[type] || []), newReagent.trim()]
        }
      }));
      setNewReagent('');
    }
  };

  const removeReagent = (type: 'essential' | 'optional', item: string) => {
    setFormData(prev => ({
      ...prev,
      reagents: {
        ...prev.reagents,
        [type]: prev.reagents?.[type]?.filter(r => r !== item) || []
      }
    }));
  };

  const addHazard = () => {
    if (newHazard.trim()) {
      setFormData(prev => ({
        ...prev,
        safety: {
          ...prev.safety,
          hazards: [...(prev.safety?.hazards || []), newHazard.trim()]
        }
      }));
      setNewHazard('');
    }
  };

  const removeHazard = (hazard: string) => {
    setFormData(prev => ({
      ...prev,
      safety: {
        ...prev.safety,
        hazards: prev.safety?.hazards?.filter(h => h !== hazard) || []
      }
    }));
  };

  const addPPE = () => {
    if (newPPE.trim()) {
      setFormData(prev => ({
        ...prev,
        safety: {
          ...prev.safety,
          ppe: [...(prev.safety?.ppe || []), newPPE.trim()]
        }
      }));
      setNewPPE('');
    }
  };

  const removePPE = (ppe: string) => {
    setFormData(prev => ({
      ...prev,
      safety: {
        ...prev.safety,
        ppe: prev.safety?.ppe?.filter(p => p !== ppe) || []
      }
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords?.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Protocol title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <Select
              value={formData.category}
              onChange={(e) => {
                handleInputChange('category', e.target.value as ProtocolCategory);
                handleInputChange('subcategory', SUBCATEGORIES[e.target.value as ProtocolCategory][0]);
              }}
              required
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory *
            </label>
            <Select
              value={formData.subcategory}
              onChange={(e) => handleInputChange('subcategory', e.target.value)}
              required
            >
              {SUBCATEGORIES[formData.category as ProtocolCategory]?.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level *
            </label>
            <Select
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              required
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Level *
            </label>
            <Select
              value={formData.access}
              onChange={(e) => handleInputChange('access', e.target.value)}
              required
            >
              {ACCESS_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <Input
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              placeholder="en"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abstract
          </label>
          <textarea
            value={formData.abstract}
            onChange={(e) => handleInputChange('abstract', e.target.value)}
            placeholder="Brief summary of the protocol"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detailed description of the protocol"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            required
          />
        </div>
      </Card>

      {/* Tags and Keywords */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <StarIcon className="w-5 h-5" />
          Tags and Keywords
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map(tag => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords?.map(keyword => (
                <span
                  key={keyword}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Time Estimates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          Time Estimates (minutes)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preparation
            </label>
            <Input
              type="number"
              value={formData.estimatedTime?.preparation}
              onChange={(e) => handleNestedChange('estimatedTime', 'preparation', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Execution
            </label>
            <Input
              type="number"
              value={formData.estimatedTime?.execution}
              onChange={(e) => handleNestedChange('estimatedTime', 'execution', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis
            </label>
            <Input
              type="number"
              value={formData.estimatedTime?.analysis}
              onChange={(e) => handleNestedChange('estimatedTime', 'analysis', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total
            </label>
            <Input
              type="number"
              value={formData.estimatedTime?.total}
              onChange={(e) => handleNestedChange('estimatedTime', 'total', parseInt(e.target.value) || 0)}
              min="0"
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* Equipment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-5 h-5" />
          Equipment Requirements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['essential', 'optional', 'shared'] as const).map(type => (
            <div key={type}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {type} Equipment
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder={`Add ${type} equipment`}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment(type))}
                />
                <Button type="button" onClick={() => addEquipment(type)} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="space-y-1">
                {formData.equipment?.[type]?.map(item => (
                  <div key={item} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                    <span className="text-sm">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(type, item)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reagents */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BeakerIcon className="w-5 h-5" />
          Reagents and Materials
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['essential', 'optional'] as const).map(type => (
            <div key={type}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {type} Reagents
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newReagent}
                  onChange={(e) => setNewReagent(e.target.value)}
                  placeholder={`Add ${type} reagent`}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReagent(type))}
                />
                <Button type="button" onClick={() => addReagent(type)} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="space-y-1">
                {formData.reagents?.[type]?.map(item => (
                  <div key={item} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                    <span className="text-sm">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeReagent(type, item)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Safety Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldExclamationIcon className="w-5 h-5" />
          Safety Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Level *
            </label>
            <Select
              value={formData.safety?.riskLevel}
              onChange={(e) => handleNestedChange('safety', 'riskLevel', e.target.value)}
              required
            >
              {RISK_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hazards
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newHazard}
                onChange={(e) => setNewHazard(e.target.value)}
                placeholder="Add hazard"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHazard())}
              />
              <Button type="button" onClick={addHazard} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {formData.safety?.hazards?.map(hazard => (
                <div key={hazard} className="flex items-center justify-between bg-red-50 px-2 py-1 rounded">
                  <span className="text-sm text-red-800">{hazard}</span>
                  <button
                    type="button"
                    onClick={() => removeHazard(hazard)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required PPE
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newPPE}
                onChange={(e) => setNewPPE(e.target.value)}
                placeholder="Add PPE item"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPPE())}
              />
              <Button type="button" onClick={addPPE} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {formData.safety?.ppe?.map(ppe => (
                <div key={ppe} className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded">
                  <span className="text-sm text-blue-800">{ppe}</span>
                  <button
                    type="button"
                    onClick={() => removePPE(ppe)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Procedures
            </label>
            <textarea
              value={formData.safety?.emergencyProcedures?.join('\n') || ''}
              onChange={(e) => handleNestedChange('safety', 'emergencyProcedures', e.target.value.split('\n').filter(line => line.trim()))}
              placeholder="Emergency procedures..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waste Disposal Requirements
          </label>
          <textarea
            value={formData.safety?.disposalRequirements?.join('\n') || ''}
            onChange={(e) => handleNestedChange('safety', 'disposalRequirements', e.target.value.split('\n').filter(line => line.trim()))}
            placeholder="Waste disposal requirements..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </Card>

      {/* Validation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5" />
          Validation and Testing
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tested By
            </label>
            <textarea
              value={formData.validation?.testedBy?.join('\n') || ''}
              onChange={(e) => handleNestedChange('validation', 'testedBy', e.target.value.split('\n').filter(line => line.trim()))}
              placeholder="Names of people who tested this protocol"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validation Date
            </label>
            <Input
              type="date"
              value={formData.validation?.validationDate}
              onChange={(e) => handleNestedChange('validation', 'validationDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Rate (%)
            </label>
            <Input
              type="number"
              value={formData.validation?.successRate}
              onChange={(e) => handleNestedChange('validation', 'successRate', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.validation?.notes}
              onChange={(e) => handleNestedChange('validation', 'notes', e.target.value)}
              placeholder="Additional validation notes..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Publications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Publications and References
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DOI
            </label>
            <Input
              value={formData.publications?.doi || ''}
              onChange={(e) => handleNestedChange('publications', 'doi', e.target.value)}
              placeholder="10.1000/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Journal
            </label>
            <Input
              value={formData.publications?.journal || ''}
              onChange={(e) => handleNestedChange('publications', 'journal', e.target.value)}
              placeholder="Journal name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <Input
              type="number"
              value={formData.publications?.year || ''}
              onChange={(e) => handleNestedChange('publications', 'year', parseInt(e.target.value) || undefined)}
              placeholder="2024"
              min="1900"
              max="2030"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authors
            </label>
            <textarea
              value={formData.publications?.authors?.join('\n') || ''}
              onChange={(e) => handleNestedChange('publications', 'authors', e.target.value.split('\n').filter(line => line.trim()))}
              placeholder="Author names (one per line)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Save Protocol
        </Button>
      </div>
    </form>
  );
};
