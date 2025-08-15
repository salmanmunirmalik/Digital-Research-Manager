
import React, { useState, useEffect } from 'react';
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
  CheckCircleIcon,
  UsersIcon,
  PinIcon,
  StarIcon,
  BookOpenIcon,
  ShieldCheckIcon
} from '../components/icons';

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
  hourly_rate?: number;
  max_booking_hours?: number;
  requires_training?: boolean;
  training_level?: string;
}

interface InstrumentBooking {
  id: string;
  instrument_id: string;
  user_id: string;
  team_id?: string;
  start_time: string;
  end_time: string;
  purpose: string;
  notes: string | null;
  first_name: string;
  last_name: string;
  username: string;
  team_name?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
}

interface Team {
  id: string;
  name: string;
  leader_name: string;
  member_count: number;
  lab_id: string;
  lab_name: string;
}

interface Lab {
  id: string;
  name: string;
  institution: string;
  department: string;
}

const InstrumentsPage: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('instruments');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTeamBookingModal, setShowTeamBookingModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [selectedInstrumentBookings, setSelectedInstrumentBookings] = useState<InstrumentBooking[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    lab_id: '',
    category: '',
    status: '',
    search: '',
    availability: ''
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
    user_manual_url: '',
    hourly_rate: 0,
    max_booking_hours: 24,
    requires_training: false,
    training_level: 'basic'
  });

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    start_time: '',
    end_time: '',
    purpose: '',
    notes: '',
    team_id: '',
    booking_type: 'individual' as 'individual' | 'team'
  });

  // Mock data for demo
  useEffect(() => {
    // Load mock data
    setInstruments([
      {
        id: '1',
        name: 'High-Performance Liquid Chromatography (HPLC)',
        description: 'Advanced analytical instrument for chemical analysis and purification',
        category: 'Analytical Chemistry',
        lab_id: '1',
        location: 'Room 201, Chemistry Building',
        model: 'Agilent 1260 Infinity II',
        serial_number: 'HPLC-2024-001',
        manufacturer: 'Agilent Technologies',
        purchase_date: '2024-01-15',
        warranty_expiry: '2027-01-15',
        calibration_due_date: '2024-12-15',
        status: 'available',
        maintenance_notes: 'Last maintenance: March 2024. Next scheduled: September 2024',
        user_manual_url: 'https://docs.agilent.com/hplc-1260',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        lab_name: 'Analytical Chemistry Lab',
        hourly_rate: 25,
        max_booking_hours: 48,
        requires_training: true,
        training_level: 'advanced'
      },
      {
        id: '2',
        name: 'Confocal Laser Scanning Microscope',
        description: 'High-resolution imaging system for biological samples',
        category: 'Imaging & Microscopy',
        lab_id: '2',
        location: 'Room 305, Biology Building',
        model: 'Leica SP8',
        serial_number: 'CLSM-2023-002',
        manufacturer: 'Leica Microsystems',
        purchase_date: '2023-06-20',
        warranty_expiry: '2026-06-20',
        calibration_due_date: '2024-11-20',
        status: 'in_use',
        maintenance_notes: 'Regular calibration performed. Laser alignment optimal',
        user_manual_url: 'https://docs.leica.com/sp8',
        created_at: '2023-06-20T14:00:00Z',
        updated_at: '2024-01-10T09:00:00Z',
        lab_name: 'Cell Biology Lab',
        hourly_rate: 35,
        max_booking_hours: 72,
        requires_training: true,
        training_level: 'expert'
      },
      {
        id: '3',
        name: 'Real-Time PCR Machine',
        description: 'Quantitative polymerase chain reaction system for gene expression analysis',
        category: 'Molecular Biology',
        lab_id: '3',
        location: 'Room 102, Genetics Building',
        model: 'Applied Biosystems 7500',
        serial_number: 'PCR-2023-003',
        manufacturer: 'Thermo Fisher Scientific',
        purchase_date: '2023-09-10',
        warranty_expiry: '2026-09-10',
        calibration_due_date: '2024-08-10',
        status: 'available',
        maintenance_notes: 'Calibrated monthly. Performance within specifications',
        user_manual_url: 'https://docs.thermofisher.com/7500',
        created_at: '2023-09-10T11:00:00Z',
        updated_at: '2024-01-05T16:00:00Z',
        lab_name: 'Molecular Genetics Lab',
        hourly_rate: 20,
        max_booking_hours: 24,
        requires_training: false,
        training_level: 'basic'
      },
      {
        id: '4',
        name: 'Ultracentrifuge',
        description: 'High-speed centrifuge for cell fractionation and protein purification',
        category: 'Cell Biology',
        lab_id: '2',
        location: 'Room 308, Biology Building',
        model: 'Beckman Coulter Optima XE-100',
        serial_number: 'UC-2022-004',
        manufacturer: 'Beckman Coulter',
        purchase_date: '2022-12-05',
        warranty_expiry: '2025-12-05',
        calibration_due_date: '2024-10-05',
        status: 'maintenance',
        maintenance_notes: 'Rotor replacement scheduled. Safety inspection required',
        user_manual_url: 'https://docs.beckman.com/optima-xe',
        created_at: '2022-12-05T13:00:00Z',
        updated_at: '2024-01-12T10:00:00Z',
        lab_name: 'Cell Biology Lab',
        hourly_rate: 15,
        max_booking_hours: 12,
        requires_training: true,
        training_level: 'intermediate'
      }
    ]);

    setLabs([
      { id: '1', name: 'Analytical Chemistry Lab', institution: 'University of Science', department: 'Chemistry' },
      { id: '2', name: 'Cell Biology Lab', institution: 'University of Science', department: 'Biology' },
      { id: '3', name: 'Molecular Genetics Lab', institution: 'University of Science', department: 'Genetics' }
    ]);

    setTeams([
      { id: '1', name: 'Protein Analysis Team', leader_name: 'Dr. Sarah Johnson', member_count: 5, lab_id: '1', lab_name: 'Analytical Chemistry Lab' },
      { id: '2', name: 'Cell Imaging Group', leader_name: 'Dr. Michael Chen', member_count: 8, lab_id: '2', lab_name: 'Cell Biology Lab' },
      { id: '3', name: 'Gene Expression Team', leader_name: 'Dr. Emily Rodriguez', member_count: 6, lab_id: '3', lab_name: 'Molecular Genetics Lab' },
      { id: '4', name: 'Cross-Lab Collaboration', leader_name: 'Dr. Alex Thompson', member_count: 12, lab_id: '1', lab_name: 'Multi-Disciplinary' }
    ]);

    setCategories(['Analytical Chemistry', 'Imaging & Microscopy', 'Molecular Biology', 'Cell Biology', 'Biochemistry', 'Genetics']);
    setIsLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_order':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrainingLevelColor = (level: string) => {
    switch (level) {
      case 'basic':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    // Demo mode - just close modal
    setShowCreateModal(false);
    setInstrumentForm({
      name: '', description: '', category: '', model: '', serial_number: '', lab_id: '', location: '',
      status: 'available', manufacturer: '', purchase_date: '', warranty_expiry: '', calibration_due_date: '',
      maintenance_notes: '', user_manual_url: '', hourly_rate: 0, max_booking_hours: 24, requires_training: false, training_level: 'basic'
    });
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    // Demo mode - just close modal
    setShowBookingModal(false);
    setShowTeamBookingModal(false);
    setBookingForm({
      start_time: '', end_time: '', purpose: '', notes: '', team_id: '', booking_type: 'individual'
    });
  };

  const openBookingModal = (instrument: Instrument, type: 'individual' | 'team' = 'individual') => {
    setSelectedInstrument(instrument);
    setBookingForm({
      start_time: '',
      end_time: '',
      purpose: '',
      notes: '',
      team_id: '',
      booking_type: type
    });
    if (type === 'team') {
      setShowTeamBookingModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratory Instruments</h1>
          <p className="text-gray-600">Manage and book research instruments across all labs</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Instrument
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'instruments', name: 'Instruments', icon: FlaskConicalIcon },
            { id: 'bookings', name: 'Bookings', icon: CalendarIcon },
            { id: 'teams', name: 'Teams', icon: UsersIcon },
            { id: 'labs', name: 'Labs', icon: BuildingOfficeIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'instruments' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search instruments..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
                <select
                  value={filters.lab_id}
                  onChange={(e) => setFilters({ ...filters, lab_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Labs</option>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out_of_order">Out of Order</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="available_now">Available Now</option>
                  <option value="requires_training">Requires Training</option>
                  <option value="free_to_use">Free to Use</option>
                </select>
              </div>
            </div>
          </div>

          {/* Instruments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instruments
              .filter(instrument => {
                if (filters.search && !instrument.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
                if (filters.lab_id && instrument.lab_id !== filters.lab_id) return false;
                if (filters.category && instrument.category !== filters.category) return false;
                if (filters.status && instrument.status !== filters.status) return false;
                if (filters.availability === 'available_now' && instrument.status !== 'available') return false;
                if (filters.availability === 'requires_training' && !instrument.requires_training) return false;
                if (filters.availability === 'free_to_use' && instrument.hourly_rate !== 0) return false;
                return true;
              })
              .map((instrument) => (
                <div key={instrument.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <FlaskConicalIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(instrument.status)}`}>
                        {instrument.status.replace('_', ' ')}
                      </span>
                      {instrument.requires_training && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrainingLevelColor(instrument.training_level)}`}>
                          {instrument.training_level}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{instrument.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{instrument.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      <span>{instrument.lab_name}</span>
                    </div>
                                         <div className="flex items-center space-x-2 text-sm text-gray-600">
                       <PinIcon className="w-4 h-4" />
                       <span>{instrument.location}</span>
                     </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <TagIcon className="w-4 h-4" />
                      <span>{instrument.category}</span>
                    </div>
                    {instrument.hourly_rate > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <StarIcon className="w-4 h-4" />
                        <span>${instrument.hourly_rate}/hour</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openBookingModal(instrument, 'individual')}
                        disabled={instrument.status !== 'available'}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserIcon className="w-4 h-4 mr-1 inline" />
                        Book
                      </button>
                      <button
                        onClick={() => openBookingModal(instrument, 'team')}
                        disabled={instrument.status !== 'available'}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UsersIcon className="w-4 h-4 mr-1 inline" />
                        Team Book
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="View details">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="Edit">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent bookings. Book an instrument to get started!</p>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-gray-500">{team.member_count} members</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
              <p className="text-sm text-gray-600 mb-3">Led by {team.leader_name}</p>
              <p className="text-sm text-gray-500 mb-4">{team.lab_name}</p>
              
              <button className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                View Team
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{lab.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{lab.institution}</p>
              <p className="text-sm text-gray-500 mb-4">{lab.department}</p>
              
              <button className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all">
                View Lab
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Individual Booking Modal */}
      {showBookingModal && selectedInstrument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Book Instrument</h2>
            <p className="text-sm text-gray-600 mb-4">Booking: {selectedInstrument.name}</p>
            
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={bookingForm.end_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Book Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Booking Modal */}
      {showTeamBookingModal && selectedInstrument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team Booking</h2>
            <p className="text-sm text-gray-600 mb-4">Booking: {selectedInstrument.name}</p>
            
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={bookingForm.team_id}
                  onChange={(e) => setBookingForm({ ...bookingForm, team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name} ({team.leader_name})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={bookingForm.end_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTeamBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Book for Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Instrument Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Instrument</h2>
            
            <form onSubmit={handleCreateInstrument} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={instrumentForm.name}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={instrumentForm.category}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={instrumentForm.description}
                  onChange={(e) => setInstrumentForm({ ...instrumentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                  <select
                    value={instrumentForm.lab_id}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, lab_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select lab...</option>
                    {labs.map((lab) => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={instrumentForm.location}
                    onChange={(e) => setInstrumentForm({ ...instrumentForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstrumentsPage;