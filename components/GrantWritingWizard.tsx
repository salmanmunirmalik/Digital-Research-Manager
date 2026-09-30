import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { useAuth } from '../contexts/AuthContext';
import {
  GRANT_WRITING_TEMPLATES,
  GrantDraftContent,
  GrantTemplateId,
  countWords,
  draftCompletion,
  draftToMarkdown,
  draftToProposalAgentInput,
  draftWordCount,
  emptyGrantDraft,
  getGrantTemplate,
  getSectionContent,
  setSectionContent,
} from '../utils/grantWritingTemplates';
import {
  downloadGrantDraftMarkdown,
  downloadGrantDraftPdf,
  grantDraftPdfBlobUrl,
} from '../utils/grantDraftPdf';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EyeIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from './icons';

type WizardMode = 'list' | 'create' | 'edit';

type SavedWriteup = {
  id: string;
  title: string | null;
  template_type: string | null;
  grant_id?: string | null;
  status?: string | null;
  content: GrantDraftContent | string;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
  created_at?: string;
};

type Props = {
  apiBaseUrl: string;
  linkedGrantId?: string | null;
  linkedGrantTitle?: string | null;
  onClearLinkedGrant?: () => void;
};

const regionLabel = (region: string) => {
  if (region === 'eu') return 'Europe';
  if (region === 'us') return 'United States';
  return 'International';
};

const parseContent = (raw: unknown): GrantDraftContent => {
  if (raw && typeof raw === 'object' && 'templateId' in (raw as object)) {
    return raw as GrantDraftContent;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.templateId) return parsed as GrantDraftContent;
    } catch {
      /* fall through */
    }
  }
  return emptyGrantDraft('generic');
};

