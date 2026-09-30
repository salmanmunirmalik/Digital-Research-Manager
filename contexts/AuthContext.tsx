import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/apiService';
import { clearAuthToken, formatApiNetworkError, resolveApiBaseUrl } from '../utils/apiBase';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  lab_id?: string;
  created_at: string;
  avatar_url?: string;
  current_institution?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const clearLocalSession = () => {
  clearAuthToken();
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Load token then revalidate against the API (do not trust localStorage role alone)
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
          return;
        }

        setToken(storedToken);
        try {
          const profile = await authAPI.getProfile();
          setUser(profile.user);
          localStorage.setItem('user', JSON.stringify(profile.user));
        } catch {
          clearLocalSession();
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
      setToken(data.token);

      // Link anonymous cookie consent session to authenticated user (GDPR accountability)
      try {
        const sessionId = localStorage.getItem('consent_session_id');
        if (sessionId && data.token) {
          const apiBase = resolveApiBaseUrl();
          await fetch(`${apiBase}/compliance/consent/link-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}`,
              'X-Session-Id': sessionId
            },
            body: JSON.stringify({ sessionId })
          });
        }
      } catch (linkError) {
        console.error('Failed to link consent session:', linkError);
      }
    } catch (error) {
      console.error('Login failed:', formatApiNetworkError(error));
      throw error instanceof Error
        ? new Error(formatApiNetworkError(error))
        : error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const data = await authAPI.register(
        userData.username,
        userData.email,
        userData.password,
        userData.first_name,
        userData.last_name,
        userData.role
      );
      setUser(data.user);
      setToken(data.token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // local session still cleared in apiService / finally
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
