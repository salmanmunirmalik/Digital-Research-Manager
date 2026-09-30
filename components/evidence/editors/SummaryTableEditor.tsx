import React from 'react';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Field, TextArea } from '../../notebook/NotebookFormPrimitives';
import { PlusIcon, TrashIcon } from '../../icons';
import SpreadsheetGrid from '../SpreadsheetGrid';
import ReplicateAverageBar from '../ReplicateAverageBar';
import XyTrendChart from '../XyTrendChart';
import {
  SummaryTableArtifact,
  TableColumn,
  TableColumnType,
  newArtifactId,
} from '../../../utils/evidencePack';

type Props = {
  artifact: SummaryTableArtifact;
  onChange: (next: SummaryTableArtifact) => void;
  /** Sheets in the pack — optional source link */
  sheetOptions?: { id: string; name: string }[];
};

/**
 * Summary table — small, typed, paper-ready.
 * Column types + units make downstream analysis and export trustworthy.
 */
const SummaryTableEditor: React.FC<Props> = ({ artifact, onChange, sheetOptions = [] }) => {
  const headers = artifact.columns.map((c) => c.header);

  const setColumns = (columns: TableColumn[]) => {
    const width = columns.length;
    const rows = artifact.rows.map((r) => {
      const next = [...r];
      while (next.length < width) next.push('');
      return next.slice(0, width);
    });
    onChange({ ...artifact, columns, rows });
  };

  const updateColumn = (idx: number, partial: Partial<TableColumn>) => {
    const columns = artifact.columns.map((c, i) => (i === idx ? { ...c, ...partial } : c));
    setColumns(columns);
  };

  const addColumn = () => {
    setColumns([
      ...artifact.columns,
      { id: newArtifactId(), header: `Col ${artifact.columns.length + 1}`, type: 'text' },
    ]);
  };

  const removeColumn = (idx: number) => {
    if (artifact.columns.length <= 1) return;
    setColumns(artifact.columns.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Use this for communication: mean ± SEM, n, p-values — the table you would paste into a draft.
        Keep raw replicates in a datasheet and link it below.
      </p>

      {sheetOptions.length > 0 && (
        <Field label="Derived from datasheet (optional)">
          <Select
            value={artifact.sourceSheetId || ''}
            onChange={(e) =>
              onChange({ ...artifact, sourceSheetId: e.target.value || undefined })
            }
            options={[
              { value: '', label: '— not linked —' },
              ...sheetOptions.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </Field>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Column schema
          </p>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-800 hover:underline"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Column
          </button>
        </div>
        <ul className="divide-y divide-slate-100">
          {artifact.columns.map((col, idx) => (
            <li key={col.id} className="px-3 py-2 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Input
                  value={col.header}
                  onChange={(e) => updateColumn(idx, { header: e.target.value })}
                  placeholder="Header"
                  className="h-9"
                />
              </div>
              <div className="col-span-3">
                <Select
                  value={col.type}
                  onChange={(e) =>
                    updateColumn(idx, { type: e.target.value as TableColumnType })
                  }
                  options={[
                    { value: 'text', label: 'Text' },
                    { value: 'number', label: 'Number' },
                    { value: 'percent', label: 'Percent' },
                    { value: 'pvalue', label: 'p-value' },
                    { value: 'category', label: 'Category' },
                  ]}
                  className="h-9"
                />
              </div>
              <div className="col-span-3">
                <Input
                  value={col.unit || ''}
                  onChange={(e) => updateColumn(idx, { unit: e.target.value })}
                  placeholder="Unit"
                  className="h-9"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  title="Remove column"
                  onClick={() => removeColumn(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ReplicateAverageBar
        headers={headers}
        rows={artifact.rows}
        onApply={({ headers: nextHeaders, rows }) => {
          const columns = nextHeaders.map((h, i) => {
            const prev = artifact.columns[i];
            if (prev) return { ...prev, header: h };
            const lower = h.toLowerCase();
            let type: TableColumnType = 'number';
            if (/sample|condition|group|id/i.test(h)) type = 'category';
            if (/^p$|p-value|pvalue/i.test(lower)) type = 'pvalue';
            return {
              id: newArtifactId(),
              header: h,
              type,
              decimals: type === 'pvalue' ? 4 : 2,
            };
          });
          onChange({ ...artifact, columns, rows });
        }}
      />

      <SpreadsheetGrid
        headers={headers}
        rows={artifact.rows}
        onChange={({ headers: nextHeaders, rows }) => {
          const columns = artifact.columns.map((c, i) => ({
            ...c,
            header: nextHeaders[i] ?? c.header,
          }));
          // If grid added columns
          while (columns.length < nextHeaders.length) {
            columns.push({
              id: newArtifactId(),
              header: nextHeaders[columns.length] || `Col ${columns.length + 1}`,
              type: 'text',
            });
          }
          onChange({
            ...artifact,
            columns: columns.slice(0, nextHeaders.length),
            rows,
          });
        }}
        minRows={5}
        minCols={Math.max(3, artifact.columns.length)}
      />

      <XyTrendChart
        headers={headers}
        rows={artifact.rows}
        title={`${artifact.name || 'Table'} — XY`}
        height={280}
      />

      <Field label="Footnotes">
        <TextArea
          value={artifact.footnotes}
          onChange={(e) => onChange({ ...artifact, footnotes: e.target.value })}
          rows={2}
          placeholder="* p&lt;0.05 vs control; values are mean ± SEM; n = biological replicates"
        />
      </Field>
    </div>
  );
};

export default SummaryTableEditor;
