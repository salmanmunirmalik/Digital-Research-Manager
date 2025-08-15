
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SideNav from './components/SideNav';

// Import all pages
import DashboardPage from './pages/DashboardPage';
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
import ReferenceLibraryPage from './pages/ReferenceLibraryPage';
import UnitConverterPage from './pages/UnitConverterPage';
import DataAnalysisPage from './pages/DataAnalysisPage';
import ResearchAssistantPage from './pages/ResearchAssistantPage';

// Demo Layout Component (temporary for demo)
const DemoLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
                <span className="text-white text-sm font-medium">DR</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Demo User</p>
                <p className="text-xs text-gray-500">Demo Mode</p>
              </div>
            </div>
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
  return (
    <Routes>
      {/* Temporarily bypass auth - redirect all routes to dashboard for demo */}
      <Route path="/" element={<DemoLayout><DashboardPage /></DemoLayout>} />
      <Route path="/login" element={<DemoLayout><DashboardPage /></DemoLayout>} />
      <Route path="/register" element={<DemoLayout><DashboardPage /></DemoLayout>} />
      <Route path="/dashboard" element={<DemoLayout><DashboardPage /></DemoLayout>} />
      
      <Route path="/home" element={<DemoLayout><DashboardPage /></DemoLayout>} />
      <Route path="/lab-management" element={<DemoLayout><LabManagementPage /></DemoLayout>} />
      <Route path="/lab-notebook" element={<DemoLayout><LabNotebookPage /></DemoLayout>} />
      <Route path="/protocols" element={<DemoLayout><ProtocolsPage /></DemoLayout>} />
      <Route path="/inventory" element={<DemoLayout><InventoryPage /></DemoLayout>} />
      <Route path="/instruments" element={<DemoLayout><InstrumentsPage /></DemoLayout>} />
      <Route path="/research-intelligence" element={<DemoLayout><ResearchIntelligenceHub /></DemoLayout>} />

      <Route path="/presentations" element={<DemoLayout><AutomatedPresentationsPage /></DemoLayout>} />
      <Route path="/data-sharing" element={<DemoLayout><GlobalDataSharingPage /></DemoLayout>} />
      <Route path="/help-forum" element={<DemoLayout><HelpForumPage /></DemoLayout>} />
      <Route path="/conferences" element={<DemoLayout><ConferenceNewsPage /></DemoLayout>} />
      
      {/* Tools & Resources Routes */}
      <Route path="/calculator-hub" element={<DemoLayout><CalculatorHubPage /></DemoLayout>} />
      <Route path="/reference-library" element={<DemoLayout><ReferenceLibraryPage /></DemoLayout>} />
      <Route path="/unit-converter" element={<DemoLayout><UnitConverterPage /></DemoLayout>} />
      <Route path="/data-analysis" element={<DemoLayout><DataAnalysisPage /></DemoLayout>} />
      <Route path="/research-assistant" element={<DemoLayout><ResearchAssistantPage /></DemoLayout>} />

      {/* Quick Action Routes */}
      <Route path="/notebook" element={<DemoLayout><LabNotebookPage /></DemoLayout>} />
      <Route path="/notebook/new" element={<DemoLayout><LabNotebookPage /></DemoLayout>} />
      <Route path="/protocols/new" element={<DemoLayout><ProtocolsPage /></DemoLayout>} />
      <Route path="/instruments/book" element={<DemoLayout><InstrumentsPage /></DemoLayout>} />
      <Route path="/tasks/new" element={<DemoLayout><DashboardPage /></DemoLayout>} />
      <Route path="/team" element={<DemoLayout><DashboardPage /></DemoLayout>} />

      {/* Catch all route */}
      <Route path="*" element={<DemoLayout><DashboardPage /></DemoLayout>} />
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
