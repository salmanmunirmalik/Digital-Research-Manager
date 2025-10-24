import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  HeartIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  AcademicCapIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Article {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  research_domain: string;
  article_type: string;
  review_status: string;
  publication_date?: string;
  views_count: number;
  downloads_count: number;
  citations_count: number;
  likes_count: number;
  submitted_date: string;
  created_at: string;
}

const ScienceForAllJournalPage: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());
  const [impactPoints, setImpactPoints] = useState({ total_points: 0, total_contributions: 0, recent_contributions: [] });
  const [badges, setBadges] = useState<any[]>([]);

  // Form state
  const [submissionForm, setSubmissionForm] = useState({
    title: '',
    abstract: '',
    authors: '',
    keywords: '',
    research_domain: '',
    article_type: 'research_article',
    full_text: '',
    manuscript_url: ''
  });

  // Volunteer form state
  const [volunteerForm, setVolunteerForm] = useState({
    role: 'reviewer',
    specialization: '',
    educational_background: '',
    research_experience_years: '',
    previous_journal_experience: ''
  });

  useEffect(() => {
    fetchArticles();
    fetchImpactPoints();
    fetchBadges();
  }, []);

  const fetchImpactPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/scientist-first/impact-points', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImpactPoints(response.data);
    } catch (error) {
      console.error('Error fetching impact points:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/scientist-first/badges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadges(response.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const handleVolunteerRegistration = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/scientist-first/volunteers/register', volunteerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowVolunteerModal(false);
      setVolunteerForm({
        role: 'reviewer',
        specialization: '',
        educational_background: '',
        research_experience_years: '',
        previous_journal_experience: ''
      });
      alert('Successfully registered as volunteer!');
    } catch (error) {
      console.error('Error registering volunteer:', error);
      alert('Error registering as volunteer');
    }
  };

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/scientist-first/articles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure response.data is an array
      const articlesData = Array.isArray(response.data) ? response.data : [];
      setArticles(articlesData);
      
      // Fetch liked articles
      try {
        const likesResponse = await axios.get('/api/scientist-first/likes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Handle different response formats
        const likesData = Array.isArray(likesResponse.data) ? likesResponse.data : [];
        setLikedArticles(new Set(likesData.map((l: any) => l.article_id)));
      } catch (likesError) {
        console.error('Error fetching likes:', likesError);
        setLikedArticles(new Set());
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Use mock data for demonstration
      setArticles(mockArticles);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitArticle = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/scientist-first/articles', {
        title: submissionForm.title,
        abstract: submissionForm.abstract,
        authors: submissionForm.authors.split(',').map(a => a.trim()),
        keywords: submissionForm.keywords.split(',').map(k => k.trim()),
        research_domain: submissionForm.research_domain,
        article_type: submissionForm.article_type,
        full_text: submissionForm.full_text,
        manuscript_url: submissionForm.manuscript_url
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowSubmitModal(false);
      setSubmissionForm({
        title: '',
        abstract: '',
        authors: '',
        keywords: '',
        research_domain: '',
        article_type: 'research_article',
        full_text: '',
        manuscript_url: ''
      });
      fetchArticles();
    } catch (error) {
      console.error('Error submitting article:', error);
      alert('Error submitting article');
    }
  };

  const handleLike = async (articleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const isLiked = likedArticles.has(articleId);
      
      if (isLiked) {
        await axios.delete(`/api/scientist-first/likes/${articleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/scientist-first/likes', {
          article_id: articleId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      fetchArticles();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.abstract.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = filterDomain === 'all' || article.research_domain === filterDomain;
    const matchesType = filterType === 'all' || article.article_type === filterType;
    const matchesStatus = filterStatus === 'all' || article.review_status === filterStatus;
    
    return matchesSearch && matchesDomain && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      'submitted': { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon, label: 'Submitted' },
      'under_review': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: EyeIcon, label: 'Under Review' },
      'revision_requested': { bg: 'bg-orange-100', text: 'text-orange-800', icon: DocumentTextIcon, label: 'Revision' },
      'accepted': { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircleIcon, label: 'Accepted' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon, label: 'Rejected' },
      'published': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Published' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.submitted;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading journal articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50/20 to-orange-50/20">
      {/* Header */}
      <div className="bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/20 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpenIcon className="w-9 h-9 text-yellow-400" />
              </div>
            </div>
            
            {/* Title and Tagline */}
            <div className="mb-6">
              <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">Science For All Journal</h1>
              <p className="text-xl text-gray-600 font-medium">Community-Powered • Open Access • Zero Cost</p>
            </div>
            
            {/* Mission Statement */}
            <p className="text-gray-700 mb-8 text-lg leading-relaxed max-w-3xl">
              Break down barriers. Share knowledge freely. Advance humanity together. Science belongs to everyone.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-8 py-3.5 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-all font-semibold shadow-md hover:shadow-lg text-base"
              >
                Submit Article
              </button>
              <button
                onClick={() => setShowVolunteerModal(true)}
                className="px-8 py-3.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold shadow-md hover:shadow-lg text-base"
              >
                Join the Movement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600">{articles.length}</div>
              <div className="text-sm text-gray-600 mt-1">Articles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {articles.filter(a => a.review_status === 'published').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Published</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">
                {articles.reduce((sum, a) => sum + a.views_count, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Views</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {articles.reduce((sum, a) => sum + a.likes_count, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Likes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Submit Article</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Research Domain</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
              >
                <option value="all">All Domains</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
                <option value="physics">Physics</option>
                <option value="medicine">Medicine</option>
                <option value="bioinformatics">Bioinformatics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Article Type</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="research_article">Research Article</option>
                <option value="review">Review</option>
                <option value="case_study">Case Study</option>
                <option value="method">Method</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="accepted">Accepted</option>
                <option value="under_review">Under Review</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors">
                      {article.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1" />
                        {article.authors.join(', ')}
                      </span>
                      {article.publication_date && (
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(article.publication_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(article.review_status)}
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{article.abstract}</p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.map((keyword, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        <TagIcon className="w-3 h-3 mr-1" />
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center cursor-pointer hover:text-indigo-600 transition-colors">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {article.views_count}
                    </span>
                    <button
                      onClick={() => handleLike(article.id)}
                      className={`flex items-center transition-colors ${
                        likedArticles.has(article.id) ? 'text-red-600' : 'hover:text-red-600'
                      }`}
                    >
                      {likedArticles.has(article.id) ? (
                        <HeartIconSolid className="w-4 h-4 mr-1" />
                      ) : (
                        <HeartIcon className="w-4 h-4 mr-1" />
                      )}
                      {article.likes_count}
                    </button>
                    <span className="flex items-center">
                      <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                      {article.downloads_count}
                    </span>
                    <span className="flex items-center">
                      <SparklesIcon className="w-4 h-4 mr-1" />
                      {article.citations_count}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <BookOpenIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Submit First Article
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Article Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Article to Science For All Journal</h2>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    value={submissionForm.title}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                    placeholder="Article title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Authors *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    value={submissionForm.authors}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, authors: e.target.value })}
                    placeholder="Comma-separated author names"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Abstract *</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    rows={4}
                    value={submissionForm.abstract}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, abstract: e.target.value })}
                    placeholder="Article abstract"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Research Domain</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                      value={submissionForm.research_domain}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, research_domain: e.target.value })}
                    >
                      <option value="">Select domain</option>
                      <option value="biology">Biology</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="physics">Physics</option>
                      <option value="medicine">Medicine</option>
                      <option value="bioinformatics">Bioinformatics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Article Type</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                      value={submissionForm.article_type}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, article_type: e.target.value })}
                    >
                      <option value="research_article">Research Article</option>
                      <option value="review">Review</option>
                      <option value="case_study">Case Study</option>
                      <option value="method">Method</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    value={submissionForm.keywords}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, keywords: e.target.value })}
                    placeholder="Comma-separated keywords"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Text</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    rows={8}
                    value={submissionForm.full_text}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, full_text: e.target.value })}
                    placeholder="Article full text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Manuscript URL</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    value={submissionForm.manuscript_url}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, manuscript_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitArticle}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Submit Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Registration Modal */}
      {showVolunteerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Join Science For All Journal</h2>
                <button
                  onClick={() => setShowVolunteerModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Volunteer Role *</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    value={volunteerForm.role}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, role: e.target.value })}
                  >
                    <option value="reviewer">Reviewer (Peer Review)</option>
                    <option value="editor">Editor (Content Review)</option>
                    <option value="proofreader">Proofreader (Language & Grammar)</option>
                    <option value="layout_designer">Layout Designer (Formatting)</option>
                    <option value="translator">Translator (Multi-language)</option>
                    <option value="mentor">Mentor (Author Support)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Areas of Specialization</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    value={volunteerForm.specialization}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, specialization: e.target.value })}
                    placeholder="e.g., Molecular Biology, Bioinformatics, Chemistry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Educational Background</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    rows={3}
                    value={volunteerForm.educational_background}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, educational_background: e.target.value })}
                    placeholder="e.g., Ph.D. in Biology, Master's in Computer Science"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Research Experience</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                      value={volunteerForm.research_experience_years}
                      onChange={(e) => setVolunteerForm({ ...volunteerForm, research_experience_years: e.target.value })}
                      placeholder="e.g., 5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Previous Journal Experience</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                      value={volunteerForm.previous_journal_experience}
                      onChange={(e) => setVolunteerForm({ ...volunteerForm, previous_journal_experience: e.target.value })}
                      placeholder="e.g., Reviewer for Nature, Editor for PLoS ONE"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                  <div className="flex items-start space-x-2">
                    <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-purple-900 mb-1">Benefits of Volunteering</div>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• Earn Impact Points for your contributions</li>
                        <li>• Receive recognition badges (Bronze, Silver, Gold, Platinum)</li>
                        <li>• Build your scientific reputation</li>
                        <li>• Support open science and knowledge democratization</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowVolunteerModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVolunteerRegistration}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Join the Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock data for demonstration
const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Novel Approaches to CRISPR-Cas9 Gene Editing in Mammalian Cells',
    abstract: 'This research presents innovative methods for improving the efficiency and specificity of CRISPR-Cas9 gene editing in mammalian cell cultures. We developed a novel delivery system that increases editing success rates by 40%.',
    authors: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez'],
    keywords: ['CRISPR', 'gene editing', 'mammalian cells', 'biotechnology'],
    research_domain: 'biology',
    article_type: 'research_article',
    review_status: 'published',
    publication_date: '2024-01-15',
    views_count: 1245,
    downloads_count: 89,
    citations_count: 12,
    likes_count: 45,
    submitted_date: '2023-12-01',
    created_at: '2023-12-01'
  },
  {
    id: '2',
    title: 'Machine Learning Applications in Drug Discovery',
    abstract: 'We present a comprehensive review of machine learning techniques applied to modern drug discovery pipelines. Our analysis covers neural networks, random forests, and deep learning approaches.',
    authors: ['Dr. Ahmed Khan', 'Dr. Priya Patel'],
    keywords: ['machine learning', 'drug discovery', 'bioinformatics', 'AI'],
    research_domain: 'bioinformatics',
    article_type: 'review',
    review_status: 'accepted',
    publication_date: undefined,
    views_count: 892,
    downloads_count: 56,
    citations_count: 8,
    likes_count: 34,
    submitted_date: '2024-01-10',
    created_at: '2024-01-10'
  },
  {
    id: '3',
    title: 'Novel Protein Folding Prediction Using AlphaFold2',
    abstract: 'This study demonstrates improved protein structure prediction accuracy using modified AlphaFold2 parameters. Our method achieves 15% better accuracy on challenging protein targets.',
    authors: ['Dr. Robert Kim', 'Prof. Lisa Wang'],
    keywords: ['protein folding', 'AlphaFold', 'computational biology'],
    research_domain: 'bioinformatics',
    article_type: 'research_article',
    review_status: 'under_review',
    publication_date: undefined,
    views_count: 156,
    downloads_count: 12,
    citations_count: 2,
    likes_count: 15,
    submitted_date: '2024-01-20',
    created_at: '2024-01-20'
  }
];

export default ScienceForAllJournalPage;

