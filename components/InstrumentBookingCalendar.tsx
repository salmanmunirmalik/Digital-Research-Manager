import React, { useState, useEffect, useCallback } from 'react';
import { instrumentBookingsAPI } from '../services/apiService';

interface TimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

interface ExistingBooking {
  start_time: string;
  end_time: string;
}

interface UnavailablePeriod {
  start_datetime: string;
  end_datetime: string;
  reason: string;
}

interface BookingFormData {
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  purpose: string;
  research_project: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  notes: string;
}

interface InstrumentBookingCalendarProps {
  instrumentId: string;
  instrumentName: string;
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
}

const InstrumentBookingCalendar: React.FC<InstrumentBookingCalendarProps> = ({
  instrumentId,
  instrumentName,
  onClose,
  onBookingCreated
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    booking_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    purpose: '',
    research_project: '',
    urgency: 'normal',
    notes: ''
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get next 30 days for date selection
  const getNextDays = (count: number) => {
    const dates = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Load availability for selected date
  const loadAvailability = useCallback(async (date: string) => {
    if (!date) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await instrumentBookingsAPI.getAvailability(instrumentId, date);
      const data = response as any; // Type assertion for now
      setAvailableSlots(data.available_slots || []);
      setExistingBookings(data.existing_bookings || []);
      setUnavailablePeriods(data.unavailable_periods || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [instrumentId]);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowBookingForm(false);
    loadAvailability(date);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setBookingForm(prev => ({
      ...prev,
      booking_date: selectedDate,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: slot.duration_minutes
    }));
    setShowBookingForm(true);
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingForm.purpose.trim()) {
      setError('Please provide a purpose for the booking');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await instrumentBookingsAPI.createBooking(instrumentId, bookingForm);
      
      // Show success message
      alert('Booking created successfully! It is now pending approval.');
      
      // Reset form and close
      setShowBookingForm(false);
      setSelectedSlot(null);
      setBookingForm({
        booking_date: '',
        start_time: '',
        end_time: '',
        duration_minutes: 60,
        purpose: '',
        research_project: '',
        urgency: 'normal',
        notes: ''
      });
      
      // Reload availability to show new booking
      await loadAvailability(selectedDate);
      
      // Notify parent component
      if (onBookingCreated) {
        const data = response as any; // Type assertion for now
        onBookingCreated(data.booking);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Check if a slot is available (not conflicting with existing bookings)
  const isSlotAvailable = (slot: TimeSlot) => {
    return !existingBookings.some(booking => {
      const bookingStart = new Date(`2000-01-01 ${booking.start_time}`);
      const bookingEnd = new Date(`2000-01-01 ${booking.end_time}`);
      const slotStart = new Date(`2000-01-01 ${slot.start_time}`);
      const slotEnd = new Date(`2000-01-01 ${slot.end_time}`);
      
      return (
        (slotStart < bookingEnd && slotEnd > bookingStart) ||
        (bookingStart < slotEnd && bookingEnd > slotStart)
      );
    });
  };

  // Check if a slot is unavailable due to maintenance
  const isSlotUnavailable = (slot: TimeSlot) => {
    return unavailablePeriods.some(period => {
      const periodStart = new Date(period.start_datetime);
      const periodEnd = new Date(period.end_datetime);
      const slotStart = new Date(`2000-01-01 ${slot.start_time}`);
      const slotEnd = new Date(`2000-01-01 ${slot.end_time}`);
      
      return (
        (slotStart < periodEnd && slotEnd > periodStart) ||
        (periodStart < slotEnd && periodEnd > slotStart)
      );
    });
  };

  // Get slot status and styling
  const getSlotStatus = (slot: TimeSlot) => {
    if (isSlotUnavailable(slot)) {
      return { status: 'maintenance', className: 'bg-red-100 text-red-700 border-red-300', label: 'Maintenance' };
    }
    if (!isSlotAvailable(slot)) {
      return { status: 'booked', className: 'bg-gray-100 text-gray-500 border-gray-300', label: 'Booked' };
    }
    return { status: 'available', className: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200', label: 'Available' };
  };

  // Format time for display
  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get day name
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Book Instrument: {instrumentName}</h2>
              <p className="text-blue-100 mt-1">Select a date and time slot to book this instrument</p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Date Selection Sidebar */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Select Date</h3>
            
            <div className="space-y-2">
              {getNextDays(30).map((date) => (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDate === date
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{getDayName(date)}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Calendar Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!selectedDate ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2">Select a Date</h3>
                <p>Choose a date from the sidebar to view available time slots</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {getDayName(selectedDate)} - {new Date(selectedDate).toLocaleDateString()}
                  </h3>
                  <p className="text-gray-600">
                    Available time slots for {instrumentName}
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading availability...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 text-xl mb-2">⚠️</div>
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={() => loadAvailability(selectedDate)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Time Slots Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                      {availableSlots.map((slot, index) => {
                        const slotStatus = getSlotStatus(slot);
                        const isClickable = slotStatus.status === 'available';
                        
                        return (
                          <button
                            key={index}
                            onClick={() => isClickable && handleSlotSelect(slot)}
                            disabled={!isClickable}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isClickable 
                                ? slotStatus.className + ' cursor-pointer hover:scale-105' 
                                : slotStatus.className + ' cursor-not-allowed'
                            }`}
                          >
                            <div className="font-semibold">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            <div className="text-sm opacity-75">
                              {slot.duration_minutes} minutes
                            </div>
                            <div className="text-xs mt-1 font-medium">
                              {slotStatus.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Existing Bookings */}
                    {existingBookings.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3 text-gray-700">Existing Bookings</h4>
                        <div className="space-y-2">
                          {existingBookings.map((booking, index) => (
                            <div key={index} className="bg-gray-100 p-3 rounded-lg">
                              <div className="font-medium">
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </div>
                              <div className="text-sm text-gray-600">Booked by another user</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unavailable Periods */}
                    {unavailablePeriods.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3 text-red-700">Unavailable Periods</h4>
                        <div className="space-y-2">
                          {unavailablePeriods.map((period, index) => (
                            <div key={index} className="bg-red-100 p-3 rounded-lg border border-red-300">
                              <div className="font-medium text-red-800">
                                {new Date(period.start_datetime).toLocaleTimeString()} - {new Date(period.end_datetime).toLocaleTimeString()}
                              </div>
                              <div className="text-sm text-red-600">{period.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableSlots.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">🚫</div>
                        <h3 className="text-xl font-semibold mb-2">No Available Slots</h3>
                        <p>This instrument is not available for booking on the selected date.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-blue-600 text-white p-6">
                <h3 className="text-xl font-bold">Book Time Slot</h3>
                <p className="text-blue-100 mt-1">
                  {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)} on {getDayName(selectedDate)}
                </p>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                    <textarea
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe what you'll be doing with this instrument..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Research Project</label>
                    <input
                      value={bookingForm.research_project}
                      onChange={(e) => setBookingForm({ ...bookingForm, research_project: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Project name or identifier"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                    <select
                      value={bookingForm.urgency}
                      onChange={(e) => setBookingForm({ ...bookingForm, urgency: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="number"
                      value={bookingForm.duration_minutes}
                      onChange={(e) => setBookingForm({ ...bookingForm, duration_minutes: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={15}
                      max={480}
                      step={15}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minutes (15-480)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Any special requirements, safety considerations, etc."
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstrumentBookingCalendar;
