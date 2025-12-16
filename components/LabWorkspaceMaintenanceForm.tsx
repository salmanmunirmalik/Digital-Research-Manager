/**
 * Lab Workspace Maintenance Scheduling Form
 * For scheduling instrument maintenance in Lab Workspace
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, WrenchScrewdriverIcon, PlusIcon, TrashIcon } from './icons';
import axios from 'axios';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (maintenance: any) => Promise<void>;
  instrument: any;
  assignees?: Array<{ id: string; name: string }>;
}

const LabWorkspaceMaintenanceForm: React.FC<MaintenanceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  instrument,
  assignees = []
}) => {
  const [formData, setFormData] = useState({
    type: 'routine' as 'routine' | 'repair' | 'calibration' | 'cleaning' | 'inspection' | 'upgrade',
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assigned_to: '',
    estimated_duration: 60,
    cost: 0,
    parts_used: [''],
    notes: '',
    checklist: [{ id: Date.now().toString(), task: '', completed: false }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        type: 'routine',
        title: '',
        description: '',
        scheduled_date: tomorrow.toISOString().split('T')[0],
        scheduled_time: '09:00',
        priority: 'medium',
        assigned_to: '',
        estimated_duration: 60,
        cost: 0,
        parts_used: [''],
        notes: '',
        checklist: [{ id: Date.now().toString(), task: '', completed: false }]
      });
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPart = () => {
    setFormData(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, '']
    }));
  };

  const handleRemovePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      parts_used: prev.parts_used.map((part, i) => i === index ? value : part)
    }));
  };

  const handleAddChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: Date.now().toString(), task: '', completed: false }]
    }));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const handleChecklistItemChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === id ? { ...item, task: value } : item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.scheduled_date) {
      setError('Scheduled date is required');
      return;
    }

    const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
    if (scheduledDateTime < new Date()) {
      setError('Cannot schedule maintenance in the past');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        scheduled_date: `${formData.scheduled_date}T${formData.scheduled_time}`,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        estimated_duration: formData.estimated_duration,
        cost: formData.cost,
        parts_used: formData.parts_used.filter(p => p.trim() !== ''),
        notes: formData.notes,
        checklist: formData.checklist.filter(c => c.task.trim() !== '')
      };

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to schedule maintenance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !instrument) return null;

  const maintenanceTypes = [
    { value: 'routine', label: 'Routine Maintenance', description: 'Regular scheduled maintenance' },
    { value: 'repair', label: 'Repair', description: 'Fix a malfunction or issue' },
    { value: 'calibration', label: 'Calibration', description: 'Adjust and verify accuracy' },
    { value: 'cleaning', label: 'Cleaning', description: 'Deep cleaning and sanitization' },
    { value: 'inspection', label: 'Inspection', description: 'Safety and performance inspection' },
    { value: 'upgrade', label: 'Upgrade', description: 'Hardware or software upgrade' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />
              Schedule Maintenance
            </h2>
            <p className="text-sm text-gray-500 mt-1">{instrument.name}</p>
          </div>
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
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Maintenance Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {maintenanceTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {maintenanceTypes.find(t => t.value === formData.type)?.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Monthly calibration, Repair broken component"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Detailed description of the maintenance work..."
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Schedule</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Assignment and Cost */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Assignment & Cost</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select assignee</option>
                    {assignees.map(assignee => (
                      <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Parts Used */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Parts & Materials</h3>
              <div className="space-y-2">
                {formData.parts_used.map((part, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={part}
                      onChange={(e) => handlePartChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Part name or material"
                    />
                    {formData.parts_used.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePart(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Part/Material
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Maintenance Checklist</h3>
              <div className="space-y-2">
                {formData.checklist.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => handleChecklistItemChange(item.id, item.task)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled
                    />
                    <input
                      type="text"
                      value={item.task}
                      onChange={(e) => handleChecklistItemChange(item.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Task description"
                    />
                    {formData.checklist.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Checklist Item
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Any additional notes, special instructions, or observations..."
              />
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
            {loading ? 'Scheduling...' : 'Schedule Maintenance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkspaceMaintenanceForm;


