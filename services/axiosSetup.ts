import axios from 'axios';

let initialized = false;

const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const port = import.meta.env.VITE_API_PORT || '5002';
    return `http://localhost:${port}/api`;
  }

  return `${window.location.origin}/api`;
};

export const setupAxios = () => {
  if (initialized) return;

  const baseURL = resolveBaseUrl();
  axios.defaults.baseURL = baseURL;

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token && !config.headers?.Authorization) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }

    if (config.url) {
      const isAbsolute = /^https?:\/\//i.test(config.url);
      if (!isAbsolute && config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api\//, '');
      } else if (!isAbsolute && config.url.startsWith('/')) {
        config.url = config.url.slice(1);
      }
    }

    return config;
  });

  initialized = true;
};

