/**
 * Lab Workspace Inventory Form
 * Adapted for Lab Workspace with proper API integration
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import axios from 'axios';

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: any) => Promise<void>;
  initialData?: any;
  labId: string | null;
}

const LabWorkspaceInventoryForm: React.FC<InventoryFormProps> = ({
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
    quantity: 0,
    unit: 'pcs',
    min_quantity: 0,
    location: '',
    supplier: '',
    supplier_contact: '',
    expiry_date: '',
    cost_per_unit: 0,
    storage_conditions: '',
    notes: ''
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
          quantity: initialData.quantity || 0,
          unit: initialData.unit || 'pcs',
          min_quantity: initialData.min_quantity || 0,
          location: initialData.location || '',
          supplier: initialData.supplier || '',
          supplier_contact: initialData.supplier_contact || '',
          expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
          cost_per_unit: initialData.cost_per_unit || 0,
          storage_conditions: initialData.storage_conditions || '',
          notes: initialData.notes || ''
        });
      } else {
        // Reset to defaults
        setFormData({
          name: '',
          description: '',
          category: '',
          quantity: 0,
          unit: 'pcs',
          min_quantity: 0,
          location: '',
          supplier: '',
          supplier_contact: '',
          expiry_date: '',
          cost_per_unit: 0,
          storage_conditions: '',
          notes: ''
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const categories = [
    { value: 'chemicals', label: 'Chemicals & Reagents' },
    { value: 'consumables', label: 'Consumables' },
    { value: 'equipment', label: 'Equipment Parts' },
    { value: 'glassware', label: 'Glassware' },
    { value: 'safety', label: 'Safety Equipment' },
    { value: 'tools', label: 'Tools & Instruments' },
    { value: 'media', label: 'Media & Buffers' },
    { value: 'other', label: 'Other' }
  ];

  const units = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'ml', label: 'Milliliters' },
    { value: 'l', label: 'Liters' },
    { value: 'g', label: 'Grams' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'mg', label: 'Milligrams' },
    { value: 'μl', label: 'Microliters' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'packs', label: 'Packs' },
    { value: 'rolls', label: 'Rolls' }
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
        quantity: Number(formData.quantity) || 0,
        min_quantity: Number(formData.min_quantity) || 0,
        cost_per_unit: Number(formData.cost_per_unit) || 0,
        expiry_date: formData.expiry_date || null
      };

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save inventory item');
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
            {initialData ? 'Edit Inventory Item' : 'Add Inventory Item'}
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
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Item Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Sodium Chloride, Pipette Tips"
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
                    placeholder="Detailed description of the item..."
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Room 101, Shelf A3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity and Units */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quantity & Units</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Quantity</label>
                  <input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => handleInputChange('min_quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="Reorder threshold"
                  />
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Supplier Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Sigma-Aldrich, Fisher Scientific"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                    <input
                      type="text"
                      value={formData.supplier_contact}
                      onChange={(e) => handleInputChange('supplier_contact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email or phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                    <input
                      type="number"
                      value={formData.cost_per_unit}
                      onChange={(e) => handleInputChange('cost_per_unit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Storage and Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Storage & Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Conditions</label>
                  <input
                    type="text"
                    value={formData.storage_conditions}
                    onChange={(e) => handleInputChange('storage_conditions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Room temperature, 4°C, -20°C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Any additional information about this item..."
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
            {loading ? 'Saving...' : (initialData ? 'Update Item' : 'Add Item')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkspaceInventoryForm;


