import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { exchangeAPI, sharedInstrumentsAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import InstrumentBookingCalendar from '../components/InstrumentBookingCalendar';

interface ExchangeRequest {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  urgency: string;
  needed_by: string;
  location_preference: string;
  status: string;
  notes: string;
  requester_lab_name: string;
  institution: string;
  created_at: string;
}

interface ExchangeOffer {
  id: string;
  request_id: string;
  provider_lab_name: string;
  quantity: number;
  unit: string;
  message: string;
  status: string;
  created_at: string;
}

interface SharedInstrument {
  id: string;
  name: string;
  category: string;
  lab_name: string;
  institution: string;
  sharing_scope: string;
  status: string;
  external_contact_email: string;
  access_policy: string;
}

const ResourceExchangePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'supplies' | 'instruments'>('supplies');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);

  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Supplies state
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [offers, setOffers] = useState<ExchangeOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    lab_id: user?.lab_id || '',
    item_name: '',
    category: '',
    quantity: 1,
    unit: 'pcs',
    urgency: 'normal',
    needed_by: '',
    location_preference: 'institution',
    notes: ''
  });

  const [offerForm, setOfferForm] = useState({
    quantity: 1,
    unit: 'pcs',
    message: ''
  });

  // Instruments state
  const [sharedInstruments, setSharedInstruments] = useState<SharedInstrument[]>([]);
  const [instrumentFilters, setInstrumentFilters] = useState({ 
    scope: 'institution', 
    availability: 'available', 
    search: '' 
  });
  
  // Booking calendar state
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<SharedInstrument | null>(null);

  // Real-time simulation
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Load data functions
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exchangeAPI.listRequests();
      setRequests(res.requests);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOffers = useCallback(async (requestId?: string) => {
    try {
      const res = await exchangeAPI.listOffers(requestId);
      setOffers(res.offers);
    } catch (error) {
      console.error('Failed to load offers:', error);
    }
  }, []);

  const loadSharedInstruments = useCallback(async () => {
    try {
      const res = await sharedInstrumentsAPI.listShared({ 
        scope: instrumentFilters.scope, 
        availability: instrumentFilters.availability, 
        search: instrumentFilters.search 
      });
      setSharedInstruments(res.instruments);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load shared instruments:', error);
    }
  }, [instrumentFilters.scope, instrumentFilters.availability, instrumentFilters.search]);

  // Form handlers
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !requestForm.lab_id || !requestForm.item_name) {
      alert('Please make sure you are logged in and have selected a lab.');
      return;
    }
    
    try {
      const requestData = {
        ...requestForm,
        requester_user_id: user.id,
        requester_lab_id: requestForm.lab_id
      };
      
      await exchangeAPI.createRequest(requestData);
      setRequestForm({ 
        ...requestForm, 
        item_name: '', 
        category: '', 
        quantity: 1, 
        unit: 'pcs', 
        urgency: 'normal', 
        needed_by: '', 
        notes: '' 
      });
      setShowRequestForm(false);
      await loadRequests();
      
      // Show success message
      alert('Request posted successfully! Other labs will be notified in real-time.');
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Failed to post request. Please try again.');
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    try {
      await exchangeAPI.createOffer(selectedRequest.id, offerForm);
      setOfferForm({ quantity: 1, unit: 'pcs', message: '' });
      setShowOfferForm(false);
      setSelectedRequest(null);
      await loadOffers(selectedRequest.id);
      
      // Show success message
      alert('Offer submitted successfully! The requesting lab will be notified immediately.');
    } catch (error) {
      console.error('Failed to create offer:', error);
      alert('Failed to submit offer. Please try again.');
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await exchangeAPI.updateRequestStatus(requestId, newStatus);
      await loadRequests();
      
      // Show success message
      alert(`Request status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleOfferStatusUpdate = async (offerId: string, newStatus: string) => {
    try {
      await exchangeAPI.updateOfferStatus(offerId, newStatus);
      await loadOffers(selectedRequest?.id);
      
      // Show success message
      alert(`Offer ${newStatus} successfully!`);
    } catch (error) {
      console.error('Failed to update offer status:', error);
      alert('Failed to update offer status. Please try again.');
    }
  };

  // Real-time updates simulation
  useEffect(() => {
    if (realTimeUpdates) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        loadRequests();
        if (activeTab === 'instruments') {
          loadSharedInstruments();
        }
      }, 30000); // Update every 30 seconds
      
      setUpdateInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
  }, [realTimeUpdates, activeTab, loadRequests, loadSharedInstruments]);

  // Effects
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Update form when user changes
  useEffect(() => {
    if (user?.lab_id) {
      setRequestForm(prev => ({ ...prev, lab_id: user.lab_id }));
    }
  }, [user?.lab_id]);

  useEffect(() => {
    if (activeTab === 'instruments') {
      loadSharedInstruments();
    }
  }, [activeTab, loadSharedInstruments]);

  useEffect(() => {
    if (selectedRequest) {
      loadOffers(selectedRequest.id);
    }
  }, [selectedRequest, loadOffers]);

  // Utility functions
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'normal': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'matched': return 'bg-yellow-100 text-yellow-700';
      case 'fulfilled': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      case 'fulfilled': return 'bg-green-100 text-green-700';
      case 'withdrawn': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="p-4 sm:p-6">



      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Inter‑Lab Resource Exchange</h1>
            <p className="text-gray-600 mt-1">Request supplies from nearby labs and find shared instruments across institutions.</p>
          </div>
          
          {/* Demo Login Button */}
          <button
            onClick={() => {
              localStorage.setItem('authToken', 'demo-token-123');
              localStorage.setItem('user', JSON.stringify({
                id: '550e8400-e29b-41d4-a716-446655440003',
                username: 'student',
                email: 'demo@researchlab.com',
                first_name: 'Demo',
                last_name: 'User',
                role: 'student',
                lab_id: 'c8ace470-5e21-4d3b-ab95-da6084311657'
              }));
              window.location.reload();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Demo Login
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${realTimeUpdates ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {realTimeUpdates ? 'Live Updates' : 'Manual Updates'}
              </span>
            </div>
            
            <button
              onClick={() => setRealTimeUpdates(!realTimeUpdates)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                realTimeUpdates 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {realTimeUpdates ? 'Disable Live' : 'Enable Live'}
            </button>
            
            {lastUpdate && (
              <div className="text-xs text-gray-500">
                Last update: {formatTimeAgo(lastUpdate.toISOString())}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'supplies' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`} 
          onClick={() => setActiveTab('supplies')}
        >
          Supplies Exchange
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'instruments' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`} 
          onClick={() => setActiveTab('instruments')}
        >
          Shared Instruments
        </button>
      </div>

      {activeTab === 'supplies' && (
        <div className="space-y-6">
          {/* Request Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Post a Supply Request</h2>
                <button
                  onClick={() => setShowRequestForm(!showRequestForm)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showRequestForm ? 'Hide Form' : 'New Request'}
                </button>
              </div>
            </div>
            
            {showRequestForm && (
              <form onSubmit={handleRequestSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Lab *</label>
                    <input 
                      value={requestForm.lab_id} 
                      onChange={(e) => setRequestForm({ ...requestForm, lab_id: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder={user?.lab_id ? "Your lab is pre-filled" : "Enter your lab UUID"} 
                      required
                      disabled={!!user?.lab_id}
                    />
                    {user?.lab_id && (
                      <p className="text-xs text-gray-500 mt-1">Using your assigned lab: {user.lab_id}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input 
                      value={requestForm.item_name} 
                      onChange={(e) => setRequestForm({ ...requestForm, item_name: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="e.g., DNA polymerase, antibodies" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input 
                      value={requestForm.category} 
                      onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="Reagents, Consumables, etc." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min={1} 
                      value={requestForm.quantity} 
                      onChange={(e) => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input 
                      value={requestForm.unit} 
                      onChange={(e) => setRequestForm({ ...requestForm, unit: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="ml, pcs, mg, etc." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                    <select 
                      value={requestForm.urgency} 
                      onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Needed by</label>
                    <input 
                      type="date" 
                      value={requestForm.needed_by} 
                      onChange={(e) => setRequestForm({ ...requestForm, needed_by: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sharing Scope</label>
                    <select 
                      value={requestForm.location_preference} 
                      onChange={(e) => setRequestForm({ ...requestForm, location_preference: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="institution">Same University</option>
                      <option value="consortium">Consortium</option>
                      <option value="any">Any University</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea 
                    value={requestForm.notes} 
                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows={3} 
                    placeholder="Safety constraints, brand preferences, specific requirements, etc." 
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Post Request
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Open Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Open Requests</h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={loadRequests} 
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Refresh
                  </button>
                  <div className="text-sm text-gray-500">
                    {requests.length} active requests
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading requests...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.item_name}</div>
                            <div className="text-sm text-gray-500">{request.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.quantity} {request.unit}
                          </div>
                          {request.needed_by && (
                            <div className="text-sm text-gray-500">Needed by: {new Date(request.needed_by).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.requester_lab_name}</div>
                            <div className="text-sm text-gray-500">{request.institution}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatTimeAgo(request.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowOfferForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Make Offer
                            </button>
                            {request.status === 'open' && (
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {requests.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No open requests found</div>
                )}
              </div>
            )}
          </div>

          {/* Offer Form Modal */}
          {showOfferForm && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Make an Offer for "{selectedRequest.item_name}"</h3>
                <form onSubmit={handleOfferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min={1} 
                      value={offerForm.quantity} 
                      onChange={(e) => setOfferForm({ ...offerForm, quantity: Number(e.target.value) })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input 
                      value={offerForm.unit} 
                      onChange={(e) => setOfferForm({ ...offerForm, unit: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      placeholder="ml, pcs, mg, etc." 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      value={offerForm.message} 
                      onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      rows={3} 
                      placeholder="Any additional information about your offer..." 
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowOfferForm(false);
                        setSelectedRequest(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Submit Offer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Offers for Selected Request */}
          {selectedRequest && offers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Offers for "{selectedRequest.item_name}"</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{offer.provider_lab_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {offer.quantity} {offer.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{offer.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOfferStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatTimeAgo(offer.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {offer.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleOfferStatusUpdate(offer.id, 'accepted')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleOfferStatusUpdate(offer.id, 'declined')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'instruments' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sharing Scope</label>
                <select 
                  value={instrumentFilters.scope} 
                  onChange={(e) => setInstrumentFilters({ ...instrumentFilters, scope: e.target.value })} 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="institution">Same University</option>
                  <option value="consortium">Consortium</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select 
                  value={instrumentFilters.availability} 
                  onChange={(e) => setInstrumentFilters({ ...instrumentFilters, availability: e.target.value })} 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input 
                  value={instrumentFilters.search} 
                  onChange={(e) => setInstrumentFilters({ ...instrumentFilters, search: e.target.value })} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Instrument name or category" 
                />
              </div>
              <button 
                onClick={loadSharedInstruments} 
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Shared Instruments Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Shared Instruments Directory</h2>
                <div className="text-sm text-gray-500">
                  {sharedInstruments.length} instruments available
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrument</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sharedInstruments.map((instrument) => (
                    <tr key={instrument.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setSelectedInstrument(instrument);
                      setShowBookingCalendar(true);
                    }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{instrument.name}</div>
                          <div className="text-sm text-gray-500">{instrument.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{instrument.lab_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{instrument.institution}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {instrument.sharing_scope}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          instrument.status === 'available' ? 'bg-green-100 text-green-700' :
                          instrument.status === 'booked' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {instrument.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {instrument.external_contact_email || '-'}
                        </div>
                        {instrument.access_policy && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {instrument.access_policy}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sharedInstruments.length === 0 && (
                <div className="p-8 text-center text-gray-500">No shared instruments found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instrument Booking Calendar */}
      {showBookingCalendar && selectedInstrument && (
        <InstrumentBookingCalendar
          instrumentId={selectedInstrument.id}
          instrumentName={selectedInstrument.name}
          onClose={() => {
            setShowBookingCalendar(false);
            setSelectedInstrument(null);
          }}
          onBookingCreated={(booking) => {
            console.log('New booking created:', booking);
            // Optionally refresh the shared instruments list
            loadSharedInstruments();
          }}
        />
      )}
    </div>
  );
};

export default ResourceExchangePage;


