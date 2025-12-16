/**
 * Lab Workspace Instrument Form
 * For creating and editing instruments in Lab Workspace
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import axios from 'axios';

interface InstrumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instrument: any) => Promise<void>;
  initialData?: any;
  labId: string | null;
}

const LabWorkspaceInstrumentForm: React.FC<InstrumentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  labId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    model: '',
    manufacturer: '',
    serial_number: '',
    location: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance' | 'out_of_order' | 'reserved',
    purchase_date: '',
    warranty_expiry: '',
    calibration_due_date: '',
    maintenance_notes: '',
    user_manual_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          category: initialData.category || '',
          model: initialData.model || '',
          manufacturer: initialData.manufacturer || '',
          serial_number: initialData.serial_number || '',
          location: initialData.location || '',
          status: initialData.status || 'available',
          purchase_date: initialData.purchase_date ? initialData.purchase_date.split('T')[0] : '',
          warranty_expiry: initialData.warranty_expiry ? initialData.warranty_expiry.split('T')[0] : '',
          calibration_due_date: initialData.calibration_due_date ? initialData.calibration_due_date.split('T')[0] : '',
          maintenance_notes: initialData.maintenance_notes || '',
          user_manual_url: initialData.user_manual_url || ''
        });
      } else {
        // Reset to defaults
        setFormData({
          name: '',
          description: '',
          category: '',
          model: '',
          manufacturer: '',
          serial_number: '',
          location: '',
          status: 'available',
          purchase_date: '',
          warranty_expiry: '',
          calibration_due_date: '',
          maintenance_notes: '',
          user_manual_url: ''
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const categories = [
    { value: 'molecular_biology', label: 'Molecular Biology' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'sample_processing', label: 'Sample Processing' },
    { value: 'analytical', label: 'Analytical' },
    { value: 'spectroscopy', label: 'Spectroscopy' },
    { value: 'chromatography', label: 'Chromatography' },
    { value: 'microscopy', label: 'Microscopy' },
    { value: 'centrifugation', label: 'Centrifugation' },
    { value: 'incubation', label: 'Incubation' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'available', label: 'Available' },
    { value: 'in_use', label: 'In Use' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'out_of_order', label: 'Out of Order' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category) {
      setError('Name and category are required');
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
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        calibration_due_date: formData.calibration_due_date || null
      };

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save instrument');
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
            {initialData ? 'Edit Instrument' : 'Add Instrument'}
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
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrument Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., PCR Thermal Cycler"
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
                    placeholder="Detailed description of the instrument..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Model and Manufacturer */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Model & Manufacturer</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., C1000 Touch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Bio-Rad, Eppendorf"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Serial number"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Location</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Room 201 - Molecular Lab"
                />
              </div>
            </div>

            {/* Purchase & Warranty */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Purchase & Warranty</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => handleInputChange('warranty_expiry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                <input
                  type="date"
                  value={formData.calibration_due_date}
                  onChange={(e) => handleInputChange('calibration_due_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Maintenance & Documentation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Maintenance & Documentation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
                  <textarea
                    value={formData.maintenance_notes}
                    onChange={(e) => handleInputChange('maintenance_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Maintenance history, issues, notes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Manual URL</label>
                  <input
                    type="url"
                    value={formData.user_manual_url}
                    onChange={(e) => handleInputChange('user_manual_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
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
            {loading ? 'Saving...' : (initialData ? 'Update Instrument' : 'Add Instrument')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkspaceInstrumentForm;

