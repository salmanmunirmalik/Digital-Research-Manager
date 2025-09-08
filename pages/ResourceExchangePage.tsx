import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { exchangeAPI, sharedInstrumentsAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import InstrumentBookingCalendar from '../components/InstrumentBookingCalendar';
import { BellIcon, XMarkIcon, StarIcon } from '../components/icons';

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
  rating?: number;
  review_count?: number;
}

interface Notification {
  id: string;
  type: 'request_match' | 'offer_received' | 'exchange_completed' | 'rating_received' | 'booking_confirmed';
  title: string;
  message: string;
  from_lab: string;
  from_user: string;
  timestamp: Date;
  read: boolean;
  related_id: string;
  priority: 'low' | 'medium' | 'high';
}

interface Rating {
  id: string;
  exchange_id: string;
  rater_lab: string;
  rated_lab: string;
  rating: number;
  review: string;
  category: 'supplies' | 'instruments';
  created_at: Date;
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

  // Notification and rating states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedExchangeForRating, setSelectedExchangeForRating] = useState<{
    id: string;
    lab_name: string;
    category: 'supplies' | 'instruments';
  } | null>(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    review: ''
  });

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

  // Notification and rating functions
  const loadNotifications = useCallback(async () => {
    // Mock notifications - in real app, this would come from WebSocket or API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'offer_received',
        title: 'New Offer Received',
        message: 'Molecular Biology Lab has offered 50ml of Taq Polymerase for your PCR reagents request',
        from_lab: 'Molecular Biology Lab',
        from_user: 'Dr. Sarah Chen',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        related_id: 'req_1',
        priority: 'high'
      },
      {
        id: '2',
        type: 'request_match',
        title: 'Request Match Found',
        message: 'Your request for Cell Culture Medium matches with Biochemistry Lab inventory',
        from_lab: 'Biochemistry Lab',
        from_user: 'Alex Rodriguez',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        related_id: 'req_2',
        priority: 'medium'
      },
      {
        id: '3',
        type: 'exchange_completed',
        title: 'Exchange Completed',
        message: 'Your exchange with Cell Biology Lab has been completed successfully',
        from_lab: 'Cell Biology Lab',
        from_user: 'Maria Garcia',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        related_id: 'ex_1',
        priority: 'low'
      },
      {
        id: '4',
        type: 'rating_received',
        title: 'New Rating Received',
        message: 'You received a 5-star rating from Dr. Sarah Chen for your recent exchange',
        from_lab: 'Molecular Biology Lab',
        from_user: 'Dr. Sarah Chen',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: false,
        related_id: 'ex_2',
        priority: 'medium'
      },
      {
        id: '5',
        type: 'booking_confirmed',
        title: 'Instrument Booking Confirmed',
        message: 'Your booking for PCR Machine has been confirmed for tomorrow 2:00 PM',
        from_lab: 'Genomics Lab',
        from_user: 'Dr. John Smith',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: true,
        related_id: 'booking_1',
        priority: 'medium'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const loadRatings = useCallback(async () => {
    // Mock ratings - in real app, this would come from API
    const mockRatings: Rating[] = [
      {
        id: '1',
        exchange_id: 'ex_1',
        rater_lab: 'Molecular Biology Lab',
        rated_lab: 'Current Lab',
        rating: 5,
        review: 'Excellent service! The reagents were exactly as described and delivered on time.',
        category: 'supplies',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        exchange_id: 'ex_2',
        rater_lab: 'Biochemistry Lab',
        rated_lab: 'Current Lab',
        rating: 4,
        review: 'Good quality materials, but delivery was slightly delayed.',
        category: 'supplies',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        exchange_id: 'ex_3',
        rater_lab: 'Cell Biology Lab',
        rated_lab: 'Current Lab',
        rating: 5,
        review: 'Perfect instrument sharing experience. Very professional and helpful.',
        category: 'instruments',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];
    
    setRatings(mockRatings);
  }, []);

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const submitRating = () => {
    if (!selectedExchangeForRating) return;
    
    const newRating: Rating = {
      id: Date.now().toString(),
      exchange_id: selectedExchangeForRating.id,
      rater_lab: 'Current Lab',
      rated_lab: selectedExchangeForRating.lab_name,
      rating: ratingForm.rating,
      review: ratingForm.review,
      category: selectedExchangeForRating.category,
      created_at: new Date()
    };
    
    setRatings(prev => [...prev, newRating]);
    setShowRatingModal(false);
    setRatingForm({ rating: 5, review: '' });
    setSelectedExchangeForRating(null);
    
    // Show success notification
    const successNotification: Notification = {
      id: Date.now().toString(),
      type: 'rating_received',
      title: 'Rating Submitted',
      message: `Your ${ratingForm.rating}-star rating for ${selectedExchangeForRating.lab_name} has been submitted`,
      from_lab: 'System',
      from_user: 'System',
      timestamp: new Date(),
      read: false,
      related_id: selectedExchangeForRating.id,
      priority: 'low'
    };
    
    setNotifications(prev => [successNotification, ...prev]);
  };

  const getLabRating = (labName: string): { average: number; count: number } => {
    const labRatings = ratings.filter(r => r.rated_lab === labName);
    if (labRatings.length === 0) return { average: 0, count: 0 };
    
    const average = labRatings.reduce((sum, r) => sum + r.rating, 0) / labRatings.length;
    return { average: Math.round(average * 10) / 10, count: labRatings.length };
  };

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

  // Load notifications and ratings
  useEffect(() => {
    loadNotifications();
    loadRatings();
  }, [loadNotifications, loadRatings]);

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
          
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {/* Notification Panel */}
            {showNotificationPanel && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={() => setShowNotificationPanel(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.priority === 'high' ? 'bg-red-500' :
                            notification.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{notification.from_lab}</span>
                              <span>{notification.timestamp.toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Updates Controls */}
      <div className="flex items-center space-x-4 mb-6">
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

      {/* Rating Modal */}
      {showRatingModal && selectedExchangeForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Rate Exchange</h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Rate your experience with <span className="font-medium">{selectedExchangeForRating.lab_name}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingForm(prev => ({ ...prev, rating: star }))}
                        className={`w-8 h-8 ${
                          star <= ratingForm.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <StarIcon className="w-full h-full fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {ratingForm.rating} star{ratingForm.rating !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review (optional)</label>
                  <textarea
                    value={ratingForm.review}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, review: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Share your experience with this lab..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRating}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <StarIcon className="w-4 h-4" />
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceExchangePage;


