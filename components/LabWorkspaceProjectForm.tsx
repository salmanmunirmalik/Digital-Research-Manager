/**
 * Lab Workspace Project Form
 * For creating and editing research projects in Lab Workspace
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import axios from 'axios';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: any) => Promise<void>;
  initialData?: any;
  labId: string | null;
  assignees?: Array<{ id: string; name: string }>;
}

const LabWorkspaceProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  labId,
  assignees = []
}) => {
  const [formData, setFormData] = useState({
    project_code: '',
    project_title: '',
    project_description: '',
    principal_investigator_id: '',
    project_type: '',
    research_field: '',
    total_budget: 0,
    planned_start_date: '',
    planned_end_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          project_code: initialData.project_code || '',
          project_title: initialData.project_title || initialData.project_title || '',
          project_description: initialData.project_description || '',
          principal_investigator_id: initialData.principal_investigator_id || '',
          project_type: initialData.project_type || '',
          research_field: initialData.research_field || '',
          total_budget: initialData.total_budget || 0,
          planned_start_date: initialData.planned_start_date ? initialData.planned_start_date.split('T')[0] : '',
          planned_end_date: initialData.planned_end_date ? initialData.planned_end_date.split('T')[0] : ''
        });
      } else {
        // Reset to defaults
        setFormData({
          project_code: '',
          project_title: '',
          project_description: '',
          principal_investigator_id: '',
          project_type: '',
          research_field: '',
          total_budget: 0,
          planned_start_date: '',
          planned_end_date: ''
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const projectTypes = [
    { value: 'basic_research', label: 'Basic Research' },
    { value: 'applied_research', label: 'Applied Research' },
    { value: 'clinical_trial', label: 'Clinical Trial' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'contract_research', label: 'Contract Research' }
  ];

  const researchFields = [
    { value: 'molecular_biology', label: 'Molecular Biology' },
    { value: 'biochemistry', label: 'Biochemistry' },
    { value: 'genetics', label: 'Genetics' },
    { value: 'cell_biology', label: 'Cell Biology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'neuroscience', label: 'Neuroscience' },
    { value: 'pharmacology', label: 'Pharmacology' },
    { value: 'biotechnology', label: 'Biotechnology' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_title.trim()) {
      setError('Project title is required');
      return;
    }

    if (!labId) {
      setError('Lab ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        lab_id: labId,
        total_budget: Number(formData.total_budget) || 0,
        planned_start_date: formData.planned_start_date || null,
        planned_end_date: formData.planned_end_date || null,
        principal_investigator_id: formData.principal_investigator_id || null
      };

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.project_title}
                    onChange={(e) => handleInputChange('project_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CRISPR Gene Editing Optimization"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
                  <input
                    type="text"
                    value={formData.project_code}
                    onChange={(e) => handleInputChange('project_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., PROJ-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.project_description}
                    onChange={(e) => handleInputChange('project_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Detailed description of the project..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select
                      value={formData.project_type}
                      onChange={(e) => handleInputChange('project_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      {projectTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Research Field</label>
                    <select
                      value={formData.research_field}
                      onChange={(e) => handleInputChange('research_field', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select field</option>
                      {researchFields.map(field => (
                        <option key={field.value} value={field.value}>{field.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Leadership */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Leadership</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Investigator</label>
                <select
                  value={formData.principal_investigator_id}
                  onChange={(e) => handleInputChange('principal_investigator_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select PI</option>
                  {assignees.map(assignee => (
                    <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Budget & Timeline</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget</label>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={(e) => handleInputChange('total_budget', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => handleInputChange('planned_start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => handleInputChange('planned_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : (initialData ? 'Update Project' : 'Create Project')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkspaceProjectForm;


