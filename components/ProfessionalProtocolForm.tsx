import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

interface ProfessionalProtocolFormProps {
  onSubmit: (protocol: ProfessionalProtocol) => void;
  onCancel: () => void;
  initialData?: Partial<ProfessionalProtocol>;
  template?: ProtocolTemplate;
}

interface ProfessionalProtocol {
  id?: string;
  title: string;
  description: string;
  protocol_type: string;
  category: string;
  subcategory?: string;
  version: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skill_requirements: string[];
  estimated_duration_minutes: number;
  estimated_cost_usd: number;
  cost_per_sample: number;
  safety_level: 'low' | 'medium' | 'high' | 'biosafety_level_2' | 'biosafety_level_3';
  biosafety_requirements: string[];
  chemical_hazards: string[];
  biological_hazards: string[];
  ppe_required: string[];
  objective: string;
  background?: string;
  hypothesis?: string;
  reagents: Reagent[];
  equipment: Equipment[];
  consumables: Consumable[];
  preparation_steps: ProtocolStep[];
  procedure_steps: ProtocolStep[];
  post_processing_steps: ProtocolStep[];
  positive_controls: string[];
  negative_controls: string[];
  quality_checkpoints: QualityCheckpoint[];
  troubleshooting_guide: TroubleshootingItem[];
  expected_results: string;
  data_analysis_methods: string[];
  interpretation_guidelines?: string;
  common_pitfalls: string[];
  literature_references: string[];
  protocol_references: string[];
  supplier_information: SupplierInfo[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  sharing_permissions: Record<string, string>;
  access_level: 'read' | 'comment' | 'edit' | 'admin';
  status: 'draft' | 'review' | 'validated' | 'approved' | 'archived' | 'deprecated';
  validation_level: 'none' | 'peer_reviewed' | 'lab_validated' | 'institution_approved' | 'published';
  tags: string[];
  keywords: string[];
  lab_id: string;
  youtube_video_url?: string;
}

interface ProtocolTemplate {
  id: string;
  template_name: string;
  protocol_type: string;
  category: string;
  description: string;
  template_data: any;
}

interface Reagent {
  name: string;
  concentration: string;
  supplier: string;
  catalog: string;
  storage_conditions?: string;
  expiration_date?: string;
}

interface Equipment {
  name: string;
  specifications: string;
  calibration: string;
  maintenance_schedule?: string;
}

interface Consumable {
  name: string;
  specifications: string;
  quantity_needed: string;
  supplier?: string;
}

interface ProtocolStep {
  step: number;
  description: string;
  duration_minutes: number;
  temperature?: string;
  notes?: string;
  critical?: boolean;
}

interface QualityCheckpoint {
  checkpoint: string;
  description: string;
  critical: boolean;
  acceptance_criteria?: string;
}

interface TroubleshootingItem {
  issue: string;
  solutions: string[];
  prevention?: string;
}

interface SupplierInfo {
  name: string;
  contact: string;
  website: string;
  notes?: string;
}

const ProfessionalProtocolForm: React.FC<ProfessionalProtocolFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  template
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ProfessionalProtocol>({
    title: '',
    description: '',
    protocol_type: '',
    category: '',
    subcategory: '',
    version: '1.0',
    difficulty_level: 'beginner',
    skill_requirements: [],
    estimated_duration_minutes: 60,
    estimated_cost_usd: 0,
    cost_per_sample: 0,
    safety_level: 'low',
    biosafety_requirements: [],
    chemical_hazards: [],
    biological_hazards: [],
    ppe_required: [],
    objective: '',
    background: '',
    hypothesis: '',
    reagents: [],
    equipment: [],
    consumables: [],
    preparation_steps: [],
    procedure_steps: [],
    post_processing_steps: [],
    positive_controls: [],
    negative_controls: [],
    quality_checkpoints: [],
    troubleshooting_guide: [],
    expected_results: '',
    data_analysis_methods: [],
    interpretation_guidelines: '',
    common_pitfalls: [],
    literature_references: [],
    protocol_references: [],
    supplier_information: [],
    privacy_level: 'lab',
    sharing_permissions: {},
    access_level: 'read',
    status: 'draft',
    validation_level: 'none',
    tags: [],
    keywords: [],
    lab_id: '',
    ...initialData
  });

  const protocolTypes = [
    { value: 'western_blot', label: 'Western Blot' },
    { value: 'pcr', label: 'PCR' },
    { value: 'elisa', label: 'ELISA' },
    { value: 'cell_culture', label: 'Cell Culture' },
    { value: 'immunofluorescence', label: 'Immunofluorescence' },
    { value: 'flow_cytometry', label: 'Flow Cytometry' },
    { value: 'microscopy', label: 'Microscopy' },
    { value: 'protein_purification', label: 'Protein Purification' },
    { value: 'dna_extraction', label: 'DNA Extraction' },
    { value: 'rna_extraction', label: 'RNA Extraction' },
    { value: 'custom', label: 'Custom Protocol' }
  ];

