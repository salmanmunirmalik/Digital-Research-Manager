import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GrantPostForm, { GrantPostFormValues } from '../components/GrantPostForm';
import GrantWritingWizard from '../components/GrantWritingWizard';
import PostedBy from '../components/PostedBy';
import {
  CAREER_STAGE_OPTIONS,
  FUNDING_TYPE_OPTIONS,
  deadlineUrgency,
  deadlineUrgencyLabel,
  formatDeadlineLabel,
  formatFundingAmount,
  fundingTypeLabel,
  isClosingWithinDays,
  reasonLabel,
} from '../utils/grantsDisplay';
import {
  MagnifyingGlassIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  ClockIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
} from '../components/icons';
import { PageHeader, PageStat } from '../components/PageHeader';

const grantRefCode = (id: string, callId?: string | null, topicId?: string | null) => {
  const preferred = topicId || callId;
  if (preferred) return preferred.length > 28 ? `${preferred.slice(0, 26)}…` : preferred;
  const short = String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return short ? `GRT-${short}` : 'GRT';
};

type TabKey = 'discover' | 'matches' | 'write' | 'preferences';
type SortKey = 'deadline' | 'newest' | 'amount';

interface Grant {
  id: string;
  title: string;
  summary?: string;
  sponsor?: string;
  programme?: string | null;
  programme_period?: string | null;
  pillar?: string | null;
  funding_type?: string;
  action_type?: string | null;
  funding_min?: number | null;
  funding_max?: number | null;
  funding_currency?: string;
  call_budget?: number | null;
  deadline_date?: string | null;
  deadline_model?: string | null;
  opening_date?: string | null;
  region?: string;
  country?: string;
  disciplines?: string[];
  call_identifier?: string | null;
  topic_identifier?: string | null;
  url?: string | null;
  postedByName?: string;
  createdBy?: string;
  created_at?: string;
}

interface GrantMatch extends Grant {
  match_score: number;
  is_eligible: boolean;
  reasons: string[];
}

interface Preferences {
  keywords: string[];
  disciplines: string[];
  regions: string[];
  funding_types: string[];
  career_stage?: string;
  notify_in_app: boolean;
  notify_email: boolean;
  min_funding?: number | null;
  max_funding?: number | null;
}


const splitTags = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const hasPreferencesConfigured = (prefs: Preferences) =>
  prefs.keywords.length > 0 ||
  prefs.disciplines.length > 0 ||
  prefs.regions.length > 0 ||
  prefs.funding_types.length > 0 ||
  Boolean(prefs.career_stage && prefs.career_stage !== 'any') ||
  prefs.min_funding != null ||
  prefs.max_funding != null;

const urgencyChipClass = (urgency: ReturnType<typeof deadlineUrgency>) => {
  if (urgency === 'closing_soon') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (urgency === 'rolling') return 'bg-slate-50 text-slate-600 border-slate-200';
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
};

type GrantCardProps = {
  grant: Grant;
  highlight?: boolean;
  matchScore?: number | null;
  matchReasons?: string[];
  isEligible?: boolean;
  showMatchBadge?: boolean;
  onOpenMatches?: () => void;
  onDraftProposal?: () => void;
  onFitGap?: () => void;
  fitGapLoading?: boolean;
  onDelete?: () => void;
  cardRef?: (el: HTMLElement | null) => void;
};

