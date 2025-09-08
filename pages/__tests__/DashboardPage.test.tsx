import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { AuthProvider } from '../contexts/AuthContext';
import { mockApiResponses } from '../../setupTests';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      role: 'researcher',
      first_name: 'Test',
      last_name: 'User'
    },
    isLoading: false
  })
}));

// Wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve(mockApiResponses.success({
          total_protocols: 10,
          total_experiments: 5,
          pending_tasks: 3,
          upcoming_events: 2,
          lab_members: 8,
          active_projects: 4
        }));
      }
      
      if (url.includes('/api/tasks')) {
        return Promise.resolve(mockApiResponses.success([
          {
            id: '1',
            title: 'Test Task',
            description: 'Test task description',
            status: 'pending',
            priority: 'high',
            due_date: '2024-01-15',
            assigned_to: 'testuser'
          }
        ]));
      }
      
      if (url.includes('/api/calendar')) {
        return Promise.resolve(mockApiResponses.success([
          {
            id: '1',
            title: 'Test Event',
            description: 'Test event description',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            location: 'Test Lab'
          }
        ]));
      }
      
      if (url.includes('/api/notebook-entries')) {
        return Promise.resolve(mockApiResponses.success([
          {
            id: '1',
            title: 'Test Entry',
            content: 'Test entry content',
            entry_type: 'experiment',
            status: 'completed',
            priority: 'medium',
            created_at: '2024-01-15T10:00:00Z'
          }
        ]));
      }
      
      return Promise.resolve(mockApiResponses.success({}));
    });
  });

  it('should render dashboard with all main sections', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check for main sections
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Lab Statistics')).toBeInTheDocument();
    expect(screen.getByText('Priority Tasks')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
  });

  it('should display lab statistics correctly', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // total_protocols
      expect(screen.getByText('5')).toBeInTheDocument(); // total_experiments
      expect(screen.getByText('3')).toBeInTheDocument(); // pending_tasks
    });
  });

  it('should handle quick add modal', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Add')).toBeInTheDocument();
    });

    const quickAddButton = screen.getByText('Quick Add');
    fireEvent.click(quickAddButton);

    // Check if modal opens
    expect(screen.getByText('Quick Add Item')).toBeInTheDocument();
  });

  it('should handle create entry modal', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Entry')).toBeInTheDocument();
    });

    const addEntryButton = screen.getByText('Add Entry');
    fireEvent.click(addEntryButton);

    // Check if modal opens
    expect(screen.getByText('Create New Entry')).toBeInTheDocument();
  });

  it('should display tasks correctly', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    expect(screen.getByText('Test task description')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('should display calendar events correctly', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    expect(screen.getByText('Test event description')).toBeInTheDocument();
    expect(screen.getByText('Test Lab')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve(mockApiResponses.serverError())
    );

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Should still render the dashboard even with API errors
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should handle loading states', async () => {
    // Mock slow API response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockApiResponses.success({})), 100))
    );

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Should show loading state initially
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
