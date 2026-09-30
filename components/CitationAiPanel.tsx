/**
 * Citation AI panel — find accurate support for a selected claim,
 * or verify already-cited references (author + reviewer modes).
 */

import React, { useState } from 'react';
import { MagnifyingGlassIcon, ShieldCheckIcon, XMarkIcon } from './icons';
import { getAuthHeaders, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';

export type CitationAiCandidate = {
  paperId: string;
  title: string;
  authors: string[];
  year?: number | null;
  journal?: string | null;
  doi?: string | null;
  abstract?: string | null;
  source: 'library' | 'web';
  verdict: string;
  confidence: string;
  rationale: string;
  excerpt: string | null;
  integrity?: {
    verifyVerdict?: string;
    verifyConfidence?: string;
    isRetracted?: boolean;
    hasConcern?: boolean;
    isOa?: boolean;
    oaStatus?: string | null;
    oaUrl?: string | null;
    provider?: string;
  };
};

type Props = {
  claim: string;
  citedPaperIds?: string[];
  /** Paper ids already in the selection (for verify) */
  selectionPaperIds?: string[];
  onClose: () => void;
  onUsePaper: (paper: {
    id: string;
    title: string;
    authors?: Array<{ name: string }>;
    publicationYear?: number | null;
    journalName?: string | null;
    doi?: string | null;
    abstract?: string | null;
  }) => void;
};

const CitationAiPanel: React.FC<Props> = ({
  claim,
  citedPaperIds = [],
  selectionPaperIds = [],
  onClose,
  onUsePaper,
}) => {
  const apiBase = resolveApiBaseUrl();
  const [mode, setMode] = useState<'find' | 'verify'>(
    selectionPaperIds.length ? 'verify' : 'find'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [candidates, setCandidates] = useState<CitationAiCandidate[]>([]);
  const [verifyRows, setVerifyRows] = useState<
    Array<{
      paperId: string;
      title: string;
      verdict: string;
      confidence: string;
      rationale: string;
      excerpt: string | null;
      reviewerNote: string;
      integrity?: {
        verifyVerdict?: string;
        isRetracted?: boolean;
        hasConcern?: boolean;
      };
    }>
  >([]);
  const [overall, setOverall] = useState<string | null>(null);

  const runFind = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setCandidates([]);
    try {
      const res = await fetch(`${apiBase}/writing/citations/suggest`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          claim,
          excludePaperIds: citedPaperIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Citation search failed');
      setDisclaimer(data.disclaimer || '');
      setMessage(data.message || null);
      setCandidates(data.candidates || []);
      if (!data.found) {
        setError(null);
      }
    } catch (e: unknown) {
      setError(formatApiNetworkError(e) || (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runVerify = async () => {
    const ids = selectionPaperIds.length ? selectionPaperIds : citedPaperIds;
    if (!ids.length) {
      setError('No citation in the selection to verify. Select text that includes a citation, or use Find.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setVerifyRows([]);
    try {
      const res = await fetch(`${apiBase}/writing/citations/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ claim, paperIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setDisclaimer(data.disclaimer || '');
      setMessage(data.message || null);
      setOverall(data.overall || null);
      setVerifyRows(data.assessments || []);
    } catch (e: unknown) {
      setError(formatApiNetworkError(e) || (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verdictClass = (v: string) => {
    if (v === 'supports' || v === 'support') return 'text-emerald-800 bg-emerald-50';
    if (v === 'partially_supports' || v === 'partially_support') return 'text-amber-900 bg-amber-50';
    if (v === 'contradicts' || v === 'contradict') return 'text-rose-800 bg-rose-50';
    return 'text-slate-700 bg-slate-100';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center">
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-label="Citation AI"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">
              Citation AI
            </p>
            <h3 className="text-[15px] font-semibold text-slate-900">
              {mode === 'find' ? 'Find supporting reference' : 'Verify cited reference'}
            </h3>
            <p className="mt-1 line-clamp-3 text-[12px] text-slate-500">
              “{claim}”
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-100 px-4 py-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              mode === 'find' ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            onClick={() => setMode('find')}
          >
            Find (author)
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              mode === 'verify' ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            onClick={() => setMode('verify')}
          >
            Verify (reviewer)
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Library first, then literature search. Only accurate support is offered — otherwise we
            say we could not find a suitable reference.
          </p>

          {mode === 'find' ? (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
              disabled={loading}
              onClick={() => void runFind()}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              {loading ? 'Searching library + literature…' : 'Find accurate citation'}
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
              disabled={loading}
              onClick={() => void runVerify()}
            >
              <ShieldCheckIcon className="h-4 w-4" />
              {loading ? 'Reviewing citation…' : 'Verify citation against claim'}
            </button>
          )}

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              className={`rounded-lg px-3 py-2 text-[12px] ${
                candidates.length || overall === 'adequate'
                  ? 'border border-teal-200 bg-teal-50 text-teal-900'
                  : 'border border-amber-200 bg-amber-50 text-amber-950'
              }`}
            >
              {message}
            </p>
          ) : null}
          {disclaimer ? (
            <p className="text-[10px] text-slate-400">{disclaimer}</p>
          ) : null}

          {mode === 'find' &&
            candidates.map((c) => (
              <div
                key={c.paperId}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${verdictClass(
                      c.verdict
                    )}`}
                  >
                    {c.verdict.replace(/_/g, ' ')} · {c.confidence}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                    {c.source === 'library' ? 'Your library' : 'Literature'}
                  </span>
                  {c.integrity?.verifyVerdict === 'matched' ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      Metadata verified
                    </span>
                  ) : null}
                  {c.integrity?.verifyVerdict === 'ambiguous' ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
                      Ambiguous ID
                    </span>
                  ) : null}
                  {c.integrity?.hasConcern ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
                      Correction / concern
                    </span>
                  ) : null}
                  {c.integrity?.isOa ? (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200">
                      OA{c.integrity.oaStatus ? ` · ${c.integrity.oaStatus}` : ''}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{c.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {(c.authors || []).slice(0, 3).join(', ')}
                  {c.year ? ` (${c.year})` : ''}
                  {c.journal ? ` · ${c.journal}` : ''}
                  {c.doi ? ` · ${c.doi}` : ''}
                </p>
                <p className="mt-2 text-[12px] text-slate-600">{c.rationale}</p>
                {c.excerpt ? (
                  <p className="mt-1 border-l-2 border-teal-300 pl-2 text-[11px] italic text-slate-500">
                    {c.excerpt}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-teal-800 hover:underline"
                    onClick={() =>
                      onUsePaper({
                        id: c.paperId,
                        title: c.title,
                        authors: (c.authors || []).map((name) => ({ name })),
                        publicationYear: c.year,
                        journalName: c.journal,
                        doi: c.doi,
                        abstract: c.abstract,
                      })
                    }
                  >
                    Cite this reference
                  </button>
                  {c.integrity?.oaUrl ? (
                    <a
                      href={c.integrity.oaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-semibold text-sky-800 hover:underline"
                    >
                      Open OA PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}

          {mode === 'verify' &&
            verifyRows.map((a) => (
              <div
                key={a.paperId}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${verdictClass(
                      a.verdict
                    )}`}
                  >
                    {a.verdict.replace(/_/g, ' ')} · {a.confidence}
                  </span>
                  {a.integrity?.isRetracted ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
                      Retracted
                    </span>
                  ) : null}
                  {a.integrity?.verifyVerdict === 'mismatch' ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
                      Fabrication risk
                    </span>
                  ) : null}
                  {a.integrity?.verifyVerdict === 'matched' ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      Metadata verified
                    </span>
                  ) : null}
                  {a.integrity?.isOa ? (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200">
                      OA{a.integrity.oaStatus ? ` · ${a.integrity.oaStatus}` : ''}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{a.title}</p>
                <p className="mt-1 text-[12px] text-slate-600">{a.rationale}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-700">{a.reviewerNote}</p>
                {a.excerpt ? (
                  <p className="mt-1 border-l-2 border-slate-300 pl-2 text-[11px] italic text-slate-500">
                    {a.excerpt}
                  </p>
                ) : null}
                {a.integrity?.oaUrl ? (
                  <a
                    href={a.integrity.oaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[12px] font-semibold text-sky-800 hover:underline"
                  >
                    Open OA PDF
                  </a>
                ) : null}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CitationAiPanel;
