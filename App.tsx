
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './components/SideNav';
import HomePage from './pages/HomePage';
import ProtocolsPage from './pages/ProtocolsPage';
import ProtocolDetailPage from './pages/ProtocolDetailPage';
import CalculatorHubPage from './pages/CalculatorHubPage';
import NotebookPage from './pages/NotebookPage';
import HelpPage from './pages/HelpPage';
import InventoryPage from './pages/InventoryPage';
import InstrumentsPage from './pages/InstrumentsPage';
import DataPage from './pages/DataPage';
import TeamPage from './pages/TeamPage';
import HelpForumPage from './pages/HelpForumPage';
import GlobalDataSharingPage from './pages/GlobalDataSharingPage';
import ResearchIntelligenceHub from './pages/ResearchIntelligenceHub';
import ConferenceNewsPage from './pages/ConferenceNewsPage';
import { Project, ResultEntry, Protocol } from './types';
import { mockNotebookProjects } from './data/mockNotebookData';

import { mockResults as initialMockResults } from './data/mockResultsData';
import { mockProtocols as initialMockProtocols } from './data/mockData';
import ProtocolFormPage from './pages/ProtocolFormPage';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(mockNotebookProjects);
  const [results, setResults] = useState<ResultEntry[]>(initialMockResults);
  const [protocols, setProtocols] = useState<Protocol[]>(initialMockProtocols);

  const handleUpdateProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
  };
  
  const handleAddResult = (newResult: ResultEntry) => {
    setResults(prevResults => [newResult, ...prevResults]);
  };
  
  const handleUpdateResult = (updatedResult: ResultEntry) => {
    setResults(prevResults => prevResults.map(r => r.id === updatedResult.id ? updatedResult : r));
  };

  const handleUpdateProtocols = (updatedProtocols: Protocol[]) => {
    setProtocols(updatedProtocols);
  };


  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-100 font-sans">
        <SideNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/protocols" element={<ProtocolsPage protocols={protocols} onUpdateProtocols={handleUpdateProtocols} />} />
            <Route path="/protocols/new" element={<ProtocolFormPage protocols={protocols} onSave={handleUpdateProtocols} />} />
            <Route path="/protocols/:protocolId/edit" element={<ProtocolFormPage protocols={protocols} onSave={handleUpdateProtocols} />} />
            <Route path="/protocols/:protocolId" element={<ProtocolDetailPage protocols={protocols} />} />
            <Route 
              path="/notebook" 
              element={<NotebookPage 
                projects={projects} 
                onUpdateProjects={handleUpdateProjects}
                onAddResult={handleAddResult}
              />} 
            />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/instruments" element={<InstrumentsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/data" element={<DataPage results={results} onUpdateResult={handleUpdateResult} />} />
            <Route path="/calculators" element={<CalculatorHubPage />} />
            <Route path="/help" element={<HelpPage />} />
                    <Route path="/help-forum" element={<HelpForumPage />} />
        <Route path="/data-sharing" element={<GlobalDataSharingPage />} />
        <Route path="/research-intelligence" element={<ResearchIntelligenceHub />} />
        <Route path="/conferences" element={<ConferenceNewsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
