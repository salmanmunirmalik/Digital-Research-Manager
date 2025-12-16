/**
 * Lab Workspace Instrument Booking Form
 * For booking instruments in Lab Workspace
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon } from './icons';
import axios from 'axios';

interface InstrumentBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (booking: any) => Promise<void>;
  instrument: any;
  existingBookings?: any[];
}

const LabWorkspaceInstrumentBookingForm: React.FC<InstrumentBookingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  instrument,
  existingBookings = []
}) => {
  const [formData, setFormData] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    special_requirements: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        booking_date: tomorrow.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        purpose: '',
        notes: '',
        priority: 'medium',
        special_requirements: ''
      });
      setError(null);
      setConflicts([]);
    }
  }, [isOpen]);

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (formData.booking_date && formData.start_time && formData.end_time && isOpen) {
      checkConflicts();
    }
  }, [formData.booking_date, formData.start_time, formData.end_time]);

  const checkConflicts = () => {
    if (!formData.booking_date || !formData.start_time || !formData.end_time) return;

    const selectedStart = new Date(`${formData.booking_date}T${formData.start_time}`);
    const selectedEnd = new Date(`${formData.booking_date}T${formData.end_time}`);

    const conflicts = existingBookings.filter((booking: any) => {
      if (booking.status === 'cancelled' || booking.status === 'completed') return false;
      
      const bookingStart = new Date(booking.start_time || booking.startTime);
      const bookingEnd = new Date(booking.end_time || booking.endTime);

      return (
        (selectedStart >= bookingStart && selectedStart < bookingEnd) ||
        (selectedEnd > bookingStart && selectedEnd <= bookingEnd) ||
        (selectedStart <= bookingStart && selectedEnd >= bookingEnd)
      );
    });

    setConflicts(conflicts);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.booking_date || !formData.start_time || !formData.end_time) {
      setError('Date and time are required');
      return;
    }

    if (!formData.purpose.trim()) {
      setError('Purpose is required');
      return;
    }

    const startDateTime = new Date(`${formData.booking_date}T${formData.start_time}`);
    const endDateTime = new Date(`${formData.booking_date}T${formData.end_time}`);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    if (startDateTime < new Date()) {
      setError('Cannot book in the past');
      return;
    }

    if (conflicts.length > 0) {
      setError('This time slot conflicts with existing bookings');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        booking_date: formData.booking_date,
        start_time: `${formData.booking_date}T${formData.start_time}`,
        end_time: `${formData.booking_date}T${formData.end_time}`,
        purpose: formData.purpose,
        notes: formData.notes,
        priority: formData.priority,
        special_requirements: formData.special_requirements
      };

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !instrument) return null;

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Book Instrument</h2>
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

          {conflicts.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <p className="font-medium mb-1">⚠️ Time Conflict Detected</p>
              <p className="text-xs">This time slot conflicts with {conflicts.length} existing booking(s).</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Date and Time */}
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
                    value={formData.booking_date}
                    onChange={(e) => handleInputChange('booking_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Purpose and Priority */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Sample analysis, Experiment run, Training session"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Special Requirements and Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <textarea
                    value={formData.special_requirements}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Any special setup, accessories, or requirements needed..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Additional notes or comments..."
                  />
                </div>
              </div>
            </div>

            {/* Instrument Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Instrument Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-medium ${
                    instrument.status === 'available' ? 'text-green-600' :
                    instrument.status === 'in_use' ? 'text-blue-600' :
                    instrument.status === 'maintenance' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {instrument.status?.replace('_', ' ').toUpperCase() || 'Available'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">{instrument.location || 'N/A'}</span>
                </div>
                {instrument.model && (
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <span className="ml-2 font-medium">{instrument.model}</span>
                  </div>
                )}
                {instrument.manufacturer && (
                  <div>
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="ml-2 font-medium">{instrument.manufacturer}</span>
                  </div>
                )}
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
            disabled={loading || conflicts.length > 0}
          >
            {loading ? 'Booking...' : 'Book Instrument'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkspaceInstrumentBookingForm;


