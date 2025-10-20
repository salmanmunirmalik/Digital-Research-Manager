/**
 * Negative Results Database Page
 * REVOLUTIONARY FEATURE: Document and share failed experiments
 * Give researchers credit for transparency and save community time/money
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  SearchIcon,
  BeakerIcon,
  PlusIcon,
  XMarkIcon,
  ThumbsUpIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  LightbulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  HeartIcon,
  FireIcon,
  StarIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ShareIcon
} from '../components/icons';

interface NegativeResult {
  id: string;
  researcher_id: string;
  experiment_title: string;
  research_field: string;
  keywords: string[];
  original_hypothesis: string;
  expected_outcome: string;
  actual_outcome: string;
  failure_type: string;
  primary_reason: string;
  lessons_learned: string;
  recommendations_for_others: string;
  reproduction_attempts: number;
  estimated_cost_usd: number;
  time_spent_hours: number;
  helpful_votes: number;
  saved_someone_votes: number;
  citation_count: number;
  views_count: number;
  experiment_date: string;
  created_at: string;
  display_name: string;
  current_institution: string;
  lab_name?: string;
}

const NegativeResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'browse' | 'my-submissions' | 'saved' | 'leaderboard'>('browse');
  const [negativeResults, setNegativeResults] = useState<NegativeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'citations' | 'impact'>('recent');
  
  // Modals
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedResult, setSelectedResult] = useState<NegativeResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (view === 'browse') {
      fetchNegativeResults();
    } else if (view === 'my-submissions') {
      fetchMySubmissions();
    }
  }, [view, sortBy]);

  const fetchNegativeResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params: any = { sort_by: sortBy };
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axios.get('/api/negative-results', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setNegativeResults(response.data);
      } else {
        console.error('API returned non-array:', response.data);
        setNegativeResults([]);
      }
    } catch (error) {
      console.error('Error fetching negative results:', error);
      setNegativeResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/negative-results/my/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setNegativeResults(response.data);
      } else {
        console.error('API returned non-array:', response.data);
        setNegativeResults([]);
      }
    } catch (error) {
      console.error('Error fetching my submissions:', error);
      setNegativeResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteHelpful = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/negative-results/${id}/vote-helpful`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the vote count locally
      setNegativeResults(negativeResults.map(nr =>
        nr.id === id ? { ...nr, helpful_votes: nr.helpful_votes + 1 } : nr
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSavedMe = async (id: string) => {
    const hours = prompt('How many hours did this save you? (estimate)');
    const cost = prompt('Estimated cost saved in USD? (optional)');
    
    if (hours) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`/api/negative-results/${id}/vote-saved-me`, {
          estimated_time_saved_hours: parseFloat(hours),
          estimated_cost_saved_usd: cost ? parseFloat(cost) : 0
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setNegativeResults(negativeResults.map(nr =>
          nr.id === id ? { ...nr, saved_someone_votes: nr.saved_someone_votes + 1 } : nr
        ));
        
        alert('Thank you for sharing the impact! This helps build transparency reputation.');
      } catch (error) {
        console.error('Error voting saved me:', error);
      }
    }
  };

  const handleViewDetail = (result: NegativeResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FireIcon className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">Negative Results Database</h1>
                </div>
                <p className="text-white/90 text-lg">
                  🚀 Revolutionary: Get credit for failed experiments & save others time and money!
                </p>
                <p className="text-white/80 text-sm mt-2">
                  The first platform to value transparency. Your failures help accelerate science.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitForm(true)}
                className="px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-gray-50 font-semibold transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Share a Failed Experiment</span>
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex space-x-2 border-b border-gray-200 px-4">
              <button
                onClick={() => setView('browse')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  view === 'browse'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Browse All
              </button>
              <button
                onClick={() => setView('my-submissions')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  view === 'my-submissions'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Submissions
              </button>
              <button
                onClick={() => setView('saved')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  view === 'saved'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Saved
              </button>
              <button
                onClick={() => setView('leaderboard')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  view === 'leaderboard'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🏆 Transparency Champions
              </button>
            </div>

            {/* Filters */}
            {view === 'browse' && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search failed experiments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchNegativeResults()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="helpful">Most Helpful</option>
                      <option value="citations">Most Cited</option>
                      <option value="impact">Biggest Impact</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {view === 'browse' || view === 'my-submissions' ? (
          loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading negative results...</p>
            </div>
          ) : negativeResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {view === 'my-submissions' ? 'You haven\'t shared any failed experiments yet' : 'No negative results found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {view === 'my-submissions' 
                  ? 'Be a transparency champion! Share your failed experiments to help the community.'
                  : 'Try adjusting your search or be the first to contribute!'}
              </p>
              <button
                onClick={() => setShowSubmitForm(true)}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Share Your First Failed Experiment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {negativeResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {result.experiment_title}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <UserIcon className="w-4 h-4" />
                            <span>{result.display_name}</span>
                          </div>
                          {result.current_institution && (
                            <span>{result.current_institution}</span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {result.research_field}
                          </span>
                        </div>
                      </div>
                      
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {result.failure_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Hypothesis vs Outcome */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-blue-700 mb-1">Expected</div>
                        <p className="text-sm text-gray-700 line-clamp-2">{result.expected_outcome}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-red-700 mb-1">What Happened</div>
                        <p className="text-sm text-gray-700 line-clamp-2">{result.actual_outcome}</p>
                      </div>
                    </div>

                    {/* Lessons Learned */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <LightbulbIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-yellow-800 mb-1">Lessons Learned</div>
                          <p className="text-sm text-gray-700 line-clamp-2">{result.lessons_learned}</p>
                        </div>
                      </div>
                    </div>

                    {/* Impact Metrics */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-lg font-bold text-gray-900">{result.helpful_votes}</div>
                        <div className="text-xs text-gray-600">Helpful</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <div className="text-lg font-bold text-green-700">{result.saved_someone_votes}</div>
                        <div className="text-xs text-gray-600">Saved $</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded text-center">
                        <div className="text-lg font-bold text-purple-700">{result.citation_count}</div>
                        <div className="text-xs text-gray-600">Citations</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <div className="text-lg font-bold text-blue-700">{result.reproduction_attempts}</div>
                        <div className="text-xs text-gray-600">Attempts</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded text-center">
                        <div className="text-lg font-bold text-orange-700">${result.estimated_cost_usd || 0}</div>
                        <div className="text-xs text-gray-600">Cost</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleVoteHelpful(result.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ThumbsUpIcon className="w-4 h-4" />
                          <span>Helpful</span>
                        </button>
                        <button
                          onClick={() => handleSavedMe(result.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <HeartIcon className="w-4 h-4" />
                          <span>Saved Me $</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                          <BookmarkIcon className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleViewDetail(result)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : view === 'saved' ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookmarkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Saved Negative Results</h3>
            <p className="text-gray-600">Coming soon: Access your saved failed experiments for reference</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Transparency Champions Leaderboard</h3>
            <p className="text-gray-600">Coming soon: Top contributors who share negative results</p>
          </div>
        )}
      </div>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <SubmitNegativeResultModal
          onClose={() => setShowSubmitForm(false)}
          onSuccess={() => {
            setShowSubmitForm(false);
            if (view === 'my-submissions') fetchMySubmissions();
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedResult && (
        <NegativeResultDetailModal
          result={selectedResult}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

// Submit Negative Result Modal
const SubmitNegativeResultModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    experiment_title: '',
    research_field: '',
    keywords: '',
    original_hypothesis: '',
    expected_outcome: '',
    actual_outcome: '',
    failure_type: 'no_effect',
    primary_reason: '',
    lessons_learned: '',
    recommendations_for_others: '',
    methodology_description: '',
    reproduction_attempts: 1,
    estimated_cost_usd: 0,
    time_spent_hours: 0,
    sharing_status: 'public',
    is_publicly_searchable: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        research_domain: [formData.research_field]
      };
      
      await axios.post('/api/negative-results', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('🎉 Thank you for contributing to scientific transparency!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting negative result:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share a Failed Experiment</h2>
            <p className="text-sm text-gray-600 mt-1">Help others avoid repeating your failures - get credit for transparency!</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Title *
            </label>
            <input
              type="text"
              required
              value={formData.experiment_title}
              onChange={(e) => setFormData({ ...formData, experiment_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Attempted CRISPR knockout of gene X in cell line Y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Field *
              </label>
              <input
                type="text"
                required
                value={formData.research_field}
                onChange={(e) => setFormData({ ...formData, research_field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Molecular Biology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., CRISPR, knockout, cell culture"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Hypothesis *
            </label>
            <textarea
              required
              value={formData.original_hypothesis}
              onChange={(e) => setFormData({ ...formData, original_hypothesis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={2}
              placeholder="What did you expect to happen?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Outcome *
              </label>
              <textarea
                required
                value={formData.expected_outcome}
                onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Outcome *
              </label>
              <textarea
                required
                value={formData.actual_outcome}
                onChange={(e) => setFormData({ ...formData, actual_outcome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Failure Type *
              </label>
              <select
                required
                value={formData.failure_type}
                onChange={(e) => setFormData({ ...formData, failure_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="no_effect">No Effect Observed</option>
                <option value="opposite_effect">Opposite Effect</option>
                <option value="inconclusive">Inconclusive Results</option>
                <option value="technical_failure">Technical Failure</option>
                <option value="contamination">Contamination</option>
                <option value="unexpected_interaction">Unexpected Interaction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attempts
              </label>
              <input
                type="number"
                min="1"
                value={formData.reproduction_attempts}
                onChange={(e) => setFormData({ ...formData, reproduction_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Reason for Failure *
            </label>
            <textarea
              required
              value={formData.primary_reason}
              onChange={(e) => setFormData({ ...formData, primary_reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lessons Learned * (Most Important!)
            </label>
            <textarea
              required
              value={formData.lessons_learned}
              onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="What did you learn? What would you do differently?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations for Others *
            </label>
            <textarea
              required
              value={formData.recommendations_for_others}
              onChange={(e) => setFormData({ ...formData, recommendations_for_others: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Advice for researchers attempting similar experiments..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost (USD)
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimated_cost_usd}
                onChange={(e) => setFormData({ ...formData, estimated_cost_usd: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent (hours)
              </label>
              <input
                type="number"
                min="0"
                value={formData.time_spent_hours}
                onChange={(e) => setFormData({ ...formData, time_spent_hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              Share & Build Transparency Rep
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Detail Modal (simplified version)
const NegativeResultDetailModal: React.FC<{
  result: NegativeResult;
  onClose: () => void;
}> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 my-8">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{result.experiment_title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Original Hypothesis</h3>
              <p className="text-gray-700">{result.original_hypothesis}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Expected Outcome</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700">{result.expected_outcome}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Actual Outcome</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-gray-700">{result.actual_outcome}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Primary Reason for Failure</h3>
              <p className="text-gray-700">{result.primary_reason}</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center space-x-2">
                <LightbulbIcon className="w-5 h-5" />
                <span>Lessons Learned</span>
              </h3>
              <p className="text-gray-700">{result.lessons_learned}</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <h3 className="font-semibold text-green-900 mb-2">Recommendations for Others</h3>
              <p className="text-gray-700">{result.recommendations_for_others}</p>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{result.helpful_votes}</div>
                <div className="text-sm text-gray-600">Helpful Votes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.saved_someone_votes}</div>
                <div className="text-sm text-gray-600">Saved Others</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{result.citation_count}</div>
                <div className="text-sm text-gray-600">Citations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.views_count}</div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NegativeResultsPage;