const GrantWritingWizard: React.FC<Props> = ({
  apiBaseUrl,
  linkedGrantId = null,
  linkedGrantTitle = null,
  onClearLinkedGrant,
}) => {
  const { token: authToken } = useAuth();
  const token =
    authToken ||
    (typeof localStorage !== 'undefined'
      ? getAuthToken()
      : null);

  const [mode, setMode] = useState<WizardMode>('list');
  const [writeups, setWriteups] = useState<SavedWriteup[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [draft, setDraft] = useState<GrantDraftContent>(() => emptyGrantDraft('generic'));
  const [writeupId, setWriteupId] = useState<string | null>(null);
  const [linkedId, setLinkedId] = useState<string | null>(linkedGrantId);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<number | null>(null);

  const template = useMemo(() => getGrantTemplate(draft.templateId), [draft.templateId]);
  const completion = useMemo(() => draftCompletion(draft), [draft]);
  const words = useMemo(() => draftWordCount(draft), [draft]);

  const sectionSteps = template.sections;
  const totalSteps = 2 + sectionSteps.length;
  const isMetaStep = step === 0;
  const isReviewStep = step === totalSteps - 1;
  const sectionIndex = step - 1;
  const activeSection = !isMetaStep && !isReviewStep ? sectionSteps[sectionIndex] : null;

  const authHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadWriteups = async () => {
    if (!token) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/grants/writeups`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load drafts');
      setWriteups(data.writeups || []);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Failed to load drafts');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (mode === 'list') void loadWriteups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, token]);

  useEffect(() => {
    if (linkedGrantId) {
      setLinkedId(linkedGrantId);
      if (mode === 'list') {
        const next = emptyGrantDraft(
          /horizon|erc|europe/i.test(linkedGrantTitle || '') ? 'horizon_europe' : 'generic'
        );
        if (linkedGrantTitle) {
          next.title = `Application: ${linkedGrantTitle}`;
          next.callOrProgram = linkedGrantTitle;
        }
        if (/horizon|europe|erc|msca/i.test(linkedGrantTitle || '')) {
          next.templateId = /erc/i.test(linkedGrantTitle || '') ? 'erc' : 'horizon_europe';
          const t = getGrantTemplate(next.templateId);
          next.fundingAgency = t.agency;
          next.currency = 'EUR';
          next.sections = t.sections.map((s) => ({ sectionId: s.id, content: '' }));
        }
        setDraft(next);
        setWriteupId(null);
        setStep(0);
        setMode('create');
        setMessage(`Draft started for “${linkedGrantTitle || 'selected call'}”.`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedGrantId]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    };
  }, [pdfPreviewUrl]);

  const markDirty = (updater: React.SetStateAction<GrantDraftContent>) => {
    setDraft(updater);
    setDirty(true);
  };

  const startNew = (templateId: GrantTemplateId = 'generic') => {
    const next = emptyGrantDraft(templateId);
    if (linkedGrantTitle) next.title = `Application: ${linkedGrantTitle}`;
    if (linkedGrantTitle && !next.callOrProgram) next.callOrProgram = linkedGrantTitle;
    setDraft(next);
    setWriteupId(null);
    setLinkedId(linkedGrantId);
    setStep(0);
    setMessage(null);
    setError(null);
    setDirty(false);
    setMode('create');
  };

  const openWriteup = (row: SavedWriteup) => {
    setDraft(parseContent(row.content));
    setWriteupId(row.id);
    setLinkedId(row.grant_id || null);
    setStep(0);
    setMessage(null);
    setError(null);
    setDirty(false);
    setMode('edit');
  };

  const selectTemplate = (templateId: GrantTemplateId) => {
    const nextTemplate = getGrantTemplate(templateId);
    markDirty((prev) => {
      const base = emptyGrantDraft(templateId);
      return {
        ...base,
        title: prev.title,
        researchQuestion: prev.researchQuestion,
        fundingAgency: prev.fundingAgency || nextTemplate.agency,
        callOrProgram: prev.callOrProgram,
        durationMonths: prev.durationMonths,
        totalBudget: prev.totalBudget,
        currency: prev.currency || base.currency,
        sections: base.sections.map((s) => ({
          ...s,
          content: getSectionContent(prev, s.sectionId) || s.content,
        })),
      };
    });
  };

  const updateMeta = <K extends keyof GrantDraftContent>(key: K, value: GrantDraftContent[K]) => {
    markDirty((prev) => ({ ...prev, [key]: value }));
  };

  const updateSection = (sectionId: string, content: string) => {
    markDirty((prev) => setSectionContent(prev, sectionId, content));
  };

  const saveDraft = async (andClose = false): Promise<string | null> => {
    if (!token) {
      setError('Sign in to save drafts.');
      return null;
    }
    if (!draft.title.trim()) {
      setError('Add a working title before saving.');
      setStep(0);
      return null;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const body = {
        title: draft.title.trim(),
        templateType: draft.templateId,
        grantId: linkedId || null,
        status: 'draft',
        content: draft,
        metadata: {
          completionPercent: completion.percent,
          wordCount: words,
          fundingAgency: draft.fundingAgency,
          callOrProgram: draft.callOrProgram,
          linkedGrantTitle: linkedGrantTitle || null,
        },
      };
      const url = writeupId
        ? `${apiBaseUrl}/grants/writeups/${writeupId}`
        : `${apiBaseUrl}/grants/writeups`;
      const res = await fetch(url, {
        method: writeupId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      const id = data.writeup?.id as string | undefined;
      if (id) setWriteupId(id);
      setDirty(false);
      setMessage('Draft saved.');
      if (andClose) {
        setMode('list');
        void loadWriteups();
      }
      return id || writeupId;
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Save failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Autosave 2.5s after edits when already created
  useEffect(() => {
    if (!dirty || !writeupId || !token || mode === 'list') return;
    if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(() => {
      void saveDraft(false);
    }, 2500);
    return () => {
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, writeupId, mode]);

  const deleteWriteup = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Delete this grant draft? This cannot be undone.')) return;
    try {
      const res = await fetch(`${apiBaseUrl}/grants/writeups/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setWriteups((prev) => prev.filter((w) => w.id !== id));
      if (writeupId === id) {
        setMode('list');
        setWriteupId(null);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Delete failed');
    }
  };

  const duplicateWriteup = async (row: SavedWriteup) => {
    if (!token) return;
    try {
      const content = parseContent(row.content);
      content.title = `${content.title || row.title || 'Untitled'} (copy)`;
      const res = await fetch(`${apiBaseUrl}/grants/writeups`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: content.title,
          templateType: content.templateId,
          grantId: row.grant_id || null,
          status: 'draft',
          content,
          metadata: { ...(row.metadata || {}), duplicatedFrom: row.id },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Duplicate failed');
      await loadWriteups();
      setMessage('Draft duplicated.');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Duplicate failed');
    }
  };

  const runAiAssist = async () => {
    if (!token) {
      setError('Sign in to use AI assist.');
      return;
    }
    if (!draft.title.trim()) {
      setError('Add a title before generating a draft.');
      setStep(0);
      return;
    }
    setAiLoading(true);
    setError(null);
    setMessage(null);
    try {
      const input = draftToProposalAgentInput(draft);
      const res = await fetch(`${apiBaseUrl}/agents/proposal_writing/execute`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || 'AI generation failed');
      }
      const proposal = data.content?.proposal || data.result?.proposal || data.content;
      if (!proposal || typeof proposal !== 'object') {
        throw new Error('AI returned an unexpected format');
      }

      markDirty((prev) => {
        let next = { ...prev };
        const map: Record<string, string> = {
          gen_summary: proposal.executiveSummary || '',
          gen_background: proposal.background || '',
          gen_objectives: Array.isArray(proposal.objectives)
            ? proposal.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
            : '',
          gen_methodology: proposal.methodology || '',
          gen_outcomes: Array.isArray(proposal.expectedOutcomes)
            ? proposal.expectedOutcomes.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
            : '',
          gen_timeline: proposal.timeline || '',
          gen_budget: proposal.budgetJustification || '',
          nih_specific_aims: proposal.executiveSummary || '',
          nih_significance: proposal.background || '',
          nih_approach: proposal.methodology || '',
          nih_timeline: proposal.timeline || '',
          he_objectives_ambition: [
            proposal.executiveSummary,
            Array.isArray(proposal.objectives)
              ? proposal.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
              : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          he_methodology: proposal.methodology || '',
          he_pathways_impact: Array.isArray(proposal.expectedOutcomes)
            ? proposal.expectedOutcomes.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
            : '',
          he_work_plan: proposal.timeline || '',
          erc_part1_state_of_knowledge: proposal.background || '',
          erc_part1_objectives: Array.isArray(proposal.objectives)
            ? proposal.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
            : '',
          erc_part1_strategy: proposal.methodology || '',
          erc_part2_methodology: proposal.methodology || '',
          erc_part2_workplan: proposal.timeline || '',
          nsf_summary_overview: proposal.executiveSummary || '',
          nsf_objectives_background: proposal.background || '',
          nsf_intellectual_merit: proposal.methodology || '',
          nsf_broader_impacts: Array.isArray(proposal.expectedOutcomes)
            ? proposal.expectedOutcomes.join('\n')
            : '',
          nsf_workplan: proposal.timeline || '',
        };

        for (const section of getGrantTemplate(prev.templateId).sections) {
          const generated = map[section.id];
          if (generated && !getSectionContent(prev, section.id).trim()) {
            next = setSectionContent(next, section.id, generated);
          }
        }
        return next;
      });
      setMessage('AI filled empty sections. Review and edit before exporting.');
      setStep(1);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(draftToMarkdown(draft));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const openPdfPreview = () => {
    try {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      const url = grantDraftPdfBlobUrl(draft);
      setPdfPreviewUrl(url);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Could not build PDF preview');
    }
  };

  const handleDownloadPdf = async () => {
    await saveDraft(false);
    try {
      downloadGrantDraftPdf(draft);
      setMessage('PDF downloaded.');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'PDF download failed');
    }
  };

  if (mode === 'list') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3">
          <p className="text-[13px] font-semibold text-teal-950">Preferred: Writing Studio</p>
          <p className="mt-1 text-[12px] text-teal-900/90 leading-relaxed">
            Draft grant sections with citations, readiness checks, and export alongside papers and
            proposals.
          </p>
          <Link
            to={`/writing-studio/new/grant${linkedId ? `?grantId=${encodeURIComponent(linkedId)}` : ''}`}
            className="mt-2 inline-flex text-[13px] font-semibold text-teal-900 underline underline-offset-2"
          >
            Continue in Writing studio →
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Legacy proposal drafts</h2>
            <p className="text-[13px] text-slate-600 mt-0.5">
              Quick grant-only wizard (kept for existing drafts). Prefer Writing Studio for new work.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startNew('generic')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-[13px] font-medium px-3.5 py-2 hover:bg-slate-50"
          >
            <DocumentTextIcon className="w-4 h-4" />
            New legacy draft
          </button>
        </div>

        {error && (
          <div className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="text-[13px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {GRANT_WRITING_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => startNew(t.id)}
              className="text-left bg-white border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[13px] font-semibold text-slate-900">{t.shortName}</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
                  {regionLabel(t.region)}
                </span>
              </div>
              <p className="text-[12px] text-slate-600 line-clamp-3">{t.description}</p>
              <div className="mt-2 text-[11px] text-slate-500">
                {t.sections.length} sections
                {t.pageLimit ? ` · ~${t.pageLimit} pp` : ''}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-900">Your drafts</h3>
            {loadingList && <span className="text-[12px] text-slate-500">Loading…</span>}
          </div>
          {!loadingList && writeups.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-slate-500">
              No drafts yet. Pick a template above to start.
            </div>
          )}
          <ul className="divide-y divide-slate-100">
            {writeups.map((w) => {
              const content = parseContent(w.content);
              const tmpl = getGrantTemplate(
                (content.templateId || w.template_type || 'generic') as GrantTemplateId
              );
              const pct =
                typeof w.metadata === 'object' && w.metadata && 'completionPercent' in w.metadata
                  ? Number((w.metadata as { completionPercent?: number }).completionPercent)
                  : draftCompletion(content).percent;
              return (
                <li key={w.id} className="px-4 py-3 flex items-center gap-3 justify-between">
                  <button
                    type="button"
                    onClick={() => openWriteup(w)}
                    className="text-left min-w-0 flex-1"
                  >
                    <div className="text-[13px] font-medium text-slate-900 truncate">
                      {w.title || 'Untitled draft'}
                    </div>
                    <div className="text-[12px] text-slate-500">
                      {tmpl.shortName} · {pct}% complete
                      {w.updated_at
                        ? ` · updated ${new Date(w.updated_at).toLocaleDateString()}`
                        : ''}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const c = parseContent(w.content);
                        try {
                          downloadGrantDraftPdf(c, w.title || undefined);
                        } catch {
                          setError('PDF download failed');
                        }
                      }}
                      className="text-[12px] text-slate-500 hover:text-slate-900 px-2 py-1"
                      title="Download PDF"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => void duplicateWriteup(w)}
                      className="text-[12px] text-slate-500 hover:text-slate-900 px-2 py-1"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteWriteup(w.id)}
                      className="text-[12px] text-slate-500 hover:text-red-700 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => {
              if (dirty && !window.confirm('Discard unsaved changes?')) return;
              setMode('list');
              setMessage(null);
              setError(null);
              onClearLinkedGrant?.();
            }}
            className="inline-flex items-center gap-1 text-[12px] text-slate-600 hover:text-slate-900 mb-1"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            All drafts
          </button>
          <h2 className="text-[15px] font-semibold text-slate-900">
            {writeupId ? 'Edit proposal draft' : 'New proposal draft'}
            {dirty && <span className="ml-2 text-[11px] font-normal text-amber-700">Unsaved</span>}
          </h2>
          <p className="text-[13px] text-slate-600 mt-0.5">
            {template.name} · {words} words
            {template.wordLimit ? ` / ~${template.wordLimit} target` : ''} · {completion.percent}% of
            required sections
            {writeupId ? ' · autosave on' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runAiAssist()}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <SparklesIcon className="w-4 h-4" />
            {aiLoading ? 'Generating…' : 'AI fill empty sections'}
          </button>
          <button
            type="button"
            onClick={openPdfPreview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50"
          >
            <EyeIcon className="w-4 h-4" />
            Preview PDF
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => void saveDraft(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-[13px] font-medium px-3.5 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            <ClipboardDocumentCheckIcon className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`text-[13px] rounded-lg px-3 py-2 border ${
            error
              ? 'text-red-700 bg-red-50 border-red-100'
              : 'text-emerald-800 bg-emerald-50 border-emerald-100'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const label =
            i === 0
              ? 'Setup'
              : i === totalSteps - 1
                ? 'Review'
                : sectionSteps[i - 1]?.title.split('—')[0] || `S${i}`;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                step === i
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              title={label}
            >
              {i === 0 || i === totalSteps - 1 ? label : i}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
        {isMetaStep && (
          <>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                Template format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {GRANT_WRITING_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t.id)}
                    className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      draft.templateId === t.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[13px] font-medium text-slate-900">{t.shortName}</div>
                    <div className="text-[11px] text-slate-500">{regionLabel(t.region)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-[12px] text-slate-600 space-y-1">
              <div className="font-medium text-slate-800">Evaluation focus</div>
              <div>{template.evaluationCriteria.join(' · ')}</div>
              {template.tips[0] && <div className="pt-1">{template.tips[0]}</div>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Working title
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={draft.title}
                  onChange={(e) => updateMeta('title', e.target.value)}
                  placeholder="Project title"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Research question
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300 min-h-[72px]"
                  value={draft.researchQuestion}
                  onChange={(e) => updateMeta('researchQuestion', e.target.value)}
                  placeholder="Central question or hypothesis"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Funding agency
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={draft.fundingAgency}
                  onChange={(e) => updateMeta('fundingAgency', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Call / programme
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={draft.callOrProgram}
                  onChange={(e) => updateMeta('callOrProgram', e.target.value)}
                  placeholder="e.g. HORIZON-CL4-2026-… / R01 / CAREER"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Duration (months)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={draft.durationMonths}
                  onChange={(e) => updateMeta('durationMonths', e.target.value)}
                  placeholder="36"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Budget</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={draft.totalBudget}
                    onChange={(e) => updateMeta('totalBudget', e.target.value)}
                    placeholder="1500000"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={draft.currency}
                    onChange={(e) => updateMeta('currency', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection && (
          <>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
                {activeSection.group}
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900 mt-0.5">
                {activeSection.title}
              </h3>
              <p className="text-[13px] text-slate-600 mt-1">{activeSection.description}</p>
            </div>
            <ul className="text-[12px] text-slate-600 space-y-1 list-disc pl-4">
              {activeSection.guidance.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-300 min-h-[220px]"
              value={getSectionContent(draft, activeSection.id)}
              onChange={(e) => updateSection(activeSection.id, e.target.value)}
              placeholder={activeSection.placeholder}
            />
            <div className="flex items-center justify-between text-[12px] text-slate-500">
              <span>
                {countWords(getSectionContent(draft, activeSection.id))} words
                {activeSection.suggestedWords
                  ? ` · suggested ~${activeSection.suggestedWords}`
                  : ''}
                {activeSection.suggestedPages ? ` · ~${activeSection.suggestedPages} pp` : ''}
              </span>
              {activeSection.required ? (
                <span className="text-amber-700">Required</span>
              ) : (
                <span>Optional</span>
              )}
            </div>
          </>
        )}

        {isReviewStep && (
          <>
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Review & export</h3>
                <p className="text-[13px] text-slate-600">
                  {completion.requiredFilled}/{completion.requiredTotal} required sections filled.
                  Preview or download PDF, then remap into the official portal template before
                  submission.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 space-y-1">
              {template.officialNotes.map((n) => (
                <div key={n}>• {n}</div>
              ))}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {template.sections.map((s) => {
                const content = getSectionContent(draft, s.id);
                return (
                  <div key={s.id} className="border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-[13px] font-medium text-slate-900">{s.title}</div>
                      <button
                        type="button"
                        className="text-[11px] text-slate-500 hover:text-slate-800"
                        onClick={() =>
                          setStep(template.sections.findIndex((x) => x.id === s.id) + 1)
                        }
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-[12px] text-slate-600 whitespace-pre-wrap">
                      {content.trim() || '— Empty —'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openPdfPreview}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50"
              >
                <EyeIcon className="w-4 h-4" />
                Preview PDF
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadGrantDraftMarkdown(draft);
                  setMessage('Markdown downloaded.');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Download Markdown
              </button>
              <button
                type="button"
                onClick={() => void copyMarkdown()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium px-3 py-2 text-slate-800 hover:bg-slate-50"
              >
                <DocumentTextIcon className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy Markdown'}
              </button>
              <button
                type="button"
                onClick={() => void saveDraft(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-[13px] font-medium px-3.5 py-2 hover:bg-slate-800 disabled:opacity-50"
              >
                Save & close
              </button>
              {writeupId && (
                <button
                  type="button"
                  onClick={() => void deleteWriteup(writeupId)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-700 text-[13px] font-medium px-3 py-2 hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete draft
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-700 disabled:opacity-40"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        {!isReviewStep && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-[13px] font-medium px-3.5 py-2 hover:bg-slate-800"
          >
            Continue
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">PDF preview</h3>
                <p className="text-[12px] text-slate-500">
                  Working draft layout — remap into the official call template before submitting.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium px-3 py-1.5 hover:bg-slate-800"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                  aria-label="Close preview"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe title="Grant draft PDF preview" src={pdfPreviewUrl} className="flex-1 w-full bg-slate-100" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GrantWritingWizard;
