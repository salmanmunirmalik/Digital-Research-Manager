import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SideNav from './components/SideNav';
import ProtectedRoute from './components/ProtectedRoute';
import { getUserDisplayName, getRoleDisplayName } from './utils/roleAccess';

// Import all pages
import LabNotebookPage from './pages/LabNotebookPage';
import DashboardPage from './pages/DashboardPage';
import LabManagementPage from './pages/LabManagementPage';
import ProfessionalProtocolsPage from './pages/ProfessionalProtocolsPage'; // Professional protocols page with video support
import DataResultsPage from './pages/DataResultsPage'; // Includes global sharing tab
import ResearchDataBankPage from './pages/ResearchDataBankPage';
import HelpForumPage from './pages/HelpForumPage';
import ConferenceNewsPage from './pages/ConferenceNewsPage';
import ResearchToolsPage from './pages/ResearchToolsPage';
import MarketplacePage from './pages/MarketplacePage';
import ResearchAssistantPage from './pages/ResearchAssistantPage';
import NegativeResultsPage from './pages/NegativeResultsPage';
import ProjectManagementPage from './pages/ProjectManagementPage';
import PIReviewDashboardPage from './pages/PIReviewDashboardPage';
import CollaborationNetworkingPage from './pages/CollaborationNetworkingPage';
import EventsOpportunitiesPage from './pages/EventsOpportunitiesPage';
import ExperimentTrackerPage from './pages/ExperimentTrackerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SettingsPage from './pages/SettingsPage';
import ScientistPassportPage from './pages/ScientistPassportPage';
import ProfilePage from './pages/ProfilePage';
import CommunicationsHubPage from './pages/CommunicationsHubPage';
import CurrentTrendsPage from './pages/CurrentTrendsPage';
import ScienceForAllJournalPage from './pages/ScienceForAllJournalPage';

import BioinformaticsToolsPage from './pages/BioinformaticsToolsPage';
import MolecularBiologyPage from './pages/MolecularBiologyPage';
import DataAnalyticsPage from './pages/DataAnalyticsPage';
import LandingPage from './pages/LandingPage';
import TeamManagementPage from './pages/TeamManagementPage';

// Modern Layout Component with Quillbot-inspired design
const DemoLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };
    
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Layout Container - Merged Navigation */}
      <div className="flex">
        {/* Left Sidebar - Enhanced */}
        <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex-shrink-0 shadow-sm sticky top-0">
          <div className="h-full overflow-y-auto">
            <SideNav />
          </div>
        </aside>

        {/* Main Content Area with Top Navigation */}
        <div className="flex-1 flex flex-col">
          {/* Single Navigation Bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 shadow-sm sticky top-0 z-40">
            <div className="flex items-center justify-between">
              {/* Left spacer */}
              <div className="flex-1"></div>
              
              {/* Navigation Links - Centered */}
              <div className="flex items-center space-x-2">
                <Link 
                  to="/collaboration-networking" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  Networking
                </Link>
                <Link 
                  to="/events-opportunities" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Events & Opportunities
                </Link>
                <Link 
                  to="/research-databank" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  Data Bank
                </Link>
                <Link 
                  to="/marketplace" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  Marketplace
                </Link>
              </div>
              
              {/* Right spacer */}
              <div className="flex-1 flex justify-end items-center space-x-2">
                {/* User Menu Dropdown */}
                <div className="relative user-menu">
                  <button
                    data-testid="user-menu-toggle"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      data-testid="user-menu-dropdown"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      {/* Logout */}
                      <div className="py-1">
                        <button
                          data-testid="sign-out-button"
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
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>

          {/* Main Content Area */}
          <main className="flex-1 bg-gray-50 min-h-screen pt-16">
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
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="/tasks/new" element={<Navigate to="/dashboard" replace />} />
      <Route path="/team" element={<Navigate to="/dashboard" replace />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DemoLayout><DashboardPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
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
      
      {/* Protocols - All authenticated users */}
      <Route 
        path="/protocols" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProfessionalProtocolsPage /></DemoLayout>
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
      {/* Global Data Sharing - Now integrated into Data & Results */}
      <Route 
        path="/data-sharing" 
        element={
          <ProtectedRoute>
            <DemoLayout><DataResultsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/research-databank" 
        element={
          <ProtectedRoute>
            <DemoLayout><ResearchDataBankPage /></DemoLayout>
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
        path="/research-tools" 
        element={
          <ProtectedRoute>
            <DemoLayout><ResearchToolsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/supplier-marketplace" 
        element={
          <ProtectedRoute>
            <DemoLayout><MarketplacePage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/service-marketplace" 
        element={
          <ProtectedRoute>
            <DemoLayout><MarketplacePage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/marketplace" 
        element={
          <ProtectedRoute>
            <DemoLayout><MarketplacePage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/negative-results" 
        element={
          <ProtectedRoute>
            <DemoLayout><NegativeResultsPage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/paper-library" 
        element={
          <ProtectedRoute>
            <DemoLayout><ResearchAssistantPage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/project-management" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProjectManagementPage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/pi-review-dashboard" 
        element={
          <ProtectedRoute>
            <DemoLayout><PIReviewDashboardPage /></DemoLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/reference-library" 
        element={
          <ProtectedRoute>
            <DemoLayout><ResearchAssistantPage /></DemoLayout>
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
      {/* Profile - Academic Profile Page */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <DemoLayout><ProfilePage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      {/* My Scientific Passport - Redirects to Scientist Passport */}
      <Route 
        path="/my-portfolio" 
        element={
          <ProtectedRoute>
            <DemoLayout><ScientistPassportPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scientist-passport" 
        element={
          <ProtectedRoute>
            <DemoLayout><ScientistPassportPage /></DemoLayout>
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
      <Route 
        path="/communications" 
        element={
          <ProtectedRoute>
            <DemoLayout><CommunicationsHubPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/current-trends" 
        element={
          <ProtectedRoute>
            <DemoLayout><CurrentTrendsPage /></DemoLayout>
          </ProtectedRoute>
        } 
      />

      {/* Science For All Journal */}
      <Route 
        path="/journal" 
        element={
          <ProtectedRoute>
            <DemoLayout><ScienceForAllJournalPage /></DemoLayout>
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