  const categories = [
    { value: 'molecular_biology', label: 'Molecular Biology' },
    { value: 'cell_biology', label: 'Cell Biology' },
    { value: 'protein_analysis', label: 'Protein Analysis' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'microscopy', label: 'Microscopy' },
    { value: 'analytical', label: 'Analytical Chemistry' },
    { value: 'biochemistry', label: 'Biochemistry' },
    { value: 'genetics', label: 'Genetics' },
    { value: 'pharmacology', label: 'Pharmacology' },
    { value: 'toxicology', label: 'Toxicology' }
  ];

  const skillRequirements = [
    'aseptic_technique',
    'pipetting',
    'microscopy',
    'data_analysis',
    'statistical_analysis',
    'equipment_operation',
    'safety_procedures',
    'quality_control',
    'troubleshooting',
    'protocol_optimization'
  ];

  const ppeOptions = [
    'lab_coat',
    'gloves',
    'safety_goggles',
    'face_mask',
    'respirator',
    'safety_shoes',
    'hair_net',
    'sleeve_protectors'
  ];

  useEffect(() => {
    if (template) {
      const templateData = template.template_data;
      setFormData(prev => ({
        ...prev,
        ...templateData,
        title: templateData.title || prev.title,
        protocol_type: template.protocol_type,
        category: template.category
      }));
    }
  }, [template]);

