import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  CubeIcon,
  TagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ExclamationTriangleIcon
} from '../components/icons';

interface InventoryFormProps {
  onSubmit: (inventory: InventoryData) => void;
  onCancel: () => void;
  initialData?: Partial<InventoryData>;
}

interface InventoryData {
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  location: string;
  lab_id: string;
  supplier: string;
  supplier_contact: string;
  catalog_number: string;
  expiry_date: string;
  cost_per_unit: number;
  storage_conditions: string;
  safety_notes: string;
  notes: string;
  tags: string[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<InventoryData>({
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit: 'pcs',
    min_quantity: 0,
    location: '',
    lab_id: '',
    supplier: '',
    supplier_contact: '',
    catalog_number: '',
    expiry_date: '',
    cost_per_unit: 0,
    storage_conditions: '',
    safety_notes: '',
    notes: '',
    tags: [''],
    privacy_level: 'lab',
    ...initialData
  });

  const [newTag, setNewTag] = useState('');

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

  const handleInputChange = (field: keyof InventoryData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleTagRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
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
              <CubeIcon className="w-6 h-6 mr-2 text-green-500" />
              Add Inventory Item
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
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Sodium Chloride, Pipette Tips"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Detailed description of the item..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      options={categories}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Room 101, Shelf A3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity and Units */}
            <Card>
              <CardHeader>
                <CardTitle>Quantity & Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Quantity *</label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                    <Select
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      options={units}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Quantity</label>
                    <Input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => handleInputChange('min_quantity', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="Reorder threshold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      placeholder="e.g., Sigma-Aldrich, Fisher Scientific"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catalog Number</label>
                    <Input
                      value={formData.catalog_number}
                      onChange={(e) => handleInputChange('catalog_number', e.target.value)}
                      placeholder="e.g., S7653-500G"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Contact</label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) => handleInputChange('supplier_contact', e.target.value)}
                    placeholder="Email or phone number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit</label>
                    <Input
                      type="number"
                      value={formData.cost_per_unit}
                      onChange={(e) => handleInputChange('cost_per_unit', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage and Safety */}
            <Card>
              <CardHeader>
                <CardTitle>Storage & Safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage Conditions</label>
                  <Input
                    value={formData.storage_conditions}
                    onChange={(e) => handleInputChange('storage_conditions', e.target.value)}
                    placeholder="e.g., Room temperature, 4°C, -20°C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Safety Notes</label>
                  <textarea
                    value={formData.safety_notes}
                    onChange={(e) => handleInputChange('safety_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Safety considerations, handling instructions, PPE requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional information about this item..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags and Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(index)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTagAdd}
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
              Add Inventory Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryForm;
