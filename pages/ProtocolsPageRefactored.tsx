/**
 * Protocol library - browse, write, compare, and execute SOPs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtocolExecutionMode from '../components/ProtocolExecutionMode';
import ProtocolExecutionModeMobile from '../components/ProtocolExecutionModeMobile';
import ProtocolCollaborationPanel from '../components/ProtocolCollaborationPanel';
import ProtocolComparisonView from '../components/ProtocolComparisonView';
import RecommendationsWidget from '../components/RecommendationsWidget';
import ProtocolForm, { ProtocolFormValues } from '../components/ProtocolForm';
import ProtocolImportModal from '../components/ProtocolImportModal';
import Input from '../components/ui/Input';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  PlayIcon,
  ShieldCheckIcon,
  BeakerIcon,
  BookOpenIcon,
  DocumentArrowUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FilmIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useEntityDeepLink } from '../hooks/useEntityDeepLink';
import { protocolToFormValues } from '../utils/protocolImport';
import { PageHeader, PagePanel } from '../components/PageHeader';
import ProtocolDetailView from '../components/ProtocolDetailView';
import { formatDurationMinutes, protocolRefCode, youtubeEmbedUrl } from '../utils/protocolShare';

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
  const { protocolId: routeProtocolId } = useParams<{ protocolId?: string }>();
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
    navigate(`/protocols/${protocol.id}`, { replace: true });
  }, [navigate]);

  const closeProtocolDetails = useCallback(() => {
    setShowDetails(false);
    navigate('/protocols', { replace: true });
  }, [navigate]);

  const { focusedId } = useEntityDeepLink(protocols, openHighlightedProtocol);

  useEffect(() => {
    if (!routeProtocolId || protocols.length === 0) return;
    if (showExecutionMode || showCollaboration || showComparison || showProtocolForm) return;
    const match = protocols.find((p) => p.id === routeProtocolId);
    if (match) {
      setSelectedProtocol(match);
      setShowDetails(true);
    }
  }, [
    routeProtocolId,
    protocols,
    showExecutionMode,
    showCollaboration,
    showComparison,
    showProtocolForm,
  ]);

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
        video_url: form.video_url || null,
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
          video_url: form.video_url || base.video_url,
          author: base.creator_name || user?.username || 'You',
          author_id: base.author_id || user?.id,
          usage_count: base.usage_count || 0,
          success_rate: base.success_rate || 0,
          rating: base.average_rating || 0,
          total_ratings: base.total_ratings || 0,
          version: form.version || '1.0',
        });
        navigate(`/protocols/${id}`, { replace: true });
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
      navigate('/protocols', { replace: true });
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
              if (protocol) openHighlightedProtocol(protocol);
            }}
            className="mb-6"
          />
        </div>
        {/* Header */}
        <div className="mb-8 space-y-4">
          <PageHeader
            title="Protocol library"
            accent="teal"
            icon={<BeakerIcon />}
            subtitle="Reusable methods and SOPs — write, search, compare, and execute"
            actions={
              <>
                <button
                  type="button"
                  onClick={openImportProtocol}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-teal-900 bg-white/90 border border-teal-200 rounded-md hover:bg-teal-50 transition-colors"
                >
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  Import
                </button>
                <button
                  type="button"
                  onClick={openWriteProtocol}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-teal-700 rounded-md hover:bg-teal-800 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Write protocol
                </button>
              </>
            }
          />

          <PagePanel accent="teal">
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
                className="inline-flex items-center justify-center px-3.5 py-2.5 text-[13px] font-medium text-white bg-teal-700 rounded-md hover:bg-teal-800 transition-colors disabled:opacity-60"
              >
                {isSearching ? 'Searching…' : 'Search'}
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-3">
              Try: “PCR amplification”, “protein purification”, or “cell culture protocol”
            </p>
          </PagePanel>
        </div>

        {/* Results — below search only */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                {filteredProtocols.length}{' '}
                {filteredProtocols.length === 1 ? 'protocol' : 'protocols'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Open a method to review conditions, run it, or share its SOP ID
              </p>
            </div>
            <div className="inline-flex items-center rounded-lg border border-teal-100 bg-white p-0.5 shadow-sm self-start">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-teal-50'
                }`}
                aria-pressed={viewMode === 'grid'}
              >
                <Squares2X2Icon className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-teal-50'
                }`}
                aria-pressed={viewMode === 'list'}
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>

          {filteredProtocols.length > 0 ? (
            <div
              className={`grid gap-3.5 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {filteredProtocols.map((protocol) => {
                const stepMins =
                  protocol.procedure?.reduce((acc, s) => acc + (Number(s.duration) || 0), 0) ||
                  Number(protocol.estimated_duration) ||
                  0;
                const stepCount = protocol.procedure?.length || 0;
                const hasVideo = !!youtubeEmbedUrl(protocol.video_url);
                const isList = viewMode === 'list';

                return (
                  <article
                    key={protocol.id}
                    data-entity-id={protocol.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openHighlightedProtocol(protocol)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openHighlightedProtocol(protocol);
                      }
                    }}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-teal-50/30 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-teal-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                      focusedId === protocol.id
                        ? 'border-teal-400 ring-2 ring-teal-200'
                        : 'border-slate-200/90'
                    } ${isList ? 'sm:flex sm:items-stretch' : 'flex flex-col'}`}
                  >
                    <div
                      className={`absolute ${isList ? 'left-0 top-0 bottom-0 w-1' : 'inset-x-0 top-0 h-1'} bg-gradient-to-r from-teal-600 to-cyan-500`}
                      aria-hidden="true"
                    />

                    <div className={`flex-1 min-w-0 p-4 sm:p-5 ${isList ? 'sm:pr-4' : ''}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="inline-flex items-center rounded-md bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                              {protocolRefCode(protocol.id)}
                            </span>
                            {protocol.version ? (
                              <span className="text-[10px] text-slate-500">v{protocol.version}</span>
                            ) : null}
                            {hasVideo ? (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 text-[10px] font-medium">
                                <FilmIcon className="w-3 h-3" />
                                Demo
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight line-clamp-2 group-hover:text-teal-900 transition-colors">
                            {protocol.title}
                          </h3>
                        </div>
                        {protocol.rating && protocol.rating > 0 ? (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            {protocol.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <p
                        className={`text-[13px] text-slate-600 leading-relaxed ${
                          isList ? 'line-clamp-2 max-w-3xl' : 'line-clamp-2'
                        }`}
                      >
                        {protocol.description || protocol.objective || 'No summary yet'}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium capitalize">
                          {String(protocol.category || 'other').replace(/_/g, ' ')}
                        </span>
                        {protocol.author ? (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px]">
                            {protocol.author}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5 text-teal-600" />
                          {formatDurationMinutes(stepMins)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BeakerIcon className="w-3.5 h-3.5 text-teal-600" />
                          {stepCount || '—'} steps
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserGroupIcon className="w-3.5 h-3.5 text-teal-600" />
                          {protocol.usage_count || 0} uses
                        </span>
                        {protocol.success_rate ? (
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                            {protocol.success_rate}% success
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={`flex gap-2 p-4 sm:p-5 pt-0 ${
                        isList
                          ? 'sm:pt-5 sm:border-l sm:border-slate-100 sm:items-center sm:shrink-0 sm:w-44 sm:flex-col'
                          : 'mt-auto border-t border-slate-100/80'
                      }`}
                    >
                      <button
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openHighlightedProtocol(protocol);
                        }}
                      >
                        Open
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-teal-900 bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 transition-colors"
                        title="Start execution"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProtocol(protocol);
                          setShowExecutionMode(true);
                        }}
                      >
                        <PlayIcon className="w-4 h-4" />
                        {isList ? 'Run' : null}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-teal-200 bg-gradient-to-br from-teal-50/60 via-white to-sky-50/40 text-center py-14 px-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <BookOpenIcon className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-1 tracking-tight">
                No protocols in this view
              </h3>
              <p className="text-[13px] text-slate-500 mb-5 max-w-md mx-auto leading-relaxed">
                Write a structured SOP with experimental conditions, or import a Word document to seed
                your library.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={openImportProtocol}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-teal-900 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  Import Word / paste
                </button>
                <button
                  type="button"
                  onClick={openWriteProtocol}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Write protocol
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Protocol Detail */}
      {showDetails && selectedProtocol ? (
        <ProtocolDetailView
          protocol={selectedProtocol}
          similarProtocols={similarProtocols}
          canManage={canManageProtocol(selectedProtocol)}
          onClose={closeProtocolDetails}
          onEdit={() => openEditProtocol(selectedProtocol)}
          onDelete={() => void handleDeleteProtocol(selectedProtocol)}
          onCollaborate={() => {
            setShowDetails(false);
            setShowCollaboration(true);
          }}
          onTrackExperiment={() => {
            navigate(
              `/experiment-tracker?protocolId=${encodeURIComponent(selectedProtocol.id)}&title=${encodeURIComponent(selectedProtocol.title)}`
            );
          }}
          onExecute={() => {
            setShowDetails(false);
            setShowExecutionMode(true);
          }}
          onCompare={(id) => handleCompareProtocol(id)}
        />
      ) : null}

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