  const handleInputChange = (field: keyof ProfessionalProtocol, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemAdd = (field: keyof ProfessionalProtocol, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), item]
    }));
  };

  const handleArrayItemUpdate = (field: keyof ProfessionalProtocol, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
    }));
  };

  const handleArrayItemRemove = (field: keyof ProfessionalProtocol, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting protocol:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Protocol Title *</label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Western Blot for Protein Detection"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Protocol Type *</label>
          <Select
            value={formData.protocol_type}
            onChange={(e) => handleInputChange('protocol_type', e.target.value)}
            options={protocolTypes}
            required
          />
        </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
          <Input
            value={formData.subcategory}
            onChange={(e) => handleInputChange('subcategory', e.target.value)}
            placeholder="e.g., protein extraction, antibody detection"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Brief description of the protocol and its applications"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video URL (Optional)</label>
        <Input
          value={formData.youtube_video_url || ''}
          onChange={(e) => handleInputChange('youtube_video_url', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
        />
        <p className="text-xs text-gray-500 mt-1">Add a YouTube video tutorial for this protocol</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Objective *</label>
        <textarea
          value={formData.objective}
          onChange={(e) => handleInputChange('objective', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="What does this protocol accomplish?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
        <textarea
          value={formData.background}
          onChange={(e) => handleInputChange('background', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Scientific background and rationale for this protocol"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lab *</label>
        <select
          value={formData.lab_id}
          onChange={(e) => handleInputChange('lab_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Lab</option>
          <option value="lab-1">Molecular Biology Lab</option>
          <option value="lab-2">Cell Culture Lab</option>
          <option value="lab-3">Analytical Chemistry Lab</option>
          <option value="lab-4">Microscopy Lab</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level *</label>
          <Select
            value={formData.difficulty_level}
            onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'expert', label: 'Expert' }
            ]}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
          <Input
            type="number"
            value={formData.estimated_duration_minutes}
            onChange={(e) => handleInputChange('estimated_duration_minutes', parseInt(e.target.value))}
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Safety Level *</label>
          <Select
            value={formData.safety_level}
            onChange={(e) => handleInputChange('safety_level', e.target.value)}
            options={[
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
              { value: 'biosafety_level_2', label: 'BSL-2' },
              { value: 'biosafety_level_3', label: 'BSL-3' }
            ]}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost (USD)</label>
          <Input
            type="number"
            value={formData.estimated_cost_usd}
            onChange={(e) => handleInputChange('estimated_cost_usd', parseFloat(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Sample (USD)</label>
          <Input
            type="number"
            value={formData.cost_per_sample}
            onChange={(e) => handleInputChange('cost_per_sample', parseFloat(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {skillRequirements.map(skill => (
            <label key={skill} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.skill_requirements.includes(skill)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleArrayItemAdd('skill_requirements', skill);
                  } else {
                    const index = formData.skill_requirements.indexOf(skill);
                    handleArrayItemRemove('skill_requirements', index);
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{skill.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Required PPE</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ppeOptions.map(ppe => (
            <label key={ppe} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.ppe_required.includes(ppe)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleArrayItemAdd('ppe_required', ppe);
                  } else {
                    const index = formData.ppe_required.indexOf(ppe);
                    handleArrayItemRemove('ppe_required', index);
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{ppe.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reagents</label>
        {formData.reagents.map((reagent, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-3 border border-gray-200 rounded-lg">
            <Input
              value={reagent.name}
              onChange={(e) => handleArrayItemUpdate('reagents', index, { ...reagent, name: e.target.value })}
              placeholder="Reagent name"
            />
            <Input
              value={reagent.concentration}
              onChange={(e) => handleArrayItemUpdate('reagents', index, { ...reagent, concentration: e.target.value })}
              placeholder="Concentration"
            />
            <Input
              value={reagent.supplier}
              onChange={(e) => handleArrayItemUpdate('reagents', index, { ...reagent, supplier: e.target.value })}
              placeholder="Supplier"
            />
            <Input
              value={reagent.catalog}
              onChange={(e) => handleArrayItemUpdate('reagents', index, { ...reagent, catalog: e.target.value })}
              placeholder="Catalog #"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleArrayItemRemove('reagents', index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleArrayItemAdd('reagents', { name: '', concentration: '', supplier: '', catalog: '' })}
        >
          + Add Reagent
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
        {formData.equipment.map((equipment, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-3 border border-gray-200 rounded-lg">
            <Input
              value={equipment.name}
              onChange={(e) => handleArrayItemUpdate('equipment', index, { ...equipment, name: e.target.value })}
              placeholder="Equipment name"
            />
            <Input
              value={equipment.specifications}
              onChange={(e) => handleArrayItemUpdate('equipment', index, { ...equipment, specifications: e.target.value })}
              placeholder="Specifications"
            />
            <Input
              value={equipment.calibration}
              onChange={(e) => handleArrayItemUpdate('equipment', index, { ...equipment, calibration: e.target.value })}
              placeholder="Calibration"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleArrayItemRemove('equipment', index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleArrayItemAdd('equipment', { name: '', specifications: '', calibration: '' })}
        >
          + Add Equipment
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Steps</label>
        {formData.procedure_steps.map((step, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <Input
                value={step.step}
                onChange={(e) => handleArrayItemUpdate('procedure_steps', index, { ...step, step: parseInt(e.target.value) })}
                placeholder="Step #"
                type="number"
              />
              <Input
                value={step.duration_minutes}
                onChange={(e) => handleArrayItemUpdate('procedure_steps', index, { ...step, duration_minutes: parseInt(e.target.value) })}
                placeholder="Duration (min)"
                type="number"
              />
              <Input
                value={step.temperature || ''}
                onChange={(e) => handleArrayItemUpdate('procedure_steps', index, { ...step, temperature: e.target.value })}
                placeholder="Temperature"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleArrayItemRemove('procedure_steps', index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
            <textarea
              value={step.description}
              onChange={(e) => handleArrayItemUpdate('procedure_steps', index, { ...step, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Step description"
            />
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={step.critical || false}
                  onChange={(e) => handleArrayItemUpdate('procedure_steps', index, { ...step, critical: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Critical step</span>
              </label>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleArrayItemAdd('procedure_steps', { step: formData.procedure_steps.length + 1, description: '', duration_minutes: 0, critical: false })}
        >
          + Add Step
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Results *</label>
        <textarea
          value={formData.expected_results}
          onChange={(e) => handleInputChange('expected_results', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Describe the expected outcomes and how to interpret results"
          required
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level *</label>
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
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
        <Select
          value={formData.access_level}
          onChange={(e) => handleInputChange('access_level', e.target.value)}
          options={[
            { value: 'read', label: 'Read Only' },
            { value: 'comment', label: 'Read + Comment' },
            { value: 'edit', label: 'Read + Edit' },
            { value: 'admin', label: 'Full Admin' }
          ]}
        />
      </div>

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
            placeholder="Add tag"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  handleArrayItemAdd('tags', input.value.trim());
                  input.value = '';
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Add tag"]') as HTMLInputElement;
              if (input?.value.trim()) {
                handleArrayItemAdd('tags', input.value.trim());
                input.value = '';
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Literature References</label>
        {formData.literature_references.map((ref, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <Input
              value={ref}
              onChange={(e) => handleArrayItemUpdate('literature_references', index, e.target.value)}
              placeholder="Reference citation"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleArrayItemRemove('literature_references', index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleArrayItemAdd('literature_references', '')}
        >
          + Add Reference
        </Button>
      </div>
    </div>
  );

  const steps = [
    { title: 'Basic Information', component: renderStep1 },
    { title: 'Requirements & Safety', component: renderStep2 },
    { title: 'Materials & Equipment', component: renderStep3 },
    { title: 'Procedure & Results', component: renderStep4 },
    { title: 'Privacy & References', component: renderStep5 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {template ? `Create Protocol from ${template.template_name}` : 'Create Professional Protocol'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > index + 1 
                      ? 'bg-green-500 text-white' 
                      : currentStep === index + 1 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep >= index + 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit}>
            {steps[currentStep - 1].component()}
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-800 hover:bg-slate-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Protocol'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProtocolForm;
