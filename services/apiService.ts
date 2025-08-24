import { Protocol, Project, ResultEntry, InventoryItem, Instrument } from '../types';

// Simple environment-based API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic API request function with better error handling
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Authentication API with simplified logic
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Store token and user data
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  register: async (username: string, email: string, password: string, role?: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    });
    
    // Store token and user data
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  logout: async () => {
    // Clear local storage immediately
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Try to call logout API (but don't fail if it doesn't work)
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout API call failed, but local data cleared');
    }
  },

  getProfile: async () => {
    return apiRequest<{ user: any }>('/auth/profile');
  },

  updateProfile: async (data: { expertise?: string; avatar_url?: string }) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
};

// Protocols API
export const protocolsAPI = {
  getAll: async (filters?: { search?: string; tags?: string; access?: string; author?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags) params.append('tags', filters.tags);
    if (filters?.access) params.append('access', filters.access);
    if (filters?.author) params.append('author', filters.author);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/protocols?${queryString}` : '/protocols';
    
    return apiRequest<{ protocols: Protocol[] }>(endpoint);
  },

  getById: async (id: string) => {
    return apiRequest<{ protocol: Protocol }>(`/protocols/${id}`);
  },

  create: async (protocol: Partial<Protocol>) => {
    return apiRequest<{ message: string; protocolId: string }>('/protocols', {
      method: 'POST',
      body: JSON.stringify(protocol)
    });
  },

  update: async (id: string, protocol: Partial<Protocol>) => {
    return apiRequest(`/protocols/${id}`, {
      method: 'PUT',
      body: JSON.stringify(protocol)
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/protocols/${id}`, {
      method: 'DELETE'
    });
  },

  fork: async (id: string, data: { title?: string; description?: string }) => {
    return apiRequest<{ message: string; protocolId: string }>(`/protocols/${id}/fork`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// Notebook API
export const notebookAPI = {
  getProjects: async () => {
    return apiRequest<{ projects: Project[] }>('/notebook/projects');
  },

  createProject: async (data: { name: string; description?: string }) => {
    return apiRequest<{ message: string; projectId: string }>('/notebook/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getProject: async (projectId: string) => {
    return apiRequest<{ project: Project }>(`/notebook/projects/${projectId}`);
  },

  createExperiment: async (projectId: string, data: { name: string; goal?: string }) => {
    return apiRequest<{ message: string; experimentId: string }>(`/notebook/projects/${projectId}/experiments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  createEntry: async (experimentId: string, data: { title: string; protocolId?: string; content: any[]; summary?: string }) => {
    return apiRequest<{ message: string; entryId: string }>(`/notebook/experiments/${experimentId}/entries`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateEntry: async (entryId: string, data: { title?: string; content?: any[]; summary?: string; status?: string }) => {
    return apiRequest(`/notebook/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  getEntry: async (entryId: string) => {
    return apiRequest<{ entry: any }>(`/notebook/entries/${entryId}`);
  },

  deleteEntry: async (entryId: string) => {
    return apiRequest(`/notebook/entries/${entryId}`, {
      method: 'DELETE'
    });
  }
};

// Inventory API
export const inventoryAPI = {
  getAll: async (filters?: { search?: string; type?: string; location?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.location) params.append('location', filters.location);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/inventory?${queryString}` : '/inventory';
    
    return apiRequest<{ items: InventoryItem[] }>(endpoint);
  },

  create: async (item: Partial<InventoryItem>) => {
    return apiRequest<{ message: string; itemId: string }>('/inventory', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  },

  update: async (id: string, item: Partial<InventoryItem>) => {
    return apiRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/inventory/${id}`, {
      method: 'DELETE'
    });
  }
};

// Instruments API
export const instrumentsAPI = {
  getAll: async () => {
    return apiRequest<{ instruments: Instrument[] }>('/instruments');
  },

  getById: async (id: string) => {
    return apiRequest<{ instrument: Instrument; bookings: any[] }>(`/instruments/${id}`);
  },

  createBooking: async (instrumentId: string, data: { title: string; startTime: string; endTime: string }) => {
    return apiRequest<{ message: string; bookingId: string }>(`/instruments/${instrumentId}/book`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// Resource Exchange API
export const exchangeAPI = {
  createRequest: async (data: {
    lab_id: string;
    item_name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    urgency?: string;
    needed_by?: string;
    location_preference?: string;
    notes?: string;
  }) => {
    return apiRequest<{ request: any }>('/exchange/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  listRequests: async (filters?: { status?: string; search?: string; institution?: string; scope?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.institution) params.append('institution', filters.institution);
    if (filters?.scope) params.append('scope', filters.scope);
    const qs = params.toString();
    return apiRequest<{ requests: any[] }>(`/exchange/requests${qs ? `?${qs}` : ''}`);
  },

  updateRequestStatus: async (id: string, status: string) => {
    return apiRequest<{ request: any }>(`/exchange/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  createOffer: async (requestId: string, data: { quantity?: number; unit?: string; message?: string }) => {
    return apiRequest<{ offer: any }>(`/exchange/requests/${requestId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  listOffers: async (requestId?: string) => {
    const params = new URLSearchParams();
    if (requestId) params.append('request_id', requestId);
    const qs = params.toString();
    return apiRequest<{ offers: any[] }>(`/exchange/offers${qs ? `?${qs}` : ''}`);
  },

  updateOfferStatus: async (id: string, status: string) => {
    return apiRequest<{ offer: any }>(`/exchange/offers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
};

// Shared Instruments Directory API
export const sharedInstrumentsAPI = {
  shareInstrument: async (instrumentId: string, data: { sharing_scope?: string; access_policy?: string; external_contact_email?: string; is_shared?: boolean }) => {
    return apiRequest<{ shared: any }>(`/instruments/${instrumentId}/share`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  listShared: async (filters?: { scope?: string; institution?: string; availability?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.institution) params.append('institution', filters.institution);
    if (filters?.availability) params.append('availability', filters.availability);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    return apiRequest<{ instruments: any[] }>(`/instruments/shared${qs ? `?${qs}` : ''}`);
  }
};

// Instrument Bookings API
export const instrumentBookingsAPI = {
  createBooking: async (instrumentId: string, bookingData: any) => 
    apiRequest(`/instruments/${instrumentId}/book`, { method: 'POST', body: JSON.stringify(bookingData) }),
  
  getAvailability: async (instrumentId: string, date: string) => 
    apiRequest(`/instruments/${instrumentId}/availability?date=${date}`),
  
  getBookings: async (instrumentId: string, date?: string, status?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    return apiRequest(`/instruments/${instrumentId}/bookings?${params.toString()}`);
  },
  
  updateBookingStatus: async (bookingId: string, status: string, rejectionReason?: string) => 
    apiRequest(`/bookings/${bookingId}/status`, { 
      method: 'PUT', 
      body: JSON.stringify({ status, ...(rejectionReason && { rejection_reason: rejectionReason }) }) 
    }),
  
  getMyBookings: async () => apiRequest('/bookings/my'),
};

// Data API
export const dataAPI = {
  getAll: async (filters?: { search?: string; tags?: string; protocolId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags) params.append('tags', filters.tags);
    if (filters?.protocolId) params.append('protocolId', filters.protocolId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/data?${queryString}` : '/data';
    
    return apiRequest<{ results: ResultEntry[] }>(endpoint);
  },

  create: async (result: Partial<ResultEntry>) => {
    return apiRequest<{ message: string; resultId: string }>('/data', {
      method: 'POST',
      body: JSON.stringify(result)
    });
  }
};

// Team API
export const teamAPI = {
  getAll: async () => {
    return apiRequest<{ members: any[] }>('/team');
  },

  getById: async (id: string) => {
    return apiRequest<{ member: any }>(`/team/${id}`);
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/team/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};

// Calculators API
export const calculatorsAPI = {
  getScratchpad: async () => {
    return apiRequest<{ items: any[] }>('/calculators/scratchpad');
  },

  saveScratchpad: async (data: { calculatorName: string; inputs: any[]; result: any }) => {
    return apiRequest<{ message: string; itemId: string }>('/calculators/scratchpad', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteScratchpad: async (id: string) => {
    return apiRequest(`/calculators/scratchpad/${id}`, {
      method: 'DELETE'
    });
  }
};

// Demo mode - always return authenticated
export const isAuthenticated = (): boolean => {
  return true;
};

// Demo mode - return mock user
export const getCurrentUser = () => {
  return {
    id: 'demo-user-123',
    username: 'demo_user',
    email: 'demo@researchlab.com',
    first_name: 'Demo',
    last_name: 'User',
    role: 'Principal Investigator'
  };
};
