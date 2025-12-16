/**
 * Paper Library Page
 * Implements Salman's vision: Auto-fetch papers by DOI/ORCID
 * Save full paper OR AI summary
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  SearchIcon,
  PlusIcon,
  BookOpenIcon,
  XMarkIcon,
  DownloadIcon,
  StarIcon,
  TagIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  LinkIcon,
  BeakerIcon
} from '../components/icons';
import RecommendationsWidget from '../components/RecommendationsWidget';

interface Paper {
  id?: string;
  doi?: string;
  pmid?: string;
  arxiv_id?: string;
  title: string;
  authors: any[];
  abstract?: string;
  journal?: string;
  year: number;
  citation_count?: number;
  url?: string;
  pdf_url?: string;
  save_type?: string;
  ai_summary?: string;
  ai_key_findings?: string[];
  my_notes?: string;
  tags?: string[];
  is_favorite?: boolean;
  read_status?: string;
  folder?: string;
}

const PaperLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'library' | 'add-paper'>('library');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add paper states
  const [identifier, setIdentifier] = useState('');
  const [fetchedPaper, setFetchedPaper] = useState<Paper | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saveType, setSaveType] = useState<'full' | 'summary_only' | 'both'>('full');
  const [myNotes, setMyNotes] = useState('');
  const [tags, setTags] = useState('');
  const [folder, setFolder] = useState('');
  
  // ORCID import
  const [showOrcidImport, setShowOrcidImport] = useState(false);
  const [orcidId, setOrcidId] = useState('');

  useEffect(() => {
    if (view === 'library') {
      fetchMyPapers();
    }
  }, [view]);

  const fetchMyPapers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/papers/my-papers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setPapers(response.data);
      } else {
        setPapers([]);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPaper = async () => {
    if (!identifier.trim()) {
      alert('Please enter a DOI, PMID, or arXiv ID');
      return;
    }

    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/papers/fetch', 
        { identifier: identifier.trim() },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setFetchedPaper(response.data);
    } catch (error: any) {
      console.error('Error fetching paper:', error);
      alert(error.response?.data?.error || 'Failed to fetch paper');
    } finally {
      setFetching(false);
    }
  };

  const handleSavePaper = async () => {
    if (!fetchedPaper) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/papers/save-paper', {
        paper: fetchedPaper,
        save_type: saveType,
        my_notes: myNotes || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        folder: folder || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Paper saved to your library!');
      setView('library');
      setFetchedPaper(null);
      setIdentifier('');
      setMyNotes('');
      setTags('');
      setFolder('');
      fetchMyPapers();
    } catch (error) {
      console.error('Error saving paper:', error);
      alert('Failed to save paper');
    }
  };

  const handleOrcidImport = async () => {
    if (!orcidId.trim()) {
      alert('Please enter an ORCID ID');
      return;
    }

    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/papers/fetch-by-orcid',
        { orcid: orcidId.trim() },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert(`✅ Found ${response.data.count} papers! You can now save them to your library.`);
      // In full implementation, would show list of papers to selectively save
      setShowOrcidImport(false);
    } catch (error: any) {
      console.error('Error fetching by ORCID:', error);
      alert('Failed to fetch papers from ORCID');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paper Library</h1>
              <p className="text-gray-600 mt-1">Auto-fetch papers by DOI/ORCID · Save full paper or AI summary</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowOrcidImport(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span>Import from ORCID</span>
              </button>
              <button
                onClick={() => setView('add-paper')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Paper</span>
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="mt-6 flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setView('library')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Library
            </button>
            <button
              onClick={() => setView('add-paper')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'add-paper'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Add Paper
            </button>
          </div>
        </div>

        {/* Library View */}
        {view === 'library' && (
          <div>
            {/* Recommended Papers Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <RecommendationsWidget
                itemType="papers"
                title="Papers You Might Like"
                limit={10}
                showFeedback={true}
                className="mb-6"
              />
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your library...</p>
              </div>
            ) : papers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your library is empty</h3>
                <p className="text-gray-600 mb-4">
                  Start building your personal research library by adding papers via DOI, PMID, or arXiv ID
                </p>
                <button
                  onClick={() => setView('add-paper')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Your First Paper
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div key={paper.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{paper.title}</h3>
                        
                        <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
                          {paper.authors && paper.authors.length > 0 && (
                            <span>
                              {paper.authors[0].firstName} {paper.authors[0].lastName}
                              {paper.authors.length > 1 && ` et al.`}
                            </span>
                          )}
                          {paper.journal && <span>• {paper.journal}</span>}
                          {paper.year && <span>• {paper.year}</span>}
                        </div>

                        {paper.ai_summary && (
                          <div className="bg-purple-50 border-l-4 border-purple-400 p-3 mb-3">
                            <div className="flex items-start space-x-2">
                              <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-xs font-medium text-purple-800 mb-1">AI Summary</div>
                                <p className="text-sm text-gray-700 line-clamp-2">{paper.ai_summary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {paper.tags && paper.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {paper.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {paper.save_type && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              Saved: {paper.save_type.replace('_', ' ')}
                            </span>
                          )}
                          {paper.read_status && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              {paper.read_status.replace('_', ' ')}
                            </span>
                          )}
                          {paper.is_favorite && (
                            <StarIcon className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>View</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Paper View */}
        {view === 'add-paper' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add Paper to Library</h2>
              
              {/* Fetch Paper Section */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter DOI, PMID, or arXiv ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g., 10.1038/nature12373 or PMID:23722158"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleFetchPaper()}
                    />
                    <button
                      onClick={handleFetchPaper}
                      disabled={fetching}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {fetching ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <>
                          <SearchIcon className="w-5 h-5" />
                          <span>Fetch</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports DOI, PMID, and arXiv ID - automatically fetches from CrossRef, PubMed, or arXiv
                  </p>
                </div>

                {/* Fetched Paper Display */}
                {fetchedPaper && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{fetchedPaper.title}</h3>
                        <div className="text-sm text-gray-600">
                          {fetchedPaper.authors && fetchedPaper.authors.length > 0 && (
                            <span>
                              {fetchedPaper.authors.slice(0, 3).map((a: any) => `${a.firstName} ${a.lastName}`).join(', ')}
                              {fetchedPaper.authors.length > 3 && ` et al.`}
                            </span>
                          )}
                          {fetchedPaper.journal && ` · ${fetchedPaper.journal}`}
                          {fetchedPaper.year && ` · ${fetchedPaper.year}`}
                        </div>
                      </div>
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>

                    {fetchedPaper.abstract && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">{fetchedPaper.abstract}</p>
                    )}

                    {/* Save Options - Salman's Feature! */}
                    <div className="border-t border-green-200 pt-4 mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💾 How do you want to save this? (Salman's Feature!)
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="full"
                            checked={saveType === 'full'}
                            onChange={(e) => setSaveType(e.target.value as any)}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Save full paper (complete metadata & abstract)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="summary_only"
                            checked={saveType === 'summary_only'}
                            onChange={(e) => setSaveType(e.target.value as any)}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Save AI summary only (when AI integrated)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="both"
                            checked={saveType === 'both'}
                            onChange={(e) => setSaveType(e.target.value as any)}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Save both full paper & AI summary</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Folder (optional)</label>
                          <input
                            type="text"
                            value={folder}
                            onChange={(e) => setFolder(e.target.value)}
                            placeholder="e.g., Gene Therapy"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., CRISPR, review"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs text-gray-600 mb-1">My Notes (optional)</label>
                        <textarea
                          value={myNotes}
                          onChange={(e) => setMyNotes(e.target.value)}
                          placeholder="Add personal notes about this paper..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          rows={2}
                        />
                      </div>

                      <button
                        onClick={handleSavePaper}
                        className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center space-x-2"
                      >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Save to Library</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ORCID Import Modal */}
      {showOrcidImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Papers from ORCID</h3>
              <button onClick={() => setShowOrcidImport(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ORCID ID
                </label>
                <input
                  type="text"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="e.g., 0000-0002-1825-0097"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically fetches all your publications from ORCID
                </p>
              </div>

              <button
                onClick={handleOrcidImport}
                disabled={fetching}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {fetching ? 'Fetching...' : 'Import All Papers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperLibraryPage;

