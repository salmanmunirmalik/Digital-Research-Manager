import axios from 'axios';
import {
  formatApiNetworkError,
  getAuthToken,
  resolveApiBaseUrl,
} from '../utils/apiBase';

let initialized = false;

export const setupAxios = () => {
  if (initialized) return;

  axios.defaults.baseURL = resolveApiBaseUrl();

  axios.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token && !config.headers?.Authorization) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
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

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response && isNetworkError(error)) {
        error.message = formatApiNetworkError(error);
      }
      return Promise.reject(error);
    }
  );

  initialized = true;
};

function isNetworkError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  return (
    err?.code === 'ERR_NETWORK' ||
    /failed to fetch|network error|err_connection_refused/i.test(err?.message || '')
  );
}