const GrantCard: React.FC<GrantCardProps> = ({
  grant,
  highlight,
  matchScore,
  matchReasons,
  isEligible,
  showMatchBadge,
  onOpenMatches,
  onDraftProposal,
  onFitGap,
  fitGapLoading,
  onDelete,
  cardRef,
}) => {
  const [expanded, setExpanded] = useState(false);
  const urgency = deadlineUrgency(grant.deadline_date);
  const disciplines = (grant.disciplines || []).slice(0, 3);
  const summary = grant.summary || 'No summary provided.';
  const longSummary = summary.length > 220;
  const refCode = grantRefCode(grant.id, grant.call_identifier, grant.topic_identifier);

  return (
    <article
      ref={cardRef}
      id={`grant-${grant.id}`}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-amber-50/30 shadow-sm transition-all hover:shadow-md hover:border-amber-200 flex flex-col ${
        highlight
          ? 'border-amber-400 ring-2 ring-amber-200'
          : 'border-slate-200/90'
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400"
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center rounded-md bg-amber-50 text-amber-900 border border-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                {refCode}
              </span>
              {showMatchBadge && matchScore != null && matchScore > 0 && (
                <button
                  type="button"
                  onClick={onOpenMatches}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-amber-700 text-white hover:bg-amber-800"
                >
                  Match {Math.round(matchScore)}
                </button>
              )}
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md border ${urgencyChipClass(
                  urgency
                )}`}
              >
                {deadlineUrgencyLabel(urgency)}
              </span>
              {isEligible === false && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md border border-rose-200 bg-rose-50 text-rose-700">
                  Outside funding band
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-amber-950 transition-colors">
              {grant.title}
            </h3>
            {grant.sponsor && (
              <p className="text-[13px] text-slate-600 mt-1">{grant.sponsor}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {grant.programme && (
            <span className="px-2 py-0.5 rounded-md bg-amber-700 text-white text-[11px] font-medium">
              {grant.programme}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
            {fundingTypeLabel(grant.funding_type)}
          </span>
          {grant.action_type && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px]">
              {grant.action_type}
            </span>
          )}
          {grant.region && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px]">
              {grant.region}
            </span>
          )}
          {disciplines.map((d) => (
            <span
              key={d}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px]"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CurrencyDollarIcon className="w-3.5 h-3.5 text-amber-600" />
            {formatFundingAmount(grant.funding_min, grant.funding_max, grant.funding_currency)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
            {formatDeadlineLabel(grant.deadline_date)}
          </span>
        </div>

        <p className={`text-[13px] text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {summary}
        </p>
        {longSummary && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="self-start text-[12px] font-medium text-amber-900 hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {matchScore != null && (
          <div className="space-y-2 pt-2 border-t border-slate-100/80">
            <div className="flex items-center justify-between text-[12px] text-slate-600">
              <span>Match score</span>
              <span className="font-semibold text-amber-900">{Math.round(matchScore)} / 100</span>
            </div>
            <div className="h-1.5 bg-amber-50 rounded-full overflow-hidden border border-amber-100/80">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
              />
            </div>
            {(matchReasons || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {matchReasons!.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 border border-amber-100 bg-amber-50/60 text-amber-900 rounded-md text-[11px]"
                  >
                    {reasonLabel(r)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <PostedBy name={grant.postedByName} />
      </div>

      <div className="flex flex-wrap gap-2 p-4 sm:p-5 pt-0 mt-auto border-t border-slate-100/80">
        {grant.url ? (
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            View official call
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="No application URL listed for this opportunity"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            View official call
          </button>
        )}
        {onDraftProposal && (
          <button
            type="button"
            onClick={onDraftProposal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-amber-900 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors"
          >
            Draft proposal
          </button>
        )}
        {onFitGap && (
          <button
            type="button"
            onClick={onFitGap}
            disabled={fitGapLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-teal-900 bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {fitGapLoading ? 'Analyzing…' : 'Fit gap'}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};

const TagField: React.FC<{
  label: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}> = ({ label, hint, value, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const tags = splitTags(draft);
    if (!tags.length) return;
    onChange(Array.from(new Set([...value, ...tags])));
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-slate-700">{label}</label>
      {hint && <p className="text-[12px] text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[12px] hover:bg-slate-200"
            title="Remove"
          >
            {tag}
            <span className="text-slate-400">×</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder || 'Type and press Enter'}
          className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
        />
        <button
          type="button"
          onClick={commit}
          className="px-3 py-2 text-[13px] font-medium border border-slate-200 rounded-md hover:bg-slate-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

const GrantsFundingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const highlightId = searchParams.get('grantId');

  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [draftGrant, setDraftGrant] = useState<{ id: string; title: string } | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [matches, setMatches] = useState<GrantMatch[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    keywords: [],
    disciplines: [],
    regions: [],
    funding_types: [],
    career_stage: 'any',
    notify_in_app: true,
    notify_email: true,
    min_funding: null,
    max_funding: null,
  });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [fundingTypeFilter, setFundingTypeFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [fitGapLoadingId, setFitGapLoadingId] = useState<string | null>(null);
  const [fitGapResult, setFitGapResult] = useState<{
    grantTitle: string;
    analysis: {
      fit_score?: number;
      narrative?: string;
      covered?: Array<{ area?: string; evidence?: string }>;
      gaps?: Array<{ area?: string; severity?: string; suggestion?: string }>;
      next_steps?: string[];
      mode?: string;
    };
  } | null>(null);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const runFitGap = async (grant: Grant) => {
    setFitGapLoadingId(grant.id);
    try {
      const response = await fetch(`${apiBaseUrl}/grants/${grant.id}/fit-gap`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fit-gap analysis failed');
      }
      setFitGapResult({ grantTitle: grant.title, analysis: data.analysis || {} });
    } catch (e) {
      console.error(e);
      alert(formatApiNetworkError(e, 'Could not analyze fit gap'));
    } finally {
      setFitGapLoadingId(null);
    }
  };

  const loadGrants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (disciplineFilter) params.append('discipline', disciplineFilter);
      if (regionFilter) params.append('region', regionFilter);
      if (fundingTypeFilter) params.append('fundingType', fundingTypeFilter);
      const response = await fetch(`${apiBaseUrl}/grants?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setGrants(data.grants || []);
    } catch (e) {
      console.error(e);
      setGrants([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/grants/matches/me`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (e) {
      console.error(e);
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/grants/preferences/me`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.preferences) {
        setPreferences({
          keywords: data.preferences.keywords || [],
          disciplines: data.preferences.disciplines || [],
          regions: data.preferences.regions || [],
          funding_types: data.preferences.funding_types || [],
          career_stage: data.preferences.career_stage || 'any',
          notify_in_app: Boolean(data.preferences.notify_in_app ?? true),
          notify_email: Boolean(data.preferences.notify_email ?? true),
          min_funding: data.preferences.min_funding != null ? Number(data.preferences.min_funding) : null,
          max_funding: data.preferences.max_funding != null ? Number(data.preferences.max_funding) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPrefsLoaded(true);
    }
  };

  const savePreferences = async (andGoToMatches: boolean) => {
    setSavingPrefs(true);
    setPrefsMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/grants/preferences`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          keywords: preferences.keywords,
          disciplines: preferences.disciplines,
          regions: preferences.regions,
          fundingTypes: preferences.funding_types,
          careerStage: preferences.career_stage === 'any' ? null : preferences.career_stage,
          notifyInApp: preferences.notify_in_app,
          notifyEmail: preferences.notify_email,
          minFunding: preferences.min_funding,
          maxFunding: preferences.max_funding,
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      const data = await response.json();
      await loadMatches();
      const count = data.matchCount ?? 0;
      setPrefsMessage(
        andGoToMatches
          ? `Preferences saved. ${count} matching call${count === 1 ? '' : 's'} found.`
          : 'Preferences saved.'
      );
      if (andGoToMatches) setActiveTab('matches');
    } catch (e) {
      console.error(e);
      setPrefsMessage('Could not save preferences. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const postGrant = async (form: GrantPostFormValues) => {
    setPosting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/grants`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          sponsor: form.sponsor,
          fundingType: form.fundingType,
          fundingMin: form.fundingMin ? Number(form.fundingMin) : null,
          fundingMax: form.fundingMax ? Number(form.fundingMax) : null,
          fundingCurrency: form.fundingCurrency,
          deadlineDate: form.deadlineDate || null,
          url: form.url,
          region: form.region,
          country: form.country,
          disciplines: splitTags(form.disciplines),
        }),
      });
      if (!response.ok) throw new Error('Failed to post');
      setShowPostForm(false);
      await loadGrants();
      await loadMatches();
    } catch (e) {
      console.error(e);
      alert('Could not post funding opportunity. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const deleteGrant = async (grant: Grant) => {
    if (!confirm(`Delete “${grant.title}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${apiBaseUrl}/grants/${grant.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      await loadGrants();
      await loadMatches();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Could not delete grant');
    }
  };

  useEffect(() => {
    void loadGrants();
    void loadPreferences();
    void loadMatches();
  }, []);

  useEffect(() => {
    if (highlightId) {
      setActiveTab('discover');
    }
  }, [highlightId]);

  useEffect(() => {
    if (activeTab === 'discover') void loadGrants();
    if (activeTab === 'matches') void loadMatches();
  }, [activeTab]);

  useEffect(() => {
    if (!highlightId || loading || grants.length === 0) return;
    const el = cardRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, loading, grants]);

  const matchById = useMemo(() => {
    const map = new Map<string, GrantMatch>();
    matches.forEach((m) => map.set(m.id, m));
    return map;
  }, [matches]);

  const scoredMatchCount = useMemo(
    () => matches.filter((m) => Number(m.match_score) > 0).length,
    [matches]
  );

  const closingSoonCount = useMemo(
    () => grants.filter((g) => isClosingWithinDays(g.deadline_date, 30)).length,
    [grants]
  );

  const sortedGrants = useMemo(() => {
    const list = [...grants];
    list.sort((a, b) => {
      if (sortKey === 'newest') {
        return String(b.created_at || '').localeCompare(String(a.created_at || ''));
      }
      if (sortKey === 'amount') {
        const aMax = a.funding_max ?? a.funding_min ?? 0;
        const bMax = b.funding_max ?? b.funding_min ?? 0;
        return Number(bMax) - Number(aMax);
      }
      const aD = a.deadline_date || '9999-12-31';
      const bD = b.deadline_date || '9999-12-31';
      return String(aD).localeCompare(String(bD));
    });
    return list;
  }, [grants, sortKey]);

  const displayedMatches = useMemo(() => {
    let list = [...matches].filter((m) => Number(m.match_score) > 0);
    if (eligibleOnly) list = list.filter((m) => m.is_eligible);
    list.sort((a, b) => Number(b.match_score) - Number(a.match_score));
    return list;
  }, [matches, eligibleOnly]);

  const prefsConfigured = hasPreferencesConfigured(preferences);

  const clearHighlight = () => {
    if (searchParams.has('grantId')) {
      searchParams.delete('grantId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Grants & funding"
        accent="amber"
        icon={<CurrencyDollarIcon />}
        subtitle={
          <>
            Browse open calls, draft proposals with EU and international templates, and get ranked
            matches.{' '}
            <Link
              to="/events-opportunities"
              className="font-medium text-amber-900 hover:text-amber-950 underline-offset-2 hover:underline"
            >
              Event travel stipends live under Events
            </Link>
            .
          </>
        }
      >
        <div className="flex gap-1 border-b border-amber-200/60 overflow-x-auto">
          {(
            [
              { id: 'discover' as const, label: 'Discover' },
              { id: 'matches' as const, label: 'Matches', badge: scoredMatchCount },
              { id: 'write' as const, label: 'Write proposal' },
              { id: 'preferences' as const, label: 'Preferences' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'discover') clearHighlight();
              }}
              className={`relative px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors inline-flex items-center gap-2 ${
                activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {'badge' in tab && tab.badge > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-700 text-white text-[11px] leading-5 text-center">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-amber-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </PageHeader>

      {activeTab === 'discover' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PageStat label="Open calls" value={grants.length} accent="amber" />
            <PageStat label="Closing in 30 days" value={closingSoonCount} accent="orange" />
            <PageStat
              label="Your matches"
              value={scoredMatchCount}
              accent="emerald"
              action={
                <button
                  type="button"
                  onClick={() => setActiveTab(prefsConfigured ? 'matches' : 'preferences')}
                  className="text-[12px] font-medium text-emerald-800 hover:underline"
                >
                  {prefsConfigured ? 'View matches' : 'Set preferences'}
                </button>
              }
            />
          </div>

          <div className="bg-gradient-to-br from-amber-50/40 to-white border border-amber-100/80 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void loadGrants();
                  }}
                  placeholder="Search title, summary, or sponsor"
                  className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadGrants()}
                className="px-4 py-2 text-[13px] font-medium bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowPostForm(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800"
              >
                <PlusIcon className="w-4 h-4" />
                Post opportunity
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-2 text-[12px] text-slate-500 shrink-0">
                <FunnelIcon className="w-3.5 h-3.5" />
                Filters
              </div>
              <select
                value={fundingTypeFilter}
                onChange={(e) => setFundingTypeFilter(e.target.value)}
                className="px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white"
              >
                <option value="">All funding types</option>
                {FUNDING_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                placeholder="Region"
                className="px-3 py-2 text-[13px] border border-slate-200 rounded-md"
              />
              <input
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
                placeholder="Discipline"
                className="px-3 py-2 text-[13px] border border-slate-200 rounded-md"
              />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white md:ml-auto"
              >
                <option value="deadline">Sort: deadline soonest</option>
                <option value="newest">Sort: newest</option>
                <option value="amount">Sort: amount highest</option>
              </select>
              <button
                type="button"
                onClick={() => void loadGrants()}
                className="px-3 py-2 text-[13px] font-medium border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                {loading
                  ? 'Loading…'
                  : `${sortedGrants.length} opportunit${sortedGrants.length === 1 ? 'y' : 'ies'}`}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Open a call to review deadlines, draft a proposal, or check your match score
              </p>
            </div>
            {highlightId && (
              <button
                type="button"
                onClick={clearHighlight}
                className="text-[13px] font-medium text-amber-800 hover:underline self-start"
              >
                Clear highlight
              </button>
            )}
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {loading && (
              <div className="md:col-span-2 text-[13px] text-slate-500 py-10 text-center">
                Loading funding opportunities…
              </div>
            )}
            {!loading && sortedGrants.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 text-center py-14 px-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <CurrencyDollarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-1 tracking-tight">
                  No opportunities found
                </h3>
                <p className="text-[13px] text-slate-500 mb-5 max-w-md mx-auto leading-relaxed">
                  Try clearing filters, or post a call for the community.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPostForm(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Post opportunity
                </button>
              </div>
            )}
            {!loading &&
              sortedGrants.map((grant) => {
                const match = matchById.get(grant.id);
                return (
                  <GrantCard
                    key={grant.id}
                    grant={grant}
                    highlight={highlightId === grant.id}
                    showMatchBadge={Boolean(match && Number(match.match_score) > 0)}
                    matchScore={match && Number(match.match_score) > 0 ? Number(match.match_score) : null}
                    onOpenMatches={() => setActiveTab('matches')}
                    onDraftProposal={() => {
                      setDraftGrant({ id: grant.id, title: grant.title });
                      setActiveTab('write');
                    }}
                    onFitGap={() => void runFitGap(grant)}
                    fitGapLoading={fitGapLoadingId === grant.id}
                    onDelete={
                      user?.id && grant.createdBy === user.id
                        ? () => void deleteGrant(grant)
                        : undefined
                    }
                    cardRef={(el) => {
                      cardRefs.current[grant.id] = el;
                    }}
                  />
                );
              })}
          </div>

          {showPostForm && (
            <GrantPostForm
              submitting={posting}
              onCancel={() => setShowPostForm(false)}
              onSubmit={postGrant}
            />
          )}
        </div>
      )}

      {activeTab === 'write' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-[13px] text-teal-900">
            <p className="font-medium text-teal-950">Write grant narratives in Writing Studio</p>
            <p className="mt-1 text-teal-800/90">
              One manuscript workspace for papers, proposals, and grants — with citations and
              readiness checks. This legacy wizard remains for quick grant-only drafts.
            </p>
            <Link
              to="/writing-studio/new/grant"
              className="mt-2 inline-flex font-semibold underline underline-offset-2"
            >
              Open grant in Writing studio →
            </Link>
          </div>
          <GrantWritingWizard
            apiBaseUrl={apiBaseUrl}
            linkedGrantId={draftGrant?.id || null}
            linkedGrantTitle={draftGrant?.title || null}
            onClearLinkedGrant={() => setDraftGrant(null)}
          />
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Personalized matches</h2>
              <p className="text-[13px] text-slate-600 mt-0.5">
                Ranked with semantic profile matching plus your Preferences against open calls.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Eligible only
              </label>
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Edit preferences
              </button>
              <button
                type="button"
                onClick={() => void loadMatches()}
                className="px-3 py-2 text-[13px] font-medium bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {matchesLoading && (
            <div className="text-[13px] text-slate-500 py-10 text-center">Refreshing matches…</div>
          )}

          {!matchesLoading && !prefsConfigured && prefsLoaded && (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 text-center py-14 px-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-1 tracking-tight">
                Set Preferences to unlock Matches
              </h3>
              <p className="text-[13px] text-slate-500 mb-5 max-w-md mx-auto leading-relaxed">
                Tell us your disciplines, keywords, regions, and funding types. We will rank open calls that fit your profile.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Set Preferences
              </button>
            </div>
          )}

          {!matchesLoading && prefsConfigured && displayedMatches.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 text-center py-14 px-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <GlobeAltIcon className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-1 tracking-tight">
                No strong matches yet
              </h3>
              <p className="text-[13px] text-slate-500 mb-5 max-w-md mx-auto leading-relaxed">
                Widen keywords or disciplines, relax your funding band, or browse Discover for the full catalog.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preferences')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
                >
                  Widen Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-amber-900 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Browse Discover
                </button>
              </div>
            </div>
          )}

          {!matchesLoading && displayedMatches.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                  {displayedMatches.length}{' '}
                  {displayedMatches.length === 1 ? 'match' : 'matches'}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Ranked from your Preferences against open calls
                </p>
              </div>
              <div className="grid gap-3.5 md:grid-cols-2">
                {displayedMatches.map((match) => (
                  <GrantCard
                    key={match.id}
                    grant={match}
                    matchScore={Number(match.match_score)}
                    matchReasons={match.reasons || []}
                    isEligible={Boolean(match.is_eligible)}
                    onDraftProposal={() => {
                      setDraftGrant({ id: match.id, title: match.title });
                      setActiveTab('write');
                    }}
                    onFitGap={() => void runFitGap(match)}
                    fitGapLoading={fitGapLoadingId === match.id}
                    onDelete={
                      user?.id && match.createdBy === user.id
                        ? () => void deleteGrant(match)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Funding profile</h2>
            <p className="text-[13px] text-slate-600 mt-1">
              These settings power Matches and notifications. Save and refresh to re-rank open calls against your profile.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <TagField
                label="Keywords"
                hint="Topics you want funded (e.g. immunology, climate, AI datasets)"
                value={preferences.keywords}
                onChange={(keywords) => setPreferences((p) => ({ ...p, keywords }))}
                placeholder="Add keyword"
              />
              <TagField
                label="Disciplines"
                hint="Fields used for ranking overlap with each call"
                value={preferences.disciplines}
                onChange={(disciplines) => setPreferences((p) => ({ ...p, disciplines }))}
                placeholder="Add discipline"
              />
              <TagField
                label="Regions"
                hint="Geographic fit (e.g. United States, EU, Global, Sub-Saharan Africa)"
                value={preferences.regions}
                onChange={(regions) => setPreferences((p) => ({ ...p, regions }))}
                placeholder="Add region"
              />
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-slate-700">Funding types</label>
                <p className="text-[12px] text-slate-500">Select the instruments you care about</p>
                <div className="flex flex-wrap gap-2">
                  {FUNDING_TYPE_OPTIONS.map((opt) => {
                    const active = preferences.funding_types.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setPreferences((p) => ({
                            ...p,
                            funding_types: active
                              ? p.funding_types.filter((t) => t !== opt.value)
                              : [...p.funding_types, opt.value],
                          }))
                        }
                        className={`px-2.5 py-1.5 text-[12px] font-medium rounded-md border transition-colors ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-slate-700">Career stage</label>
                <select
                  value={preferences.career_stage || 'any'}
                  onChange={(e) => setPreferences((p) => ({ ...p, career_stage: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white"
                >
                  {CAREER_STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700">Min funding</label>
                  <input
                    type="number"
                    value={preferences.min_funding ?? ''}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        min_funding: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700">Max funding</label>
                  <input
                    type="number"
                    value={preferences.max_funding ?? ''}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        max_funding: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
              <label className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={preferences.notify_in_app}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, notify_in_app: e.target.checked }))
                  }
                />
                In-app notifications for new matches
              </label>
              <label className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={preferences.notify_email}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, notify_email: e.target.checked }))
                  }
                />
                Email notifications
              </label>
            </div>

            {prefsMessage && (
              <p className="text-[13px] text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-3 py-2">
                {prefsMessage}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingPrefs}
                onClick={() => void savePreferences(true)}
                className="inline-flex items-center px-4 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-60"
              >
                {savingPrefs ? 'Saving…' : 'Save & refresh matches'}
              </button>
              <button
                type="button"
                disabled={savingPrefs}
                onClick={() => void savePreferences(false)}
                className="px-4 py-2 text-[13px] font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-60"
              >
                Save only
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:underline"
              >
                View Matches
              </button>
            </div>
          </div>
        </div>
      )}

      {fitGapResult && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close fit gap"
            onClick={() => setFitGapResult(null)}
          />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">
                  Fit gap analysis
                </p>
                <h3 className="text-[16px] font-semibold text-slate-900 mt-0.5">
                  {fitGapResult.grantTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFitGapResult(null)}
                className="text-[13px] text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2">
              <span className="text-[13px] text-teal-900">Fit score</span>
              <span className="text-[15px] font-semibold text-teal-950">
                {Math.round(Number(fitGapResult.analysis.fit_score) || 0)} / 100
              </span>
            </div>

            {fitGapResult.analysis.narrative && (
              <p className="text-[13px] text-slate-700 leading-relaxed">
                {fitGapResult.analysis.narrative}
              </p>
            )}

            {(fitGapResult.analysis.covered || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1.5">Covered</p>
                <ul className="space-y-1.5">
                  {(fitGapResult.analysis.covered || []).map((c, i) => (
                    <li
                      key={`${c.area}-${i}`}
                      className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-[12px] text-slate-800"
                    >
                      <span className="font-medium">{c.area}</span>
                      {c.evidence ? (
                        <span className="text-slate-600"> — {c.evidence}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(fitGapResult.analysis.gaps || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1.5">Gaps</p>
                <ul className="space-y-1.5">
                  {(fitGapResult.analysis.gaps || []).map((g, i) => (
                    <li
                      key={`${g.area}-${i}`}
                      className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-[12px] text-slate-800"
                    >
                      <span className="font-medium capitalize">
                        {g.severity || 'gap'} — {g.area}
                      </span>
                      {g.suggestion ? (
                        <p className="mt-0.5 text-teal-900">{g.suggestion}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(fitGapResult.analysis.next_steps || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1.5">
                  Next steps
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[12px] text-slate-700">
                  {(fitGapResult.analysis.next_steps || []).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrantsFundingsPage;
