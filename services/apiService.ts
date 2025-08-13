import { Protocol, Project, ResultEntry, InventoryItem, Instrument, TeamMember } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic API request function
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

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    // Store token in localStorage
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  register: async (username: string, email: string, password: string, role?: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    });
    
    // Store token in localStorage
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
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
    return apiRequest<{ members: TeamMember[] }>('/team');
  },

  getById: async (id: string) => {
    return apiRequest<{ member: TeamMember }>(`/team/${id}`);
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

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

// Utility function to get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
