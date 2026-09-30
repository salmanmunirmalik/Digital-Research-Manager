import React, { useEffect, useRef, useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Field, TextArea } from '../notebook/NotebookFormPrimitives';
import SpreadsheetGrid from './SpreadsheetGrid';
import PlotRenderer from './PlotRenderer';
import {
  DocumentArrowUpIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '../icons';
import {
  EvidenceBlock,
  EvidenceFormat,
  EVIDENCE_FORMAT_META,
  StatMetric,
  createEmptyBlock,
  hydrateSheetBlock,
  newBlockId,
} from '../../utils/evidenceBlocks';
import {
  downloadMatrixAsCsv,
  downloadMatrixAsXlsx,
  importSpreadsheetFile,
  matrixToCsv,
} from '../../utils/spreadsheet';

type Props = {
  block: EvidenceBlock | null;
  /** When creating, pass the format to seed an empty block */
  createFormat?: EvidenceFormat;
  onSave: (block: EvidenceBlock) => void;
  onCancel: () => void;
};

const textareaClass =
  'w-full px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-y';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Focused editor for a single artifact — like opening one file in a folder. */
const EvidenceArtifactEditor: React.FC<Props> = ({
  block,
  createFormat,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<EvidenceBlock>(() => {
    const seed = block
      ? structuredClone(block)
      : createEmptyBlock(createFormat || 'narrative');
    return seed.type === 'sheet' ? hydrateSheetBlock(seed) : seed;
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const seed = block
      ? structuredClone(block)
      : createFormat
        ? createEmptyBlock(createFormat)
        : createEmptyBlock('narrative');
    setDraft(seed.type === 'sheet' ? hydrateSheetBlock(seed) : seed);
    setImportError('');
  }, [block, createFormat]);

  const meta = EVIDENCE_FORMAT_META[draft.type];

  const patch = (partial: Partial<EvidenceBlock>) => {
    setDraft((prev) => ({ ...prev, ...partial } as EvidenceBlock));
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    if (draft.type === 'sheet' || draft.type === 'table') {
      try {
        setImportError('');
        const imported = await importSpreadsheetFile(file);
        if (draft.type === 'sheet') {
          setDraft({
            ...draft,
            type: 'sheet',
            fileName: imported.fileName,
            mimeType: imported.mimeType,
            headers: imported.headers,
            rows: imported.rows,
            previewRows: imported.rows.slice(0, 20),
            rawText: matrixToCsv(imported.headers, imported.rows),
            title: draft.title || imported.fileName.replace(/\.[^.]+$/, ''),
          });
        } else {
          setDraft({
            ...draft,
            type: 'table',
            headers: imported.headers,
            rows: imported.rows,
            title: draft.title || imported.fileName.replace(/\.[^.]+$/, ''),
          });
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Could not import spreadsheet');
      }
      return;
    }
    if (draft.type === 'figure') {
      const previewUrl = await readFileAsDataUrl(file);
      setDraft({
        ...draft,
        type: 'figure',
        fileName: file.name,
        mimeType: file.type || 'image/*',
        size: file.size,
        previewUrl,
        title: draft.title || file.name.replace(/\.[^.]+$/, ''),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-900/50">
      <div className={`bg-white w-full max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden ${draft.type === 'sheet' || draft.type === 'table' ? 'max-w-6xl' : 'max-w-2xl'}`}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
              {meta.short} file
            </p>
            <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">
              {block ? `Edit ${meta.label.toLowerCase()}` : `Add ${meta.label.toLowerCase()}`}
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">{meta.hint}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Field label="File name in this pack">
            <Input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder={`e.g. ${meta.short.toLowerCase()} — condition A`}
              autoFocus
            />
          </Field>

          {draft.type === 'narrative' && (
            <Field label="Notes / findings">
              <textarea
                className={textareaClass}
                rows={10}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write what you observed…"
              />
            </Field>
          )}

          {(draft.type === 'table' || draft.type === 'sheet') && (
            <div className="space-y-3">
              {importError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
                  {importError}
                </div>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-100 hover:bg-sky-100"
                >
                  <DocumentArrowUpIcon className="w-3.5 h-3.5" />
                  Import Excel / CSV
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    void onPickFile(e.target.files?.[0] || null);
                    e.target.value = '';
                  }}
                />
                {draft.type === 'sheet' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        downloadMatrixAsCsv(
                          draft.fileName || draft.title || 'datasheet',
                          draft.headers,
                          draft.rows?.length ? draft.rows : draft.previewRows || []
                        )
                      }
                      className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Download CSV
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadMatrixAsXlsx(
                          draft.fileName || draft.title || 'datasheet',
                          draft.headers,
                          draft.rows?.length ? draft.rows : draft.previewRows || []
                        )
                      }
                      className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Download Excel
                    </button>
                    <Input
                      value={draft.fileName}
                      onChange={(e) => setDraft({ ...draft, fileName: e.target.value })}
                      placeholder="Filename (e.g. qpcr_run12.xlsx)"
                      className="flex-1 min-w-[160px] h-9"
                    />
                  </>
                )}
              </div>

              <SpreadsheetGrid
                headers={draft.headers}
                rows={
                  draft.type === 'sheet'
                    ? draft.rows?.length
                      ? draft.rows
                      : draft.previewRows || []
                    : draft.rows
                }
                onChange={({ headers, rows }) => {
                  if (draft.type === 'sheet') {
                    setDraft((prev) =>
                      prev.type === 'sheet'
                        ? {
                            ...prev,
                            headers,
                            rows,
                            previewRows: rows.slice(0, 20),
                            rawText: matrixToCsv(headers, rows),
                          }
                        : prev
                    );
                  } else if (draft.type === 'table') {
                    setDraft((prev) =>
                      prev.type === 'table' ? { ...prev, headers, rows } : prev
                    );
                  }
                }}
                minRows={draft.type === 'sheet' ? 20 : 8}
                minCols={draft.type === 'sheet' ? 8 : 3}
              />

              <TextArea
                value={draft.notes || ''}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                placeholder="Units, plate map, exclusions, how values were calculated…"
              />
            </div>
          )}

          {draft.type === 'figure' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full inline-flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-sky-300 bg-sky-50/40 text-sky-900 hover:bg-sky-50"
              >
                {draft.previewUrl ? (
                  <img
                    src={draft.previewUrl}
                    alt=""
                    className="max-h-40 max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <PhotoIcon className="w-8 h-8 opacity-60" />
                )}
                <span className="text-[13px] font-medium">
                  {draft.fileName || 'Choose image (gel, blot, micrograph, plot…)'}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.tif,.tiff,.png,.jpg,.jpeg,.gif,.webp"
                className="hidden"
                onChange={(e) => {
                  void onPickFile(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Modality">
                  <Select
                    value={draft.modality}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        modality: e.target.value as typeof draft.modality,
                      })
                    }
                    options={[
                      { value: 'gel', label: 'Gel' },
                      { value: 'blot', label: 'Blot' },
                      { value: 'microscopy', label: 'Microscopy' },
                      { value: 'chart', label: 'Chart / plot' },
                      { value: 'photo', label: 'Photo' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </Field>
                <Field label="Scale / exposure">
                  <Input
                    value={draft.scaleNote || ''}
                    onChange={(e) => setDraft({ ...draft, scaleNote: e.target.value })}
                    placeholder="50 µm · 1/100s…"
                  />
                </Field>
              </div>
              <Field label="Figure legend">
                <TextArea
                  value={draft.caption}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                  rows={3}
                  placeholder="What lanes/conditions show…"
                />
              </Field>
            </div>
          )}

          {draft.type === 'stats' && (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Metric</th>
                      <th className="px-2 py-1.5 text-left">Value</th>
                      <th className="px-2 py-1.5 text-left">Unit</th>
                      <th className="px-2 py-1.5 text-left">Notes</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.metrics.map((m, mi) => (
                      <tr key={m.id} className="border-t border-slate-100">
                        {(['label', 'value', 'unit', 'notes'] as const).map((field) => (
                          <td key={field} className="p-0">
                            <input
                              value={m[field]}
                              onChange={(e) => {
                                const metrics = draft.metrics.map((row, i) =>
                                  i === mi ? { ...row, [field]: e.target.value } : row
                                );
                                setDraft({ ...draft, metrics });
                              }}
                              className="w-full min-w-[70px] px-2 py-1.5 bg-transparent focus:outline-none focus:bg-sky-50/40"
                              placeholder={field}
                            />
                          </td>
                        ))}
                        <td className="px-1">
                          <button
                            type="button"
                            className="text-slate-300 hover:text-rose-500 p-1"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                metrics: draft.metrics.filter((_, i) => i !== mi),
                              })
                            }
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50"
                onClick={() => {
                  const metric: StatMetric = {
                    id: newBlockId(),
                    label: '',
                    value: '',
                    unit: '',
                    notes: '',
                  };
                  setDraft({ ...draft, metrics: [...draft.metrics, metric] });
                }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Metric
              </button>
            </div>
          )}

          {draft.type === 'code' && (
            <div className="space-y-3">
              <Field label="Language">
                <Select
                  value={draft.language}
                  onChange={(e) => setDraft({ ...draft, language: e.target.value })}
                  options={[
                    { value: 'python', label: 'Python' },
                    { value: 'r', label: 'R' },
                    { value: 'matlab', label: 'MATLAB' },
                    { value: 'imagej', label: 'ImageJ / Fiji' },
                    { value: 'shell', label: 'Shell' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </Field>
              <textarea
                className={`${textareaClass} font-mono`}
                rows={10}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="# Analysis script…"
                spellCheck={false}
              />
            </div>
          )}

          {draft.type === 'analysis' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-[13px] text-slate-700 space-y-1">
                <p>
                  <span className="text-slate-500">Method:</span> {draft.method}
                </p>
                <p>
                  <span className="text-slate-500">Source:</span> {draft.sourceTitle || draft.sourceBlockId || '—'}
                </p>
                <p className="font-medium text-slate-900">{draft.summary || 'No summary'}</p>
              </div>
              <TextArea
                value={draft.notes || ''}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={3}
                placeholder="Interpretation notes for this analysis…"
              />
            </div>
          )}

          {draft.type === 'plot' && (
            <div className="space-y-3">
              <PlotRenderer plot={draft} height={300} />
              <Field label="Caption">
                <Input
                  value={draft.caption}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                  placeholder="Figure caption"
                />
              </Field>
              <TextArea
                value={draft.notes || ''}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                placeholder="Notes for presentation / paper…"
              />
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="px-4 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-lg hover:bg-sky-800"
          >
            {block ? 'Update file' : 'Add to pack'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceArtifactEditor;
