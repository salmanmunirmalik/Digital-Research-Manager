
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SideNav from './components/SideNav';

// Import all pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LabManagementPage from './pages/LabManagementPage';
import LabNotebookPage from './pages/LabNotebookPage';
import ProtocolsPage from './pages/ProtocolsPage';
import InventoryPage from './pages/InventoryPage';
import InstrumentsPage from './pages/InstrumentsPage';
import ResearchIntelligenceHub from './pages/ResearchIntelligenceHub';
import AutomatedPresentationsPage from './pages/AutomatedPresentationsPage';
import GlobalDataSharingPage from './pages/GlobalDataSharingPage';
import HelpForumPage from './pages/HelpForumPage';
import ConferenceNewsPage from './pages/ConferenceNewsPage';
import CalculatorHubPage from './pages/CalculatorHubPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Authenticated Layout Component
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4 w-64">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">DR</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Research Lab</h1>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search experiments, protocols, data..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-1 justify-end">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-medium">
                  {user?.first_name?.[0]}{user?.last_name?.[0] || user?.username?.[0]}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username
                  }
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 shadow-lg flex-shrink-0">
          <SideNav />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DashboardPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/home" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <HomePage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/lab-management" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <LabManagementPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/lab-notebook" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <LabNotebookPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/protocols" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ProtocolsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <InventoryPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/instruments" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <InstrumentsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/research-intelligence" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ResearchIntelligenceHub />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/presentations" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AutomatedPresentationsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/data-sharing" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <GlobalDataSharingPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/help-forum" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <HelpForumPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/conferences" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ConferenceNewsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      {/* Tools & Resources Routes */}
      <Route path="/calculator-hub" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <CalculatorHubPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/reference-library" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Reference Library</h1>
                <p className="text-gray-600">Coming soon - Access protocols, standards, and research resources</p>
              </div>
            </div>
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/unit-converter" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Unit Converter</h1>
                <p className="text-gray-600">Coming soon - Convert between different measurement units</p>
              </div>
            </div>
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/data-analysis" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Data Analysis Tools</h1>
                <p className="text-gray-600">Coming soon - Statistical analysis and visualization tools</p>
              </div>
            </div>
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/research-assistant" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Research Assistant</h1>
                <p className="text-gray-600">Coming soon - AI-powered research helper and insights</p>
              </div>
            </div>
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      {/* Quick Action Routes */}
      <Route path="/notebook" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <LabNotebookPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/notebook/new" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <LabNotebookPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/protocols/new" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <ProtocolsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/instruments/book" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <InstrumentsPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/tasks/new" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DashboardPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      <Route path="/team" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Collaboration</h1>
                <p className="text-gray-600">Team collaboration features coming soon!</p>
              </div>
            </div>
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
