/**
 * In-pack AI actions: summarize, captions, claim check, draft Results.
 */

import React, { useState } from 'react';
import axios from 'axios';
import { SparklesIcon } from '../icons';
import {
  EvidencePackData,
  buildPackAIContext,
} from '../../utils/evidencePack';
import { getAuthHeaders } from '../../utils/apiBase';

type Action = 'summarize' | 'captions' | 'claim_check' | 'draft_results';

type Props = {
  title: string;
  summary: string;
  methodology: string;
  conclusions: string;
  pack: EvidencePackData;
  onApplySummary?: (summary: string) => void;
  onApplyMethodology?: (text: string) => void;
  onApplyConclusions?: (text: string) => void;
};

const ACTIONS: { id: Action; label: string; description: string }[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'One-line pack summary + key findings',
  },
  {
    id: 'captions',
    label: 'Captions',
    description: 'Figure titles & legends from pack content',
  },
  {
    id: 'claim_check',
    label: 'Check claims',
    description: 'Do text findings match tables & sheets?',
  },
  {
    id: 'draft_results',
    label: 'Draft Results',
    description: 'Paper-style Results + conclusions',
  },
];

function renderStructured(
  action: Action,
  structured: Record<string, unknown> | undefined,
  raw: string
): React.ReactNode {
  if (!structured) {
    return <pre className="whitespace-pre-wrap text-[12px] text-slate-700">{raw}</pre>;
  }

  if (action === 'summarize') {
    const findings = Array.isArray(structured.key_findings)
      ? (structured.key_findings as string[])
      : [];
    const questions = Array.isArray(structured.open_questions)
      ? (structured.open_questions as string[])
      : [];
    return (
      <div className="space-y-2 text-[13px] text-slate-800">
        {typeof structured.summary === 'string' && (
          <p className="font-medium">{structured.summary}</p>
        )}
        {findings.length > 0 && (
          <ul className="list-disc pl-4 space-y-1 text-[12px]">
            {findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {questions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">Open questions</p>
            <ul className="list-disc pl-4 space-y-1 text-[12px]">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (action === 'claim_check') {
    const issues = Array.isArray(structured.issues)
      ? (structured.issues as Array<Record<string, string>>)
      : [];
    return (
      <div className="space-y-2 text-[13px]">
        <p>
          <span className="text-[11px] font-semibold uppercase text-slate-500">Overall </span>
          <span className="font-medium capitalize text-slate-900">
            {String(structured.overall || 'unknown').replace(/_/g, ' ')}
          </span>
        </p>
        {typeof structured.notes === 'string' && (
          <p className="text-[12px] text-slate-600">{structured.notes}</p>
        )}
        {issues.map((issue, i) => (
          <div
            key={i}
            className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12px]"
          >
            <p className="font-semibold text-amber-900 capitalize">
              {issue.severity || 'issue'} — {issue.claim || 'Claim'}
            </p>
            <p className="mt-1 text-slate-700">{issue.problem}</p>
            {issue.suggestion && (
              <p className="mt-1 text-teal-900">Suggestion: {issue.suggestion}</p>
            )}
          </div>
        ))}
        {issues.length === 0 && (
          <p className="text-[12px] text-slate-600">No specific issues returned.</p>
        )}
      </div>
    );
  }

  if (action === 'draft_results') {
    return (
      <div className="space-y-3 text-[13px] text-slate-800">
        {typeof structured.results_section === 'string' && (
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Results</p>
            <div className="whitespace-pre-wrap">{structured.results_section}</div>
          </div>
        )}
        {typeof structured.suggested_conclusions === 'string' && (
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Conclusions</p>
            <div className="whitespace-pre-wrap">{structured.suggested_conclusions}</div>
          </div>
        )}
        {typeof structured.suggested_methodology_notes === 'string' && (
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Methods notes</p>
            <div className="whitespace-pre-wrap">{structured.suggested_methodology_notes}</div>
          </div>
        )}
      </div>
    );
  }

  if (action === 'captions') {
    const figures = Array.isArray(structured.figures)
      ? (structured.figures as Array<Record<string, string>>)
      : [];
    const tables = Array.isArray(structured.tables)
      ? (structured.tables as Array<Record<string, string>>)
      : [];
    return (
      <div className="space-y-2 text-[12px]">
        {figures.map((f, i) => (
          <div key={`f-${i}`} className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="font-semibold text-slate-900">{f.title || 'Figure'}</p>
            <p className="text-slate-600 mt-0.5">{f.legend}</p>
            {f.artifactId && (
              <p className="text-[10px] text-slate-400 mt-1">id: {f.artifactId}</p>
            )}
          </div>
        ))}
        {tables.map((t, i) => (
          <div key={`t-${i}`} className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="font-semibold text-slate-900">{t.title || 'Table'}</p>
            {t.artifactId && (
              <p className="text-[10px] text-slate-400 mt-1">id: {t.artifactId}</p>
            )}
          </div>
        ))}
        {figures.length === 0 && tables.length === 0 && (
          <pre className="whitespace-pre-wrap text-slate-700">{raw}</pre>
        )}
      </div>
    );
  }

  return <pre className="whitespace-pre-wrap text-[12px] text-slate-700">{raw}</pre>;
}

const EvidenceAIPanel: React.FC<Props> = ({
  title,
  summary,
  methodology,
  conclusions,
  pack,
  onApplySummary,
  onApplyMethodology,
  onApplyConclusions,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [resultText, setResultText] = useState('');
  const [structured, setStructured] = useState<Record<string, unknown> | undefined>();

  const run = async (action: Action) => {
    setLoading(action);
    setError(null);
    setLastAction(action);
    try {
      const packContext = buildPackAIContext({
        title,
        summary,
        methodology,
        conclusions,
        pack,
      });
      const res = await axios.post(
        '/api/evidence-ai/analyze',
        {
          action,
          title,
          summary,
          methodology,
          conclusions,
          packContext,
        },
        { headers: getAuthHeaders() }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Analysis failed');
      }
      setResultText(res.data.content || '');
      setStructured(res.data.structured);
      setExpanded(true);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      setError(ax.response?.data?.error || ax.message || 'Request failed');
    } finally {
      setLoading(null);
    }
  };

  const applyDraft = () => {
    if (!structured || lastAction !== 'draft_results') return;
    if (typeof structured.suggested_conclusions === 'string' && onApplyConclusions) {
      onApplyConclusions(structured.suggested_conclusions);
    }
    if (typeof structured.suggested_methodology_notes === 'string' && onApplyMethodology) {
      onApplyMethodology(structured.suggested_methodology_notes);
    }
  };

  const applySummary = () => {
    if (!structured || lastAction !== 'summarize') return;
    if (typeof structured.summary === 'string' && onApplySummary) {
      onApplySummary(structured.summary);
    }
  };

  return (
    <div className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 to-white px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <SparklesIcon className="h-4 w-4 text-teal-800" />
        <span className="text-[13px] font-semibold text-teal-950">Evidence AI</span>
        <span className="text-[11px] text-teal-800/70 flex-1">
          Summarize · check claims · draft Results
        </span>
        <span className="text-[11px] text-teal-700">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={loading !== null || pack.artifacts.length === 0}
                onClick={() => void run(a.id)}
                className="rounded-lg border border-teal-200 bg-white px-2.5 py-2 text-left hover:border-teal-400 disabled:opacity-40"
              >
                <p className="text-[12px] font-semibold text-slate-900">
                  {loading === a.id ? 'Working…' : a.label}
                </p>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{a.description}</p>
              </button>
            ))}
          </div>

          {pack.artifacts.length === 0 && (
            <p className="text-[11px] text-slate-500">Add artifacts before running Evidence AI.</p>
          )}

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
              {error}
            </p>
          )}

          {lastAction && (resultText || structured) && (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              {renderStructured(lastAction, structured, resultText)}
              <div className="mt-3 flex flex-wrap gap-2">
                {lastAction === 'summarize' && onApplySummary && structured?.summary && (
                  <button
                    type="button"
                    onClick={applySummary}
                    className="rounded-lg bg-teal-800 px-2.5 py-1.5 text-[11px] font-medium text-white"
                  >
                    Apply summary
                  </button>
                )}
                {lastAction === 'draft_results' &&
                  (onApplyConclusions || onApplyMethodology) && (
                    <button
                      type="button"
                      onClick={applyDraft}
                      className="rounded-lg bg-teal-800 px-2.5 py-1.5 text-[11px] font-medium text-white"
                    >
                      Apply to pack fields
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceAIPanel;
