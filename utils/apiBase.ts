/**
 * Single source of truth for API base URL and auth token keys.
 * Prefer this over per-page resolveApiBaseUrl / localStorage token lookups.
 */

const AUTH_TOKEN_KEY = 'authToken';
/** Legacy alias — many pages still read `token`; keep in sync with authToken. */
const LEGACY_TOKEN_KEY = 'token';

export const BACKEND_DOWN_MESSAGE =
  'API not reachable. Is the backend running on port 5002? Try: pnpm run dev:app';

export function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl != null && String(envUrl).trim() !== '') {
    return String(envUrl).replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Dev: same-origin `/api` → Vite proxy → localhost:5002
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5002/api';
}

export function getAuthToken(): string | null {
  if (typeof localStorage === 'undefined') return null;

  const primary = localStorage.getItem(AUTH_TOKEN_KEY);
  if (primary) {
    if (localStorage.getItem(LEGACY_TOKEN_KEY) !== primary) {
      localStorage.setItem(LEGACY_TOKEN_KEY, primary);
    }
    return primary;
  }

  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(AUTH_TOKEN_KEY, legacy);
    return legacy;
  }

  return null;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem('user');
}

export function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function isBackendUnreachableError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : '';
  return (
    name === 'TypeError' ||
    /failed to fetch/i.test(msg) ||
    /networkerror/i.test(msg) ||
    /err_connection_refused/i.test(msg) ||
    /load failed/i.test(msg) ||
    /network request failed/i.test(msg)
  );
}

export function formatApiNetworkError(error: unknown, fallback?: string): string {
  if (isBackendUnreachableError(error)) {
    return BACKEND_DOWN_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback || 'Request failed';
}

/** Join API base + path without doubling /api */
export function apiUrl(path: string): string {
  const base = resolveApiBaseUrl().replace(/\/$/, '');
  let p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith('/api/')) p = p.slice(4);
  else if (p === '/api') p = '/';
  return `${base}${p.startsWith('/') ? p : `/${p}`}`;
}
