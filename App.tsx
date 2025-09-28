import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SideNav from './components/SideNav';
import ProtectedRoute from './components/ProtectedRoute';
import { getUserDisplayName, getRoleDisplayName } from './utils/roleAccess';

// Import all pages
import LabNotebookPage from './pages/LabNotebookPage';
import LabManagementPage from './pages/LabManagementPage';
import ProtocolsPage from './pages/ProtocolsPage';
import DataResultsPage from './pages/DataResultsPage';
import AutomatedPresentationsPage from './pages/AutomatedPresentationsPage';
import GlobalDataSharingPage from './pages/GlobalDataSharingPage';
import HelpForumPage from './pages/HelpForumPage';
import ConferenceNewsPage from './pages/ConferenceNewsPage';
import CalculatorHubPage from './pages/CalculatorHubPage';
import ReferenceLibraryPage from './pages/ReferenceLibraryPage';
import SimplifiedResearcherPortfolioPage from './pages/SimplifiedResearcherPortfolioPage';
import MyPortfolioPage from './pages/MyPortfolioPage';
import CollaborationNetworkingPage from './pages/CollaborationNetworkingPage';
import EventsOpportunitiesPage from './pages/EventsOpportunitiesPage';
import ExperimentTrackerPage from './pages/ExperimentTrackerPage';
import ProfessionalProtocolsPage from './pages/ProfessionalProtocolsPage';

import ResearchAssistantPage from './pages/ResearchAssistantPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UnifiedProfilePage from './pages/UnifiedProfilePage';
import SettingsPage from './pages/SettingsPage';

import BioinformaticsToolsPage from './pages/BioinformaticsToolsPage';
import MolecularBiologyPage from './pages/MolecularBiologyPage';
import DataAnalyticsPage from './pages/DataAnalyticsPage';
import LandingPage from './pages/LandingPage';

// Modern Layout Component with Quillbot-inspired design
const DemoLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Layout Container - Merged Navigation */}
      <div className="flex">
        {/* Left Sidebar - Enhanced */}
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex-shrink-0 shadow-sm">
          <div className="h-full overflow-y-auto">
            <SideNav />
          </div>
        </aside>

        {/* Main Content Area with Top Navigation */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar with Brand and User */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Logo and Brand */}
              <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">DR</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Digital Research Manager</h1>
                  <p className="text-xs text-gray-500">Lab Platform</p>
                </div>
              </Link>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                <Link 
                  to="/my-portfolio" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  My Portfolio
                </Link>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl p-2 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
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
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-medium">
                              {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getUserDisplayName(user)}
                            </p>
                            <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role || 'student')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button 
                          onClick={() => {
                            setShowUserMenu(false);
                            window.location.href = '/my-portfolio';
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          My Portfolio
                        </button>
                        <button 
                          onClick={() => {
                            setShowUserMenu(false);
                            window.location.href = '/settings';
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-gray-100"></div>
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
                          <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
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
      
      {/* Redirects */}
      <Route path="/home" element={<Navigate to="/lab-notebook" replace />} />
      <Route path="/dashboard" element={<Navigate to="/lab-notebook" replace />} />
      <Route path="/tasks/new" element={<Navigate to="/lab-notebook" replace />} />
      <Route path="/team" element={<Navigate to="/lab-notebook" replace />} />
      
      {/* Protected routes */}
      <Route 
        path="/lab-notebook" 
        element={
          <ProtectedRoute>
            <DemoLayout><LabNotebookPage /></DemoLayout>
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
      
      
      {/* Experiment Tracker - All authenticated users */}
      <Route 
        path="/experiment-tracker" 
        element={
          <ProtectedRoute>
            <DemoLayout><ExperimentTrackerPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Professional Protocols - All authenticated users */}
      <Route 
        path="/professional-protocols" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProfessionalProtocolsPage /></DemoLayout>
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

      {/* Collaboration Routes */}
      <Route 
        path="/collaboration-networking" 
        element={
          <ProtectedRoute>
            <DemoLayout><CollaborationNetworkingPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events-opportunities" 
        element={
          <ProtectedRoute>
            <DemoLayout><EventsOpportunitiesPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />

      {/* Profile and Settings Routes */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <DemoLayout><UnifiedProfilePage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-portfolio" 
        element={
          <ProtectedRoute>
            <DemoLayout><MyPortfolioPage /></DemoLayout>
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

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/lab-notebook" replace />} />
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