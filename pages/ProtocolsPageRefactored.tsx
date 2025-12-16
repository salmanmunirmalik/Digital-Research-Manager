/**
 * Refactored Protocols Page
 * AI-First Protocol Generation and Management Ecosystem
 * Simple, attractive design with automatic AI generation
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ProtocolAIAssistant from '../components/ProtocolAIAssistant';
import ProtocolExecutionMode from '../components/ProtocolExecutionMode';
import ProtocolExecutionModeMobile from '../components/ProtocolExecutionModeMobile';
import ProtocolCollaborationPanel from '../components/ProtocolCollaborationPanel';
import ProtocolComparisonView from '../components/ProtocolComparisonView';
import RecommendationsWidget from '../components/RecommendationsWidget';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  ChartBarIcon,
  LightBulbIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  PlayIcon,
  BookOpenIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '../components/icons';
import axios from 'axios';

interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  author: string;
  usage_count: number;
  success_rate: number;
  rating: number;
  total_ratings: number;
  video_url?: string;
  objective: string;
  background: string;
  materials: any[];
  equipment: any[];
  safety_notes: string[];
  procedure: ProtocolStep[];
  expected_results: string;
  troubleshooting: { issue: string; solution: string }[];
  references: string[];
  tags: string[];
  wasGenerated?: boolean;
}

interface ProtocolStep {
  id: number;
  title: string;
  description: string;
  duration: number;
  critical: boolean;
  materials_needed?: Array<{ name: string; quantity: string; unit: string }>;
  warnings?: string[];
  tips?: string[];
}

const ProtocolsPageRefactored: React.FC = () => {
  const { user, token } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showExecutionMode, setShowExecutionMode] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProtocolId, setComparisonProtocolId] = useState<string | null>(null);
  const [similarProtocols, setSimilarProtocols] = useState<Protocol[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateQuery, setGenerateQuery] = useState('');
  const [generateCategory, setGenerateCategory] = useState('');

  useEffect(() => {
    fetchProtocols();
    checkMobile();
    window.addEventListener('resize', () => setIsMobile(window.innerWidth < 768));
  }, []);

  useEffect(() => {
    if (selectedProtocol) {
      fetchSimilarProtocols(selectedProtocol.id);
    }
  }, [selectedProtocol]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const fetchProtocols = async () => {
    try {
      const authToken = token || localStorage.getItem('authToken') || (user ? 'demo-token-123' : null);
      const response = await axios.get('/api/protocols', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      // Transform protocol data to match our interface
      const transformedProtocols = (response.data.protocols || []).map((p: any) => ({
        ...p,
        procedure: p.procedure || (p.content ? JSON.parse(p.content) : []),
        materials: p.materials || [],
        equipment: p.equipment || [],
        safety_notes: p.safety_notes ? (Array.isArray(p.safety_notes) ? p.safety_notes : [p.safety_notes]) : [],
        troubleshooting: p.troubleshooting || [],
        references: p.references || [],
        tags: p.tags || [],
        objective: p.objective || p.description || '',
        background: p.background || '',
        expected_results: p.expected_results || '',
        author: p.creator_name || p.author || 'Unknown',
        usage_count: p.usage_count || 0,
        success_rate: p.success_rate || 0,
        rating: p.average_rating || 0,
        total_ratings: p.total_ratings || 0
      }));
      setProtocols(transformedProtocols);
    } catch (error) {
      console.error('Error fetching protocols:', error);
      // Fallback to empty array
      setProtocols([]);
    }
  };

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProtocols();
      return;
    }

    setIsSearching(true);
    try {
      const authToken = token || localStorage.getItem('authToken') || (user ? 'demo-token-123' : null);
      
      // First try semantic search
      const searchResponse = await axios.post(
        '/api/protocol-search/semantic',
        {
          query: searchQuery,
          limit: 20,
          filters: filterCategory ? { category: filterCategory } : {}
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (searchResponse.data.results && searchResponse.data.results.length > 0) {
        setProtocols(searchResponse.data.results);
        setIsSearching(false);
        return;
      }

      // If no results, auto-generate using AI
      setIsGenerating(true);
      const generateResponse = await axios.post(
        '/api/protocol-ai/get-or-generate',
        {
          query: searchQuery,
          category: filterCategory,
          generateIfNotFound: true
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (generateResponse.data.protocol) {
        // Convert generated protocol to display format
        const generatedProtocol = generateResponse.data.protocol;
        const transformedProtocol: Protocol = {
          id: generatedProtocol.id || `generated-${Date.now()}`,
          title: generatedProtocol.title,
          description: generatedProtocol.description,
          category: generatedProtocol.category,
          version: generatedProtocol.version || '1.0',
          author: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'You',
          usage_count: 0,
          success_rate: 0,
          rating: 0,
          total_ratings: 0,
          objective: generatedProtocol.objective || generatedProtocol.description,
          background: generatedProtocol.background || '',
          materials: generatedProtocol.materials || [],
          equipment: generatedProtocol.equipment || [],
          safety_notes: generatedProtocol.safety_notes || [],
          procedure: generatedProtocol.procedure || [],
          expected_results: generatedProtocol.expected_results || '',
          troubleshooting: generatedProtocol.troubleshooting || [],
          references: generatedProtocol.references || [],
          tags: generatedProtocol.tags || [],
          wasGenerated: generateResponse.data.wasGenerated
        };
        setProtocols([transformedProtocol]);
        if (generateResponse.data.wasGenerated) {
          // Show success message with AI availability info
          const message = generateResponse.data.aiAvailable === false
            ? `✨ Basic protocol "${transformedProtocol.title}" created.\n\n💡 Configure AI API keys in Settings → API Management for enhanced AI generation.`
            : `✨ AI generated a new protocol: "${transformedProtocol.title}"`;
          setTimeout(() => {
            alert(message);
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Error in smart search:', error);
      const errorMessage = error.response?.data?.error || 'Failed to search/generate protocol';
      const suggestion = error.response?.data?.suggestion || '';
      alert(`${errorMessage}\n\n${suggestion}`);
    } finally {
      setIsSearching(false);
      setIsGenerating(false);
    }
  };

  const fetchSimilarProtocols = async (protocolId: string) => {
    try {
      const authToken = token || localStorage.getItem('authToken') || (user ? 'demo-token-123' : null);
      const response = await axios.get(
        `/api/protocol-comparison/${protocolId}/similar?limit=5`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setSimilarProtocols(response.data.similarProtocols || []);
    } catch (error) {
      console.error('Error fetching similar protocols:', error);
    }
  };

  const handleCompareProtocol = (compareWithId: string) => {
    if (selectedProtocol) {
      setComparisonProtocolId(compareWithId);
      setShowComparison(true);
    }
  };

  const handleQuickGenerate = () => {
    setShowGenerateModal(true);
    setGenerateQuery('');
    setGenerateCategory('');
  };

  const handleGenerateSubmit = async () => {
    if (!generateQuery.trim()) {
      alert('Please enter a protocol name or description');
      return;
    }

    setShowGenerateModal(false);
    setIsGenerating(true);
    try {
      const authToken = token || localStorage.getItem('authToken') || (user ? 'demo-token-123' : null);
      const response = await axios.post(
        '/api/protocol-ai/generate',
        { 
          query: generateQuery,
          category: generateCategory
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.protocol) {
        await fetchProtocols();
        const protocol = response.data.protocol;
        setSelectedProtocol(protocol);
        setShowDetails(true);
        const message = response.data.aiAvailable === false
          ? `✨ Basic protocol "${protocol.title}" created.\n\n💡 Configure AI API keys in Settings → API Management for enhanced AI generation.`
          : `✨ Protocol "${protocol.title}" generated successfully!`;
        alert(message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to generate protocol';
      const suggestion = error.response?.data?.suggestion || '';
      alert(`${errorMessage}\n\n${suggestion}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredProtocols = protocols.filter(p => 
    !filterCategory || p.category === filterCategory
  );

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recommended Protocols Sidebar */}
        <div className="mb-6">
          <RecommendationsWidget
            itemType="protocols"
            title="Recommended Protocols for You"
            limit={5}
            showFeedback={true}
            onItemClick={(itemId) => {
              const protocol = protocols.find(p => p.id === itemId);
              if (protocol) {
                setSelectedProtocol(protocol);
                setShowDetails(true);
              }
            }}
            className="mb-6"
          />
        </div>
        {/* Simplified Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Protocol Library
              </h1>
              <p className="text-gray-600 text-lg">
                AI-powered protocol generation and management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAIAssistant(true)}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI Assistant
              </Button>
              <Button
                onClick={handleQuickGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate Protocol
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Simplified Search - AI-First */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
                  placeholder="Search or describe a protocol... AI will generate it if not found"
                  className="pl-12 pr-4 py-3 text-lg"
                />
                {isGenerating && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-blue-600">
                    <SparklesIcon className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-medium">AI Generating...</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSmartSearch}
                disabled={isSearching || isGenerating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
              >
                {isSearching ? 'Searching...' : 'Search / Generate'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-3 ml-12">
              💡 Try: "PCR amplification", "protein purification", or "cell culture protocol"
            </p>
          </div>
        </div>

        {/* Recommended Protocols Section */}
        <div className="mb-8">
          <RecommendationsWidget
            itemType="protocols"
            title="Recommended Protocols for You"
            limit={5}
            showFeedback={true}
            onItemClick={(itemId) => {
              const protocol = protocols.find(p => p.id === itemId);
              if (protocol) {
                setSelectedProtocol(protocol);
                setShowDetails(true);
              }
            }}
            className="mb-6"
          />
        </div>

        {/* Protocol Cards - Simplified Design */}
        {filteredProtocols.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProtocols.map((protocol) => (
              <Card
                key={protocol.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 bg-white"
                onClick={() => {
                  setSelectedProtocol(protocol);
                  setShowDetails(true);
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                        {protocol.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {protocol.description}
                      </p>
                    </div>
                    {protocol.wasGenerated && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex-shrink-0">
                        ✨ AI
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {protocol.category}
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium flex items-center">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      {protocol.success_rate}% success
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {protocol.procedure?.reduce((acc, s) => acc + s.duration, 0) || 0}m
                      </span>
                      <span className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        {protocol.usage_count} uses
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      <span>{protocol.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProtocol(protocol);
                        setShowDetails(true);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProtocol(protocol);
                        setShowExecutionMode(true);
                      }}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                    >
                      <RocketLaunchIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <SparklesIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isGenerating ? 'AI is generating your protocol...' : 'No protocols found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isGenerating 
                  ? 'This may take a moment. The AI is creating a complete protocol for you.'
                  : 'Try searching for a protocol or click "Generate Protocol" to create one with AI.'}
              </p>
              {!isGenerating && (
                <Button
                  onClick={handleQuickGenerate}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Protocol with AI
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Simplified Protocol Detail Modal */}
      {showDetails && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl my-8">
            {/* Simplified Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-8">
                  {selectedProtocol.wasGenerated && (
                    <span className="inline-flex items-center px-3 py-1 bg-purple-500 rounded-full text-xs font-bold mb-3">
                      ✨ AI Generated
                    </span>
                  )}
                  <h2 className="text-3xl font-bold mb-2">{selectedProtocol.title}</h2>
                  <div className="flex items-center space-x-4 text-sm opacity-90">
                    <span>{selectedProtocol.category}</span>
                    <span>•</span>
                    <span>{selectedProtocol.success_rate}% success</span>
                    <span>•</span>
                    <span>{selectedProtocol.usage_count} uses</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Simplified Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="space-y-6">
                {/* Objective & Background */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Objective</h3>
                  <p className="text-gray-700">{selectedProtocol.objective}</p>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Duration</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedProtocol.procedure?.reduce((acc, s) => acc + s.duration, 0) || 0}m
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {selectedProtocol.success_rate}%
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Steps</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedProtocol.procedure?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Procedure Steps - Simplified */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Procedure</h3>
                  <div className="space-y-3">
                    {selectedProtocol.procedure?.map((step) => (
                      <div
                        key={step.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            {step.id}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                            <p className="text-gray-700 text-sm">{step.description}</p>
                            {step.duration && (
                              <div className="mt-2 text-xs text-gray-500">
                                ⏱ {step.duration} minutes
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Similar Protocols for Comparison - Always Visible */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Compare Protocol
                </h3>
                {similarProtocols.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 mb-3">Compare with similar protocols:</p>
                    {similarProtocols.slice(0, 3).map((similar) => (
                      <div
                        key={similar.id}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => handleCompareProtocol(similar.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{similar.title}</div>
                            <div className="text-sm text-gray-600">
                              {similar.success_rate}% success • {similar.usage_count} uses
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompareProtocol(similar.id);
                            }}
                          >
                            Compare
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 mb-2">
                      No similar protocols found. You can still compare by searching for another protocol.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const protocolId = prompt('Enter the ID of the protocol you want to compare with:');
                        if (protocolId) {
                          handleCompareProtocol(protocolId);
                        }
                      }}
                    >
                      Compare with Protocol ID
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Simplified Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-gray-700">
                    {selectedProtocol.rating?.toFixed(1) || 'N/A'} ({selectedProtocol.total_ratings || 0} reviews)
                  </span>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetails(false);
                      setShowCollaboration(true);
                    }}
                  >
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Collaborate
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      setShowExecutionMode(true);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <RocketLaunchIcon className="w-4 h-4 mr-2" />
                    Start Execution
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant */}
      {showAIAssistant && (
        <ProtocolAIAssistant
          protocol={selectedProtocol ? {
            id: selectedProtocol.id,
            title: selectedProtocol.title,
            description: selectedProtocol.description,
            steps: selectedProtocol.procedure,
            materials: selectedProtocol.materials,
            equipment: selectedProtocol.equipment
          } : undefined}
          onOptimized={(optimized) => {
            console.log('Optimized protocol:', optimized);
            setShowAIAssistant(false);
          }}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Execution Mode */}
      {showExecutionMode && selectedProtocol && (
        isMobile ? (
          <ProtocolExecutionModeMobile
            protocol={{
              title: selectedProtocol.title,
              procedure: selectedProtocol.procedure
            }}
            onComplete={(executionData) => {
              console.log('Execution completed:', executionData);
              setShowExecutionMode(false);
            }}
            onExit={() => setShowExecutionMode(false)}
          />
        ) : (
          <ProtocolExecutionMode
            protocol={{
              title: selectedProtocol.title,
              procedure: selectedProtocol.procedure
            }}
            onComplete={(executionData) => {
              console.log('Execution completed:', executionData);
              setShowExecutionMode(false);
            }}
            onExit={() => setShowExecutionMode(false)}
          />
        )
      )}

      {/* Collaboration Panel */}
      {showCollaboration && selectedProtocol && (
        <ProtocolCollaborationPanel
          protocolId={selectedProtocol.id}
          onClose={() => setShowCollaboration(false)}
        />
      )}

      {/* Comparison View */}
      {showComparison && selectedProtocol && comparisonProtocolId && (
        <ProtocolComparisonView
          protocol1Id={selectedProtocol.id}
          protocol2Id={comparisonProtocolId}
          onClose={() => {
            setShowComparison(false);
            setComparisonProtocolId(null);
          }}
        />
      )}

      {/* Generate Protocol Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="w-6 h-6" />
                  <CardTitle className="text-white text-xl">Generate Protocol with AI</CardTitle>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Protocol Name or Description *
                  </label>
                  <Input
                    value={generateQuery}
                    onChange={(e) => setGenerateQuery(e.target.value)}
                    placeholder='e.g., "PCR amplification", "Western blot", "Cell culture", "ELISA"'
                    className="w-full"
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateSubmit()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe what protocol you want to generate
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <Input
                    value={generateCategory}
                    onChange={(e) => setGenerateCategory(e.target.value)}
                    placeholder="e.g., Molecular Biology, Protein Analysis, Cell Culture"
                    className="w-full"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <LightBulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">💡 Tips for best results:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Be specific about the technique or method</li>
                        <li>Include the type of analysis (e.g., "quantitative PCR", "protein detection")</li>
                        <li>Mention any special requirements if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateSubmit}
                    disabled={!generateQuery.trim() || isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Generate Protocol
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProtocolsPageRefactored;

