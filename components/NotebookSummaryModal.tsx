import React from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from './icons';

export interface NotebookSummaryResult {
  summary: string;
  keyFindings?: string[];
  nextSteps?: string[];
  themes?: string[];
  blockers?: string[];
  openQuestions?: string[];
  wins?: string[];
  suggestedFocus?: string;
  momentum?: 'high' | 'steady' | 'blocked' | 'sparse';
  metrics?: {
    totalEntries: number;
    experimentsCompleted: number;
    experimentsInProgress: number;
    keyResults: number;
  };
  sections?: {
    methods?: string;
    results?: string;
    discussion?: string;
  };
  mode?: 'ai' | 'basic' | 'empty';
  periodLabel?: string;
}

interface NotebookSummaryModalProps {
  open: boolean;
  summaryType: 'daily' | 'weekly' | 'project' | null;
  summary: NotebookSummaryResult | null;
  generatedAt?: string | null;
  onClose: () => void;
}

const momentumStyles: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-800',
  steady: 'bg-sky-50 text-sky-800',
  blocked: 'bg-amber-50 text-amber-900',
  sparse: 'bg-slate-100 text-slate-600',
};

const modeLabel: Record<string, string> = {
  ai: 'AI digest',
  basic: 'Structured digest (no AI key)',
  empty: 'Nothing to summarize yet',
};

const ListBlock: React.FC<{ title: string; items?: string[]; empty?: string }> = ({
  title,
  items,
  empty = 'None noted',
}) => (
  <div>
    <h3 className="text-sm font-semibold text-slate-900 mb-2">{title}</h3>
    {items && items.length > 0 ? (
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} className="text-sm text-slate-700 flex gap-2">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-slate-400">{empty}</p>
    )}
  </div>
);

const NotebookSummaryModal: React.FC<NotebookSummaryModalProps> = ({
  open,
  summaryType,
  summary,
  generatedAt,
  onClose,
}) => {
  if (!open || !summary) return null;

  const title =
    summaryType === 'daily'
      ? 'Daily research digest'
      : summaryType === 'weekly'
        ? 'Weekly research digest'
        : 'Project summary';

  const copyAll = async () => {
    const parts = [
      title,
      summary.periodLabel ? `Period: ${summary.periodLabel}` : '',
      '',
      summary.summary,
      '',
      summary.suggestedFocus ? `Focus: ${summary.suggestedFocus}` : '',
      '',
      'Key findings:',
      ...(summary.keyFindings || []).map((x) => `- ${x}`),
      '',
      'Next steps:',
      ...(summary.nextSteps || []).map((x) => `- ${x}`),
      '',
      'Blockers:',
      ...(summary.blockers || []).map((x) => `- ${x}`),
    ]
      .filter((line) => line !== undefined)
      .join('\n');
    try {
      await navigator.clipboard.writeText(parts);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-slate-700" />
              {title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
              {summary.periodLabel && <span>{summary.periodLabel}</span>}
              {summary.mode && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {modeLabel[summary.mode] || summary.mode}
                </span>
              )}
              {summary.momentum && (
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    momentumStyles[summary.momentum] || momentumStyles.steady
                  }`}
                >
                  Momentum: {summary.momentum}
                </span>
              )}
              {generatedAt && (
                <span>{new Date(generatedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {summary.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ['Entries', summary.metrics.totalEntries],
                ['Completed', summary.metrics.experimentsCompleted],
                ['In progress', summary.metrics.experimentsInProgress],
                ['With results', summary.metrics.keyResults],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
                  <div className="text-lg font-semibold text-slate-900">{value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap">
              {summary.summary}
            </p>
          </div>

          {summary.suggestedFocus && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 mb-1 flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5" />
                Suggested focus
              </div>
              <p className="text-sm text-emerald-950">{summary.suggestedFocus}</p>
            </div>
          )}

          {(summary.themes || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summary.themes!.map((theme) => (
                <span
                  key={theme}
                  className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-700"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ListBlock title="Key findings" items={summary.keyFindings} />
            <ListBlock title="Wins" items={summary.wins} empty="No wins tagged yet" />
            <ListBlock
              title="Blockers"
              items={summary.blockers}
              empty="No blockers detected"
            />
            <ListBlock
              title="Open questions"
              items={summary.openQuestions}
              empty="No open questions"
            />
          </div>

          <ListBlock title="Next steps" items={summary.nextSteps} />

          {summary.sections &&
            (summary.sections.methods ||
              summary.sections.results ||
              summary.sections.discussion) && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                {summary.sections.methods && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Methods</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {summary.sections.methods}
                    </p>
                  </div>
                )}
                {summary.sections.results && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Results</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {summary.sections.results}
                    </p>
                  </div>
                )}
                {summary.sections.discussion && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Discussion</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {summary.sections.discussion}
                    </p>
                  </div>
                )}
              </div>
            )}

          {summary.mode === 'basic' && (
            <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Using a structured digest. Add an AI chat key in Settings for a fuller narrative
                analysis.
              </span>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => void copyAll()}
            className="px-3.5 py-2 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookSummaryModal;
