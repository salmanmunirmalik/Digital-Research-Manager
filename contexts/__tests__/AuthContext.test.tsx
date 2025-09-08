import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { mockApiResponses } from '../setupTests';

// Mock fetch globally
global.fetch = jest.fn();

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {user ? (
        <div>
          <span data-testid="user-email">{user.email}</span>
          <button data-testid="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      ) : (
        <button 
          data-testid="login-button" 
          onClick={() => login('test@example.com', 'password123')}
        >
          Login
        </button>
      )}
    </div>
  );
};

// Wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication Flow', () => {
    it('should render login button when user is not authenticated', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    it('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'researcher',
        first_name: 'Test',
        last_name: 'User'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponses.success({
          message: 'Login successful',
          token: 'mock-jwt-token',
          user: mockUser
        })
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });

      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should handle login failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponses.error('Invalid credentials', 401)
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should logout user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'researcher',
        first_name: 'Test',
        last_name: 'User'
      };

      // Mock successful login first
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponses.success({
          message: 'Login successful',
          token: 'mock-jwt-token',
          user: mockUser
        })
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Login first
      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toBeInTheDocument();
      });

      // Now logout
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Token Persistence', () => {
    it('should restore user from localStorage on mount', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'researcher',
        first_name: 'Test',
        last_name: 'User'
      };

      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should handle invalid token in localStorage', () => {
      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('user', 'invalid-json');

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });
    });

    it('should handle malformed API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });
    });
  });
});
