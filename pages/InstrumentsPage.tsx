
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  TrashIcon,
  EyeIcon,
  FlaskConicalIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from '../components/icons';
import { Lab } from '../types';

interface Instrument {
  id: string;
  name: string;
  description: string;
  category: string;
  lab_id: string;
  location: string;
  model: string;
  serial_number: string;
  manufacturer: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  calibration_due_date: string | null;
  status: string;
  maintenance_notes: string;
  user_manual_url: string;
  created_at: string;
  updated_at: string;
  lab_name: string;
}

interface InstrumentBooking {
  id: string;
  instrument_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  notes: string | null;
  first_name: string;
  last_name: string;
  username: string;
  created_at: string;
}

const InstrumentsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [selectedInstrumentBookings, setSelectedInstrumentBookings] = useState<InstrumentBooking[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    lab_id: '',
    category: '',
    status: '',
    search: ''
  });

  // Form states
  const [instrumentForm, setInstrumentForm] = useState({
    name: '',
    description: '',
    category: '',
    model: '',
    serial_number: '',
    lab_id: '',
    location: '',
    status: 'available',
    manufacturer: '',
    purchase_date: '',
    warranty_expiry: '',
    calibration_due_date: '',
    maintenance_notes: '',
    user_manual_url: ''
  });

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    start_time: '',
    end_time: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    fetchInstruments();
    fetchLabs();
    fetchCategories();
  }, [filters]);

  const fetchInstruments = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5001/api/instruments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInstruments(data.instruments);
      } else {
        setError('Failed to fetch instruments');
      }
    } catch (error) {
      setError('Error fetching instruments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/instruments/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: { categories?: string[] } = await response.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInstrumentBookings = async (instrumentId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/instruments/${instrumentId}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedInstrumentBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleCreateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/instruments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...instrumentForm,
          tags: instrumentForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setInstrumentForm({
          name: '',
          description: '',
          category: '',
          model: '',
          serial_number: '',
          lab_id: '',
          location: '',
          status: 'available',
          manufacturer: '',
          purchase_date: '',
          warranty_expiry: '',
          calibration_due_date: '',
          maintenance_notes: '',
          user_manual_url: ''
        });
        fetchInstruments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create instrument');
      }
    } catch (error) {
      setError('Error creating instrument');
    }
  };

  const handleUpdateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstrument) return;

    try {
      const response = await fetch(`http://localhost:5001/api/instruments/${selectedInstrument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...instrumentForm,
          tags: instrumentForm.tags.filter(t => t.trim())
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchInstruments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update instrument');
      }
    } catch (error) {
      setError('Error updating instrument');
    }
  };

  const handleDeleteInstrument = async (instrumentId: string) => {
    if (!confirm('Are you sure you want to delete this instrument?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/instruments/${instrumentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchInstruments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete instrument');
      }
    } catch (error) {
      setError('Error deleting instrument');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstrument) return;

    try {
      const response = await fetch(`http://localhost:5001/api/instruments/${selectedInstrument.id}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingForm)
      });

      if (response.ok) {
        setShowBookingModal(false);
        setBookingForm({
          start_time: '',
          end_time: '',
          purpose: '',
          notes: ''
        });
        fetchInstruments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create booking');
      }
    } catch (error) {
      setError('Error creating booking');
    }
  };

  const openEditModal = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setInstrumentForm({
      name: instrument.name,
      description: instrument.description || '',
      category: instrument.category,
      model: instrument.model || '',
      serial_number: instrument.serial_number || '',
      lab_id: instrument.lab_id,
      location: instrument.location || '',
      status: instrument.status,
      manufacturer: instrument.manufacturer || '',
      purchase_date: instrument.purchase_date || '',
      warranty_expiry: instrument.warranty_expiry || '',
      calibration_due_date: instrument.calibration_due_date || '',
      maintenance_notes: instrument.maintenance_notes || '',
      user_manual_url: instrument.user_manual_url || ''
    });
    setShowEditModal(true);
  };

  const openBookingModal = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setShowBookingModal(true);
  };

  const openBookingsModal = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    fetchInstrumentBookings(instrument.id);
    setShowBookingsModal(true);
  };

  const canEditInstrument = (instrument: Instrument) => {
    if (user?.role === 'admin') return true;
    // Lab PI can edit
    return false; // TODO: Implement lab PI check
  };

  const addArrayItem = (field: 'tags') => {
    setInstrumentForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'tags', index: number) => {
    setInstrumentForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'tags', index: number, value: string) => {
    setInstrumentForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'booked': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'out_of_order': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'maintenance': return 'Maintenance';
      case 'out_of_order': return 'Out of Order';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instrument Management</h1>
          <p className="text-gray-600">Track lab equipment, manage bookings, and monitor maintenance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Instrument</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FilterIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search instruments..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
            <select
              value={filters.lab_id}
              onChange={(e) => setFilters({ ...filters, lab_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_order">Out of Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instruments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map((instrument) => (
          <div key={instrument.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(instrument.status)}`}>
                <FlaskConicalIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openBookingsModal(instrument)}
                  className="text-gray-400 hover:text-gray-600"
                  title="View Bookings"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
                {instrument.status === 'available' && (
                  <button
                    onClick={() => openBookingModal(instrument)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Book Instrument"
                  >
                    <ClockIcon className="w-4 h-4" />
                  </button>
                )}
                {canEditInstrument(instrument) && (
                  <>
                    <button
                      onClick={() => openEditModal(instrument)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit Instrument"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteInstrument(instrument.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete Instrument"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{instrument.name}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{instrument.description}</p>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>{instrument.lab_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TagIcon className="w-4 h-4" />
                <span>{instrument.category}</span>
              </div>
              {instrument.model && (
                <div className="flex items-center space-x-2">
                  <FlaskConicalIcon className="w-4 h-4" />
                  <span>{instrument.model}</span>
                </div>
              )}
              {instrument.location && (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>{instrument.location}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                instrument.status === 'available' ? 'bg-green-100 text-green-800' :
                instrument.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                instrument.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {getStatusText(instrument.status)}
              </span>
            </div>

            {instrument.tags && instrument.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {instrument.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {new Date(instrument.created_at).toLocaleDateString()}
              </span>
              {instrument.maintenance_schedule && (
                <span className="text-xs text-gray-500">
                  Maintenance: {new Date(instrument.maintenance_schedule).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {instruments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FlaskConicalIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No instruments found</h3>
          <p className="text-gray-600">Add your first instrument to get started.</p>
        </div>
      )}

      {/* Create Instrument Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Instrument</h2>
            <form onSubmit={handleCreateInstrument} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={instrumentForm.name}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab *</label>
                  <select
                    value={instrumentForm.lab_id}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lab</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={instrumentForm.description}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the instrument..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    value={instrumentForm.category}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Microscopy, Spectroscopy, Chromatography"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={instrumentForm.model}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Model number/name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={instrumentForm.serial_number}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={instrumentForm.location}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Room 101, Bench 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={instrumentForm.status}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_order">Out of Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={instrumentForm.manufacturer}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Manufacturer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={instrumentForm.purchase_date}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={instrumentForm.warranty_expiry}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, warranty_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                  <input
                    type="date"
                    value={instrumentForm.calibration_due_date}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, calibration_due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
                <textarea
                  value={instrumentForm.maintenance_notes}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, maintenance_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Maintenance history, notes, requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Manual URL</label>
                <input
                  type="url"
                  value={instrumentForm.user_manual_url}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, user_manual_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/manual.pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {instrumentForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tag name"
                    />
                    {instrumentForm.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="text-purple-600 hover:text-purple-700 text-sm"
                >
                  + Add Tag
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Create Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Instrument Modal */}
      {showEditModal && selectedInstrument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Instrument</h2>
            <form onSubmit={handleUpdateInstrument} className="space-y-4">
              {/* Same form fields as create, but with instrumentForm values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={instrumentForm.name}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab *</label>
                  <select
                    value={instrumentForm.lab_id}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lab</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={instrumentForm.description}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    value={instrumentForm.category}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={instrumentForm.model}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={instrumentForm.serial_number}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={instrumentForm.location}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={instrumentForm.status}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_order">Out of Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={instrumentForm.manufacturer}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={instrumentForm.purchase_date}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={instrumentForm.warranty_expiry}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, warranty_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                  <input
                    type="date"
                    value={instrumentForm.calibration_due_date}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, calibration_due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
                <textarea
                  value={instrumentForm.maintenance_notes}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, maintenance_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Manual URL</label>
                <input
                  type="url"
                  value={instrumentForm.user_manual_url}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, user_manual_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                {instrumentForm.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {instrumentForm.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('tags', index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="text-purple-600 hover:text-purple-700 text-sm"
                >
                  + Add Tag
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Update Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedInstrument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Book Instrument</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedInstrument.name}</h3>
              <p className="text-sm text-gray-600">{selectedInstrument.description}</p>
            </div>
            
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                <input
                  type="text"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What will you be using this instrument for?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional details, special requirements..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Book Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings View Modal */}
      {showBookingsModal && selectedInstrument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Bookings for {selectedInstrument.name}</h2>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {selectedInstrumentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">This instrument has no scheduled bookings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedInstrumentBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{booking.first_name} {booking.last_name}</span>
                        <span className="text-sm text-gray-500">({booking.username})</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Start:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(booking.start_time).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">End:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(booking.end_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="font-medium text-gray-700">Purpose:</span>
                      <span className="ml-2 text-gray-600">{booking.purpose}</span>
                    </div>
                    
                    {booking.notes && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700">Notes:</span>
                        <span className="ml-2 text-gray-600">{booking.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstrumentsPage;