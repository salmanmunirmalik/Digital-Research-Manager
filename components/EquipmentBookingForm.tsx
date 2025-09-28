import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  WrenchScrewdriverIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '../components/icons';

interface EquipmentBookingFormProps {
  onSubmit: (booking: EquipmentBookingData) => void;
  onCancel: () => void;
  initialData?: Partial<EquipmentBookingData>;
}

interface EquipmentBookingData {
  equipment_name: string;
  equipment_id: string;
  booking_type: 'individual' | 'team' | 'project';
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  duration_hours: number;
  purpose: string;
  research_project: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  notes: string;
  special_requirements: string;
  training_required: boolean;
  training_level: 'basic' | 'intermediate' | 'advanced';
  backup_plan: string;
  contact_person: string;
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

const EquipmentBookingForm: React.FC<EquipmentBookingFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EquipmentBookingData>({
    equipment_name: '',
    equipment_id: '',
    booking_type: 'individual',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    duration_hours: 1,
    purpose: '',
    research_project: '',
    urgency: 'medium',
    notes: '',
    special_requirements: '',
    training_required: false,
    training_level: 'basic',
    backup_plan: '',
    contact_person: user?.username || '',
    lab_id: '',
    privacy_level: 'lab',
    ...initialData
  });

  const bookingTypes = [
    { value: 'individual', label: 'Individual Use' },
    { value: 'team', label: 'Team Use' },
    { value: 'project', label: 'Project Use' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const trainingLevels = [
    { value: 'basic', label: 'Basic Training' },
    { value: 'intermediate', label: 'Intermediate Training' },
    { value: 'advanced', label: 'Advanced Training' }
  ];

  const handleInputChange = (field: keyof EquipmentBookingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDuration = () => {
    if (formData.start_date && formData.end_date && formData.start_time && formData.end_time) {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
      handleInputChange('duration_hours', diffHours);
    }
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
              <WrenchScrewdriverIcon className="w-6 h-6 mr-2 text-blue-500" />
              Book Equipment
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
            {/* Equipment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name *</label>
                    <Input
                      value={formData.equipment_name}
                      onChange={(e) => handleInputChange('equipment_name', e.target.value)}
                      placeholder="e.g., Confocal Microscope, PCR Machine"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment ID</label>
                    <Input
                      value={formData.equipment_id}
                      onChange={(e) => handleInputChange('equipment_id', e.target.value)}
                      placeholder="Equipment serial number or ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type *</label>
                    <Select
                      value={formData.booking_type}
                      onChange={(e) => handleInputChange('booking_type', e.target.value)}
                      options={bookingTypes}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
                    <Select
                      value={formData.urgency}
                      onChange={(e) => handleInputChange('urgency', e.target.value)}
                      options={urgencyLevels}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => {
                        handleInputChange('start_date', e.target.value);
                        calculateDuration();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => {
                        handleInputChange('start_time', e.target.value);
                        calculateDuration();
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => {
                        handleInputChange('end_date', e.target.value);
                        calculateDuration();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => {
                        handleInputChange('end_time', e.target.value);
                        calculateDuration();
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                  <Input
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) => handleInputChange('duration_hours', parseFloat(e.target.value))}
                    min="0.5"
                    step="0.5"
                    placeholder="Calculated automatically"
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            {/* Purpose and Project */}
            <Card>
              <CardHeader>
                <CardTitle>Purpose & Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe what you plan to do with this equipment..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Research Project</label>
                  <Input
                    value={formData.research_project}
                    onChange={(e) => handleInputChange('research_project', e.target.value)}
                    placeholder="Project name or ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Your name or contact person"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requirements and Training */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Training</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                  <textarea
                    value={formData.special_requirements}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any special setup, materials, or conditions needed..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.training_required}
                        onChange={(e) => handleInputChange('training_required', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Training Required</span>
                    </label>
                  </div>
                  {formData.training_required && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Training Level</label>
                      <Select
                        value={formData.training_level}
                        onChange={(e) => handleInputChange('training_level', e.target.value)}
                        options={trainingLevels}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backup Plan</label>
                  <textarea
                    value={formData.backup_plan}
                    onChange={(e) => handleInputChange('backup_plan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="What will you do if the equipment is unavailable?"
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional information or special requests..."
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

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Booking Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Bookings are subject to approval by lab managers</li>
                    <li>Please arrive on time and clean up after use</li>
                    <li>Report any issues or damage immediately</li>
                    <li>Training may be required for certain equipment</li>
                  </ul>
                </div>
              </div>
            </div>
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
              Submit Booking Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentBookingForm;
