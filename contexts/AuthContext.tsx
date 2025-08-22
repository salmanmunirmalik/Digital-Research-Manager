import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  lab_id?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Mock demo user data
const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  username: 'demo_user',
  email: 'demo@researchlab.com',
  first_name: 'Demo',
  last_name: 'User',
  role: 'student',
  lab_id: '650e8400-e29b-41d4-a716-446655440000',
  created_at: new Date().toISOString()
};

const mockToken = 'demo-token-123';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Load from localStorage and verify with backend
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
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
      const resp = await fetch((import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api' + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!resp.ok) throw new Error('Login failed');
      const data = await resp.json();
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setUser(mockUser);
    setToken(mockToken);
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const resp = await fetch(((import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api') + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!resp.ok) throw new Error('Registration failed');
      const data = await resp.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const tokenLocal = localStorage.getItem('authToken');
      await fetch(((import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api') + '/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': tokenLocal ? `Bearer ${tokenLocal}` : '' }
      });
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    try {
      const tokenLocal = localStorage.getItem('authToken');
      const resp = await fetch(((import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api') + '/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': tokenLocal ? `Bearer ${tokenLocal}` : '' },
        body: JSON.stringify(data)
      });
      if (!resp.ok) throw new Error('Profile update failed');
      const body = await resp.json();
      setUser(body.user);
      localStorage.setItem('user', JSON.stringify(body.user));
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      const tokenLocal = localStorage.getItem('authToken');
      const resp = await fetch(((import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api') + '/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': tokenLocal ? `Bearer ${tokenLocal}` : '' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!resp.ok) throw new Error('Password change failed');
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
    demoLogin,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
