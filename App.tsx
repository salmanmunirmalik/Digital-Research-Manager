
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SideNav from './components/SideNav';
import ProtectedRoute from './components/ProtectedRoute';
import { getUserDisplayName, getRoleDisplayName } from './utils/roleAccess';

// Import all pages
import LabNotebookPage from './pages/LabNotebookPage';
import LabManagementPage from './pages/LabManagementPage';
import ProtocolsPage from './pages/ProtocolsPage';
import InventoryPage from './pages/InventoryPage';
import InstrumentsPage from './pages/InstrumentsPage';
import DataResultsPage from './pages/DataResultsPage';
import AutomatedPresentationsPage from './pages/AutomatedPresentationsPage';
import GlobalDataSharingPage from './pages/GlobalDataSharingPage';
import HelpForumPage from './pages/HelpForumPage';
import ConferenceNewsPage from './pages/ConferenceNewsPage';
import CalculatorHubPage from './pages/CalculatorHubPage';
import ReferenceLibraryPage from './pages/ReferenceLibraryPage';
import ResourceExchangePage from './pages/ResourceExchangePage';
import ResearcherPortfolioPage from './pages/ResearcherPortfolioPage';
import CoSupervisorDiscoveryPage from './pages/CoSupervisorDiscoveryPage';

import ResearchAssistantPage from './pages/ResearchAssistantPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import BioinformaticsToolsPage from './pages/BioinformaticsToolsPage';
import MolecularBiologyPage from './pages/MolecularBiologyPage';
import DataAnalyticsPage from './pages/DataAnalyticsPage';
import LandingPage from './pages/LandingPage';

// Demo Layout Component (temporary for demo)
const DemoLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">DR</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Digital Research Manager</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search experiments, protocols, data..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M9 11h.01M9 8h.01M15 14h.01M15 11h.01M15 8h.01M15 5h.01M12 5h.01M12 2h.01" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Help">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* User Profile Button */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role || 'student')}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{getUserDisplayName(user)}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          {getRoleDisplayName(user?.role || 'student')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        window.location.href = '/profile';
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        window.location.href = '/settings';
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Logout */}
                  <div className="py-2">
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          setShowUserMenu(false);
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Facebook-like Layout Container */}
      <div className="flex">
        {/* Left Sidebar - Always visible at all screen sizes */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex-shrink-0">
          <div className="h-full overflow-y-auto">
            <SideNav />
          </div>
        </aside>

        {/* Main Content Area - Takes remaining space */}
        <main className="flex-1 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <Navigate to="/lab-notebook" replace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Navigate to="/lab-notebook" replace />
          </ProtectedRoute>
        } 
      />
      
      {/* Enhanced Cross-Entity Integration Routes */}
          <Route
            path="/researcher-portfolio"
            element={
              <ProtectedRoute>
                <DemoLayout><ResearcherPortfolioPage /></DemoLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/co-supervisor-discovery"
            element={
              <ProtectedRoute>
                <DemoLayout><CoSupervisorDiscoveryPage /></DemoLayout>
              </ProtectedRoute>
            }
          />
      
      {/* Profile and Settings */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProfilePage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <DemoLayout><SettingsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Lab Management - All authenticated users */}
      <Route 
        path="/lab-management" 
        element={
          <ProtectedRoute>
            <DemoLayout><LabManagementPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Lab Notebook - All authenticated users */}
      <Route 
        path="/lab-notebook" 
        element={
          <ProtectedRoute>
            <DemoLayout><LabNotebookPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Protocols - All authenticated users */}
      <Route 
        path="/protocols" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProtocolsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Inventory - All authenticated users can view, researchers+ can manage */}
      <Route 
        path="/inventory" 
        element={
          <ProtectedRoute>
            <DemoLayout><InventoryPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Instruments - All authenticated users */}
      <Route 
        path="/instruments" 
        element={
          <ProtectedRoute>
            <DemoLayout><InstrumentsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Data Results - All authenticated users */}
      <Route 
        path="/data-results" 
        element={
          <ProtectedRoute>
            <DemoLayout><DataResultsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />

      {/* Research collaboration routes - All authenticated users */}
      <Route 
        path="/presentations" 
        element={
          <ProtectedRoute>
            <DemoLayout><AutomatedPresentationsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />

      {/* Resource Exchange - All authenticated users */}
      <Route 
        path="/resource-exchange" 
        element={
          <ProtectedRoute>
            <DemoLayout><ResourceExchangePage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/data-sharing" 
        element={
          <ProtectedRoute>
            <DemoLayout><GlobalDataSharingPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/help-forum" 
        element={
          <ProtectedRoute>
            <DemoLayout><HelpForumPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/conferences" 
        element={
          <ProtectedRoute>
            <DemoLayout><ConferenceNewsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Tools & Resources Routes - All authenticated users */}
      <Route 
        path="/calculator-hub" 
        element={
          <ProtectedRoute>
            <DemoLayout><CalculatorHubPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reference-library" 
        element={
          <ProtectedRoute>
            <DemoLayout><ReferenceLibraryPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/data-analysis" 
        element={
          <ProtectedRoute>
            <DemoLayout><DataAnalyticsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/data-analytics" 
        element={
          <ProtectedRoute>
            <DemoLayout><DataAnalyticsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/research-assistant" 
        element={
          <ProtectedRoute>
            <DemoLayout><ResearchAssistantPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/molecular-biology" 
        element={
          <ProtectedRoute>
            <DemoLayout><MolecularBiologyPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bioinformatics-tools" 
        element={
          <ProtectedRoute>
            <DemoLayout><BioinformaticsToolsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />

      {/* Quick Action Routes - All authenticated users */}
      <Route 
        path="/protocols/new" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProtocolsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/instruments/book" 
        element={
          <ProtectedRoute>
            <DemoLayout><InstrumentsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tasks/new" 
        element={
          <ProtectedRoute>
            <Navigate to="/lab-notebook" replace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/team" 
        element={
          <ProtectedRoute>
            <Navigate to="/lab-notebook" replace />
          </ProtectedRoute>
        } 
      />

      {/* Catch all route - redirect to login if not authenticated */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute fallbackPath="/login">
            <Navigate to="/lab-notebook" replace />
          </ProtectedRoute>
        } 
      />
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
