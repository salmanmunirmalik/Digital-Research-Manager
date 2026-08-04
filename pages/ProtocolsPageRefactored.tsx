/**
 * Protocol library - browse, write, compare, and execute SOPs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtocolExecutionMode from '../components/ProtocolExecutionMode';
import ProtocolExecutionModeMobile from '../components/ProtocolExecutionModeMobile';
import ProtocolCollaborationPanel from '../components/ProtocolCollaborationPanel';
import ProtocolComparisonView from '../components/ProtocolComparisonView';
import RecommendationsWidget from '../components/RecommendationsWidget';
import ProtocolForm, { ProtocolFormValues } from '../components/ProtocolForm';
import ProtocolImportModal from '../components/ProtocolImportModal';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  PlayIcon,
  ShieldCheckIcon,
  BeakerIcon,
  BookOpenIcon,
  DocumentArrowUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '../components/icons';
import axios from 'axios';
import { useEntityDeepLink } from '../hooks/useEntityDeepLink';
import { protocolToFormValues } from '../utils/protocolImport';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
).replace(/\/$/, '');

const apiUrl = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p.startsWith('/api/') ? p.slice(4) : p}`;
};

interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  author: string;
  author_id?: string;
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
  content?: string;
  expected_results: string;
  troubleshooting: { issue: string; solution: string }[];
  references: string[];
  tags: string[];
  difficulty_level?: string;
  estimated_duration?: number;
  privacy_level?: string;
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
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExecutionMode, setShowExecutionMode] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProtocolId, setComparisonProtocolId] = useState<string | null>(null);
  const [similarProtocols, setSimilarProtocols] = useState<Protocol[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);
  const [protocolFormMode, setProtocolFormMode] = useState<'create' | 'edit'>('create');
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);
  const [protocolFormInitial, setProtocolFormInitial] = useState<Partial<ProtocolFormValues> | undefined>();

  const openHighlightedProtocol = useCallback((protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowDetails(true);
  }, []);
  const { focusedId } = useEntityDeepLink(protocols, openHighlightedProtocol);

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
      const authToken = token || localStorage.getItem('authToken');
      const response = await axios.get(apiUrl('/protocols'), {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const parseMaybeJson = (value: unknown, fallback: unknown) => {
        if (value == null || value === '') return fallback;
        if (typeof value !== 'string') return value;
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      };

      const transformedProtocols = (response.data.protocols || []).map((p: any) => {
        const parsedContent = parseMaybeJson(p.content, null);
        const procedure = Array.isArray(p.procedure)
          ? p.procedure
          : Array.isArray(parsedContent)
            ? parsedContent
            : [];
        const materials = parseMaybeJson(p.materials, []);
        const tags = parseMaybeJson(p.tags, []);

        return {
          ...p,
          author_id: p.author_id,
          procedure,
          materials: Array.isArray(materials) ? materials : [],
          equipment: Array.isArray(p.equipment) ? p.equipment : [],
          safety_notes: p.safety_notes
            ? (Array.isArray(p.safety_notes) ? p.safety_notes : [p.safety_notes])
            : [],
          troubleshooting: p.troubleshooting || [],
          references: p.references || [],
          tags: Array.isArray(tags) ? tags : [],
          objective: p.objective || p.description || '',
          background: p.background || '',
          expected_results: p.expected_results || '',
          author: p.creator_name || p.author || 'Unknown',
          usage_count: p.usage_count || 0,
          success_rate: p.success_rate || 0,
          rating: p.average_rating || 0,
          total_ratings: p.total_ratings || 0,
        };
      });
      setProtocols(transformedProtocols);
    } catch (error) {
      console.error('Error fetching protocols:', error);
      setProtocols([]);
    }
  };

  const openWriteProtocol = () => {
    setProtocolFormMode('create');
    setEditingProtocolId(null);
    setProtocolFormInitial(undefined);
    setShowProtocolForm(true);
  };

  const openImportProtocol = () => {
    setShowImportModal(true);
  };

  const handleImportParsed = (values: Partial<ProtocolFormValues>) => {
    setShowImportModal(false);
    setProtocolFormMode('create');
    setEditingProtocolId(null);
    setProtocolFormInitial(values);
    setShowProtocolForm(true);
  };

  const openEditProtocol = (protocol: Protocol) => {
    setProtocolFormMode('edit');
    setEditingProtocolId(protocol.id);
    setProtocolFormInitial(protocolToFormValues(protocol));
    setShowDetails(false);
    setShowProtocolForm(true);
  };

  const canManageProtocol = (protocol: Protocol | null) => {
    if (!protocol || !user) return false;
    if (user.role === 'admin') return true;
    return protocol.author_id === user.id;
  };

  const handleSaveProtocol = async (
    form: ProtocolFormValues & { content: string }
  ) => {
    setIsSavingProtocol(true);
    try {
      const authToken = token || localStorage.getItem('authToken');
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        difficulty_level: form.difficulty_level,
        estimated_duration: form.estimated_duration,
        materials: form.materials,
        content: form.content,
        safety_notes: form.safety_notes,
        tags: form.tags,
        privacy_level: form.privacy_level,
        version: form.version,
      };

      let saved: any;
      if (protocolFormMode === 'edit' && editingProtocolId) {
        const response = await axios.put(
          apiUrl(`/protocols/${editingProtocolId}`),
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        saved = response.data.protocol || response.data;
      } else {
        const response = await axios.post(apiUrl('/protocols'), payload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        saved = response.data.protocol || response.data;
      }

      setShowProtocolForm(false);
      setEditingProtocolId(null);
      setProtocolFormInitial(undefined);
      await fetchProtocols();

      const id = saved?.id || editingProtocolId;
      if (id) {
        const refreshed = (await axios.get(apiUrl('/protocols'), {
          headers: { Authorization: `Bearer ${authToken}` },
        })).data.protocols?.find((p: any) => p.id === id);

        const base = refreshed || saved;
        setSelectedProtocol({
          ...base,
          procedure: Array.isArray(base.procedure) ? base.procedure : [],
          materials: form.materials,
          equipment: form.equipment,
          safety_notes: form.safety_notes ? [form.safety_notes] : [],
          troubleshooting: [],
          references: form.references,
          tags: form.tags,
          objective: form.objective,
          background: form.background,
          expected_results: form.expected_results,
          content: form.content,
          author: base.creator_name || user?.username || 'You',
          author_id: base.author_id || user?.id,
          usage_count: base.usage_count || 0,
          success_rate: base.success_rate || 0,
          rating: base.average_rating || 0,
          total_ratings: base.total_ratings || 0,
          version: form.version || '1.0',
        });
        setShowDetails(true);
      }
    } catch (error: any) {
      console.error('Error saving protocol:', error);
      alert(error?.response?.data?.error || error?.message || 'Failed to save protocol');
    } finally {
      setIsSavingProtocol(false);
    }
  };

  const handleDeleteProtocol = async (protocol: Protocol) => {
    if (
      !confirm(
        `Delete “${protocol.title}”? It will be removed from the library.`
      )
    ) {
      return;
    }
    try {
      const authToken = token || localStorage.getItem('authToken');
      await axios.delete(apiUrl(`/protocols/${protocol.id}`), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setShowDetails(false);
      setSelectedProtocol(null);
      await fetchProtocols();
    } catch (error: any) {
      console.error('Error deleting protocol:', error);
      alert(error?.response?.data?.error || 'Failed to delete protocol');
    }
  };

  const handleCreateProtocol = handleSaveProtocol;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProtocols();
      return;
    }

    setIsSearching(true);
    try {
      const authToken = token || localStorage.getItem('authToken');
      const searchResponse = await axios.post(
        apiUrl('/protocol-search/semantic'),
        {
          query: searchQuery,
          limit: 20,
          filters: filterCategory ? { category: filterCategory } : {}
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (searchResponse.data.results && searchResponse.data.results.length > 0) {
        setProtocols(searchResponse.data.results);
        return;
      }

      const listResponse = await axios.get(apiUrl('/protocols'), {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const query = searchQuery.toLowerCase();
      const all = (listResponse.data.protocols || []) as Protocol[];
      setProtocols(
        all.filter(
          (p) =>
            p.title?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            (Array.isArray(p.tags) && p.tags.some((tag) => String(tag).toLowerCase().includes(query)))
        )
      );
    } catch (error: any) {
      console.error('Error searching protocols:', error);
      const query = searchQuery.toLowerCase();
      setProtocols((current) =>
        current.filter(
          (p) =>
            p.title?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query)
        )
      );
    } finally {
      setIsSearching(false);
    }
  };

  const fetchSimilarProtocols = async (protocolId: string) => {
    try {
      const authToken = token || localStorage.getItem('authToken');
      const response = await axios.get(
        apiUrl(`/protocol-comparison/${protocolId}/similar?limit=5`),
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

  const filteredProtocols = protocols.filter(p => 
    !filterCategory || p.category === filterCategory
  );

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Recommended Protocols */}
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                Protocol library
              </h1>
              <p className="mt-1.5 text-[14px] text-slate-600">
                Reusable methods and SOPs - write, search, compare, and execute
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                type="button"
                onClick={openImportProtocol}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                <DocumentArrowUpIcon className="w-4 h-4" />
                Import
              </button>
              <button
                type="button"
                onClick={openWriteProtocol}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Write protocol
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search protocols by name, category, or keyword"
                  className="pl-10 pr-4 py-2.5 text-[14px]"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="inline-flex items-center justify-center px-3.5 py-2.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {isSearching ? 'Searching…' : 'Search'}
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-3">
              Try: “PCR amplification”, “protein purification”, or “cell culture protocol”
            </p>
          </div>
        </div>

        {/* Protocol Cards */}
        {filteredProtocols.length > 0 ? (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProtocols.map((protocol) => (
              <Card
                key={protocol.id}
                data-entity-id={protocol.id}
                className={`hover:border-slate-300 transition-colors cursor-pointer group border bg-white rounded-xl shadow-none ${
                  focusedId === protocol.id
                    ? 'border-sky-400 ring-2 ring-sky-200'
                    : 'border-slate-200/80'
                }`}
                onClick={() => {
                  setSelectedProtocol(protocol);
                  setShowDetails(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-[15px] font-semibold text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors mb-1.5">
                        {protocol.title}
                      </CardTitle>
                      <p className="text-[13px] text-slate-500 line-clamp-2">
                        {protocol.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                      {protocol.category}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[11px] font-medium inline-flex items-center gap-1">
                      <ShieldCheckIcon className="w-3 h-3" />
                      {protocol.success_rate}% success
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-[12px] text-slate-500 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {protocol.procedure?.reduce((acc, s) => acc + s.duration, 0) || 0}m
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserGroupIcon className="w-3.5 h-3.5" />
                        {protocol.usage_count} uses
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{protocol.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProtocol(protocol);
                        setShowDetails(true);
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-3 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProtocol(protocol);
                        setShowExecutionMode(true);
                      }}
                    >
                      <PlayIcon className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 text-center py-12 px-6">
              <BookOpenIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
                No protocols found
              </h3>
              <p className="text-[13px] text-slate-500 mb-5 max-w-md mx-auto">
                Write a structured SOP to build your protocol library.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={openImportProtocol}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  Import Word / paste
                </button>
                <button
                  type="button"
                  onClick={openWriteProtocol}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Write protocol
                </button>
              </div>
          </div>
        )}
      </div>

      {/* Protocol Detail Modal */}
      {showDetails && selectedProtocol && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-8">
                  <h2 className="text-2xl font-semibold mb-2 tracking-tight">{selectedProtocol.title}</h2>
                  <div className="flex items-center gap-2 text-[13px] text-slate-300">
                    <span>{selectedProtocol.category}</span>
                    <span>·</span>
                    <span>{selectedProtocol.success_rate}% success</span>
                    <span>·</span>
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

                {/* Procedure */}
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-3">
                    Method
                  </h3>
                  {selectedProtocol.procedure?.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedProtocol.procedure.map((step) => (
                        <div
                          key={step.id}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-slate-900 text-white rounded-md flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                              {step.id}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-[14px] mb-1">
                                {step.title}
                              </h4>
                              <p className="text-slate-600 text-[13px] leading-relaxed">
                                {step.description}
                              </p>
                              {step.duration ? (
                                <div className="mt-2 text-[12px] text-slate-500">
                                  {step.duration} min
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedProtocol.content ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                      <pre className="whitespace-pre-wrap text-[13px] text-slate-700 leading-relaxed font-sans">
                        {selectedProtocol.content}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate-500">No procedure documented yet.</p>
                  )}
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
                <div className="flex space-x-3 flex-wrap justify-end gap-y-2">
                  {canManageProtocol(selectedProtocol) ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => openEditProtocol(selectedProtocol)}
                      >
                        <PencilSquareIcon className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void handleDeleteProtocol(selectedProtocol)}
                        className="text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  ) : null}
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
                    variant="outline"
                    onClick={() => {
                      navigate(`/experiment-tracker?protocolId=${encodeURIComponent(selectedProtocol.id)}&title=${encodeURIComponent(selectedProtocol.title)}`);
                    }}
                  >
                    <BeakerIcon className="w-4 h-4 mr-2" />
                    Track experiment
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

      {showImportModal && (
        <ProtocolImportModal
          onCancel={() => setShowImportModal(false)}
          onParsed={handleImportParsed}
        />
      )}

      {showProtocolForm && (
        <ProtocolForm
          key={editingProtocolId || `create-${protocolFormInitial?.title || 'blank'}`}
          mode={protocolFormMode}
          initialData={protocolFormInitial}
          isSubmitting={isSavingProtocol}
          onCancel={() => {
            setShowProtocolForm(false);
            setEditingProtocolId(null);
            setProtocolFormInitial(undefined);
          }}
          onSubmit={handleSaveProtocol}
        />
      )}
    </>
  );
};

export default ProtocolsPageRefactored;

