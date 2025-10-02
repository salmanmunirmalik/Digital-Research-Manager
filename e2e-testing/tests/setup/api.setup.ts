import axios, { AxiosInstance } from 'axios';
import { config, endpoints } from './test-config';

let apiClient: AxiosInstance;
let authToken: string = '';

beforeAll(async () => {
  // Initialize API client
  apiClient = axios.create({
    baseURL: config.backendUrl,
    timeout: config.timeouts.long,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for authentication
  apiClient.interceptors.request.use((config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  });

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
});

// Make API client available to tests
global.apiClient = apiClient;

// Helper functions for API testing
global.apiHelpers = {
  async authenticate(email: string = config.testUser.email, password: string = config.testUser.password) {
    try {
      const response = await apiClient.post(endpoints.auth.login, { email, password });
      authToken = response.data.token;
      return response.data;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  },

  async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) {
    try {
      const response = await apiClient.request({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error) {
      console.error(`API Request failed [${method} ${endpoint}]:`, error);
      throw error;
    }
  },

  async testEndpoint(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, expectedStatus: number, data?: any) {
    try {
      const response = await apiClient.request({
        method,
        url: endpoint,
        data,
      });
      expect(response.status).toBe(expectedStatus);
      return response.data;
    } catch (error) {
      if (error.response) {
        expect(error.response.status).toBe(expectedStatus);
        return error.response.data;
      }
      throw error;
    }
  },

  async waitForService(url: string, maxRetries: number = 10) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Service at ${url} is not responding after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  },

  clearAuth() {
    authToken = '';
  },
};
