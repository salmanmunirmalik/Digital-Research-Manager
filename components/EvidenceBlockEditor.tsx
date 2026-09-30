import React, { useRef } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PhotoIcon,
  ChartBarIcon,
  CodeBracketIcon,
  DocumentArrowUpIcon,
  FilesIcon,
  CalculatorIcon,
  PresentationChartLineIcon,
} from './icons';
import {
  EvidenceBlock,
  EvidenceFormat,
  EVIDENCE_FORMAT_META,
  StatMetric,
  createEmptyBlock,
  newBlockId,
  parseDelimitedText,
  blockHasContent,
} from '../utils/evidenceBlocks';

const textareaClass =
  'w-full px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 focus:border-transparent resize-y font-mono';

const FORMAT_ICON: Record<EvidenceFormat, React.FC<React.SVGProps<SVGSVGElement>>> = {
  narrative: DocumentTextIcon,
  table: TableCellsIcon,
  sheet: FilesIcon,
  figure: PhotoIcon,
  stats: ChartBarIcon,
  code: CodeBracketIcon,
  analysis: CalculatorIcon,
  plot: PresentationChartLineIcon,
};

type Props = {
  blocks: EvidenceBlock[];
  activeFormats: EvidenceFormat[];
  onFormatsChange: (formats: EvidenceFormat[]) => void;
  onBlocksChange: (blocks: EvidenceBlock[]) => void;
  /** Tighter chrome when embedded in the stepped form */
  compact?: boolean;
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const EvidenceBlockEditor: React.FC<Props> = ({
  blocks,
  activeFormats,
  onFormatsChange,
  onBlocksChange,
  compact = false,
}) => {
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const figureInputRef = useRef<HTMLInputElement>(null);
  const pendingFigureBlockId = useRef<string | null>(null);
  const pendingSheetBlockId = useRef<string | null>(null);

  const updateBlock = (id: string, patch: Partial<EvidenceBlock> | ((b: EvidenceBlock) => EvidenceBlock)) => {
    onBlocksChange(
      blocks.map((b) => {
        if (b.id !== id) return b;
        return typeof patch === 'function' ? patch(b) : ({ ...b, ...patch } as EvidenceBlock);
      })
    );
  };

  const removeBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
  };

  const addBlock = (type: EvidenceFormat) => {
    if (!activeFormats.includes(type)) {
      onFormatsChange([...activeFormats, type]);
    }
    onBlocksChange([...blocks, createEmptyBlock(type)]);
  };

  const toggleFormat = (format: EvidenceFormat) => {
    const on = activeFormats.includes(format);
    if (on) {
      const remaining = blocks.filter((b) => b.type !== format || blockHasContent(b));
      const stillHas = remaining.some((b) => b.type === format);
      onFormatsChange(activeFormats.filter((f) => f !== format));
      if (!stillHas) {
        onBlocksChange(blocks.filter((b) => b.type !== format));
      } else {
        onBlocksChange(remaining);
      }
    } else {
      onFormatsChange([...activeFormats, format]);
      if (!blocks.some((b) => b.type === format)) {
        onBlocksChange([...blocks, createEmptyBlock(format)]);
      }
    }
  };

  const applyPasteToTable = (blockId: string, text: string) => {
    const { headers, rows } = parseDelimitedText(text);
    if (!headers.length) return;
    updateBlock(blockId, (b) => {
      if (b.type !== 'table') return b;
      return {
        ...b,
        headers,
        rows: rows.length
          ? rows.map((r) => {
              const padded = [...r];
              while (padded.length < headers.length) padded.push('');
              return padded.slice(0, headers.length);
            })
          : [headers.map(() => '')],
      };
    });
  };

  const handleSheetFile = async (blockId: string, file: File | null) => {
    if (!file) return;
    try {
      const raw = await readFileAsText(file);
      const { headers, rows } = parseDelimitedText(raw);
      updateBlock(blockId, (b) => {
        if (b.type !== 'sheet') return b;
        return {
          ...b,
          fileName: file.name,
          mimeType: file.type || 'text/csv',
          rawText: raw,
          headers,
          previewRows: rows.slice(0, 8),
          title: b.title || file.name,
        };
      });
    } catch {
      updateBlock(blockId, (b) =>
        b.type === 'sheet' ? { ...b, fileName: file.name, notes: 'Could not parse file as text' } : b
      );
    }
  };

  const handleFigureFile = async (blockId: string, file: File | null) => {
    if (!file) return;
    try {
      const previewUrl = await readFileAsDataUrl(file);
      updateBlock(blockId, (b) => {
        if (b.type !== 'figure') return b;
        return {
          ...b,
          fileName: file.name,
          mimeType: file.type || 'image/*',
          size: file.size,
          previewUrl,
          title: b.title || file.name.replace(/\.[^.]+$/, ''),
        };
      });
    } catch {
      updateBlock(blockId, (b) =>
        b.type === 'figure' ? { ...b, fileName: file.name } : b
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        {!compact && (
          <>
            <p className="text-[13px] font-medium text-slate-700 mb-1.5">
              What formats are in this pack?
            </p>
            <p className="text-[12px] text-slate-500 mb-2.5">
              Real results are rarely one thing — e.g. gel image + densitometry table + interpretation.
              Toggle every format you have, then fill each block.
            </p>
          </>
        )}
        {compact && (
          <p className="text-[12px] font-medium text-slate-600 mb-2">Formats in this pack</p>
        )}
        <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {(Object.keys(EVIDENCE_FORMAT_META) as EvidenceFormat[]).map((format) => {
            const meta = EVIDENCE_FORMAT_META[format];
            const Icon = FORMAT_ICON[format];
            const active = activeFormats.includes(format);
            const count = blocks.filter((b) => b.type === format).length;
            return (
              <button
                key={format}
                type="button"
                onClick={() => toggleFormat(format)}
                title={meta.hint}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    active ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className={`text-[13px] font-semibold ${active ? 'text-sky-900' : 'text-slate-800'}`}>
                      {meta.short}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded px-1">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                    {meta.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
          <p className="text-[13px] text-slate-600 mb-3">
            Select formats above, or add a block directly.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(EVIDENCE_FORMAT_META) as EvidenceFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => addBlock(format)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                {EVIDENCE_FORMAT_META[format].short}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {blocks.map((block, index) => {
          const Icon = FORMAT_ICON[block.type];
          const meta = EVIDENCE_FORMAT_META[block.type];
          return (
            <div
              key={block.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 border-b border-slate-100">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <input
                    value={block.title}
                    onChange={(e) => updateBlock(block.id, { title: e.target.value } as Partial<EvidenceBlock>)}
                    className="w-full text-[13px] font-semibold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                    placeholder={`${meta.label} title`}
                  />
                  <p className="text-[11px] text-slate-500">{meta.hint}</p>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Remove block"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                {block.type === 'narrative' && (
                  <textarea
                    className={textareaClass.replace('font-mono', '')}
                    rows={5}
                    value={block.body}
                    onChange={(e) => updateBlock(block.id, { body: e.target.value } as Partial<EvidenceBlock>)}
                    placeholder="Describe what you observed — conditions, qualitative notes, unexpected findings…"
                  />
                )}

                {block.type === 'table' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-sky-800 bg-sky-50 border border-sky-100 rounded-md px-2.5 py-1.5 hover:bg-sky-100"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) applyPasteToTable(block.id, text);
                          } catch {
                            const text = window.prompt('Paste table (TSV/CSV) here:');
                            if (text) applyPasteToTable(block.id, text);
                          }
                        }}
                      >
                        Paste from clipboard
                      </button>
                      <button
                        type="button"
                        className="text-[12px] font-medium text-slate-600 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-50"
                        onClick={() =>
                          updateBlock(block.id, (b) => {
                            if (b.type !== 'table') return b;
                            return {
                              ...b,
                              rows: [...b.rows, b.headers.map(() => '')],
                            };
                          })
                        }
                      >
                        + Row
                      </button>
                      <button
                        type="button"
                        className="text-[12px] font-medium text-slate-600 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-50"
                        onClick={() =>
                          updateBlock(block.id, (b) => {
                            if (b.type !== 'table') return b;
                            return {
                              ...b,
                              headers: [...b.headers, `Col ${b.headers.length + 1}`],
                              rows: b.rows.map((r) => [...r, '']),
                            };
                          })
                        }
                      >
                        + Column
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Tip: copy cells from Excel / Google Sheets and paste here
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-[12px]">
                        <thead className="bg-slate-50">
                          <tr>
                            {block.headers.map((h, hi) => (
                              <th key={hi} className="border-b border-slate-200 p-0">
                                <input
                                  value={h}
                                  onChange={(e) =>
                                    updateBlock(block.id, (b) => {
                                      if (b.type !== 'table') return b;
                                      const headers = [...b.headers];
                                      headers[hi] = e.target.value;
                                      return { ...b, headers };
                                    })
                                  }
                                  className="w-full min-w-[100px] px-2 py-1.5 font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-white"
                                />
                              </th>
                            ))}
                            <th className="w-8 border-b border-slate-200" />
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, ri) => (
                            <tr key={ri} className="odd:bg-white even:bg-slate-50/50">
                              {block.headers.map((_, ci) => (
                                <td key={ci} className="border-b border-slate-100 p-0">
                                  <input
                                    value={row[ci] ?? ''}
                                    onChange={(e) =>
                                      updateBlock(block.id, (b) => {
                                        if (b.type !== 'table') return b;
                                        const rows = b.rows.map((r) => [...r]);
                                        rows[ri] = [...(rows[ri] || [])];
                                        while (rows[ri].length < b.headers.length) rows[ri].push('');
                                        rows[ri][ci] = e.target.value;
                                        return { ...b, rows };
                                      })
                                    }
                                    className="w-full min-w-[100px] px-2 py-1.5 text-slate-700 bg-transparent focus:outline-none focus:bg-sky-50/40"
                                  />
                                </td>
                              ))}
                              <td className="border-b border-slate-100 px-1">
                                <button
                                  type="button"
                                  className="text-slate-300 hover:text-rose-500 p-1"
                                  onClick={() =>
                                    updateBlock(block.id, (b) => {
                                      if (b.type !== 'table') return b;
                                      return { ...b, rows: b.rows.filter((_, i) => i !== ri) };
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
                    <textarea
                      className={textareaClass.replace('font-mono', '')}
                      rows={2}
                      value={block.notes || ''}
                      onChange={(e) =>
                        updateBlock(block.id, { notes: e.target.value } as Partial<EvidenceBlock>)
                      }
                      placeholder="Table notes — units, exclusions, how values were calculated…"
                    />
                  </div>
                )}

                {block.type === 'sheet' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-sky-900 bg-sky-50 border border-sky-100 rounded-md px-2.5 py-1.5 hover:bg-sky-100"
                        onClick={() => {
                          pendingSheetBlockId.current = block.id;
                          sheetInputRef.current?.click();
                        }}
                      >
                        <DocumentArrowUpIcon className="w-3.5 h-3.5" />
                        Attach CSV / TSV
                      </button>
                      <Input
                        value={block.fileName}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            fileName: e.target.value,
                          } as Partial<EvidenceBlock>)
                        }
                        placeholder="Filename (e.g. qpcr_run12_raw.csv)"
                        className="flex-1 min-w-[180px]"
                      />
                    </div>
                    <textarea
                      className={textareaClass}
                      rows={4}
                      value={block.rawText}
                      onChange={(e) => {
                        const rawText = e.target.value;
                        const { headers, rows } = parseDelimitedText(rawText);
                        updateBlock(block.id, (b) => {
                          if (b.type !== 'sheet') return b;
                          return {
                            ...b,
                            rawText,
                            headers,
                            previewRows: rows.slice(0, 8),
                          };
                        });
                      }}
                      placeholder="Or paste CSV/TSV here — headers on first row…"
                    />
                    {block.headers.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <p className="text-[11px] text-slate-500 px-2 py-1 bg-slate-50 border-b border-slate-100">
                          Preview ({Math.min(block.previewRows.length, 8)} of data rows)
                        </p>
                        <table className="min-w-full text-[11px]">
                          <thead>
                            <tr className="bg-slate-50">
                              {block.headers.map((h, i) => (
                                <th
                                  key={i}
                                  className="px-2 py-1 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap"
                                >
                                  {h || `Col ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.previewRows.slice(0, 8).map((row, ri) => (
                              <tr key={ri} className="odd:bg-white even:bg-slate-50/40">
                                {block.headers.map((_, ci) => (
                                  <td
                                    key={ci}
                                    className="px-2 py-1 text-slate-600 border-b border-slate-100 whitespace-nowrap"
                                  >
                                    {row[ci] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <textarea
                      className={textareaClass.replace('font-mono', '')}
                      rows={2}
                      value={block.notes || ''}
                      onChange={(e) =>
                        updateBlock(block.id, { notes: e.target.value } as Partial<EvidenceBlock>)
                      }
                      placeholder="Sheet notes — instrument, plate map, preprocessing…"
                    />
                  </div>
                )}

                {block.type === 'figure' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <button
                          type="button"
                          className="w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-medium text-sky-900 bg-sky-50 border border-sky-100 rounded-md px-2.5 py-2 hover:bg-sky-100"
                          onClick={() => {
                            pendingFigureBlockId.current = block.id;
                            figureInputRef.current?.click();
                          }}
                        >
                          <PhotoIcon className="w-4 h-4" />
                          {block.fileName ? 'Replace image' : 'Choose image'}
                        </button>
                        <Input
                          value={block.fileName}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              fileName: e.target.value,
                            } as Partial<EvidenceBlock>)
                          }
                          placeholder="Filename"
                        />
                        <Select
                          value={block.modality}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              modality: e.target.value,
                            } as Partial<EvidenceBlock>)
                          }
                          options={[
                            { value: 'gel', label: 'Gel / electrophoresis' },
                            { value: 'blot', label: 'Western / blot' },
                            { value: 'microscopy', label: 'Microscopy' },
                            { value: 'chart', label: 'Chart / plot' },
                            { value: 'photo', label: 'Photo / plate' },
                            { value: 'other', label: 'Other figure' },
                          ]}
                        />
                        <Input
                          value={block.scaleNote || ''}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              scaleNote: e.target.value,
                            } as Partial<EvidenceBlock>)
                          }
                          placeholder="Scale bar / magnification / exposure"
                        />
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 min-h-[140px] flex items-center justify-center overflow-hidden">
                        {block.previewUrl ? (
                          <img
                            src={block.previewUrl}
                            alt={block.caption || block.fileName || 'Figure preview'}
                            className="max-h-48 max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center px-4 py-6 text-slate-400">
                            <PhotoIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <p className="text-[12px]">Preview appears after you choose a file</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      className={textareaClass.replace('font-mono', '')}
                      rows={2}
                      value={block.caption}
                      onChange={(e) =>
                        updateBlock(block.id, { caption: e.target.value } as Partial<EvidenceBlock>)
                      }
                      placeholder="Figure legend — what the image shows, lanes/conditions, staining…"
                    />
                  </div>
                )}

                {block.type === 'stats' && (
                  <div className="space-y-2">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-[12px]">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Metric</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Value</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Unit</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Notes</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {block.metrics.map((m, mi) => (
                            <tr key={m.id} className="border-t border-slate-100">
                              {(['label', 'value', 'unit', 'notes'] as const).map((field) => (
                                <td key={field} className="p-0">
                                  <input
                                    value={m[field]}
                                    onChange={(e) =>
                                      updateBlock(block.id, (b) => {
                                        if (b.type !== 'stats') return b;
                                        const metrics = b.metrics.map((row, i) =>
                                          i === mi ? { ...row, [field]: e.target.value } : row
                                        );
                                        return { ...b, metrics };
                                      })
                                    }
                                    className="w-full min-w-[80px] px-2 py-1.5 bg-transparent focus:outline-none focus:bg-sky-50/40"
                                    placeholder={field}
                                  />
                                </td>
                              ))}
                              <td className="px-1">
                                <button
                                  type="button"
                                  className="text-slate-300 hover:text-rose-500 p-1"
                                  onClick={() =>
                                    updateBlock(block.id, (b) => {
                                      if (b.type !== 'stats') return b;
                                      return {
                                        ...b,
                                        metrics: b.metrics.filter((_, i) => i !== mi),
                                      };
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
                      className="text-[12px] font-medium text-slate-600 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-50"
                      onClick={() =>
                        updateBlock(block.id, (b) => {
                          if (b.type !== 'stats') return b;
                          const metric: StatMetric = {
                            id: newBlockId(),
                            label: '',
                            value: '',
                            unit: '',
                            notes: '',
                          };
                          return { ...b, metrics: [...b.metrics, metric] };
                        })
                      }
                    >
                      + Metric
                    </button>
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="space-y-2">
                    <Select
                      value={block.language}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          language: e.target.value,
                        } as Partial<EvidenceBlock>)
                      }
                      options={[
                        { value: 'python', label: 'Python' },
                        { value: 'r', label: 'R' },
                        { value: 'matlab', label: 'MATLAB' },
                        { value: 'imagej', label: 'ImageJ / Fiji macro' },
                        { value: 'shell', label: 'Shell' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                    <textarea
                      className={textareaClass}
                      rows={6}
                      value={block.content}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: e.target.value,
                        } as Partial<EvidenceBlock>)
                      }
                      placeholder="# Paste the analysis script or key snippets used to generate this result…"
                      spellCheck={false}
                    />
                    <textarea
                      className={textareaClass.replace('font-mono', '')}
                      rows={2}
                      value={block.notes || ''}
                      onChange={(e) =>
                        updateBlock(block.id, { notes: e.target.value } as Partial<EvidenceBlock>)
                      }
                      placeholder="Environment / package versions / seed…"
                    />
                  </div>
                )}

                {(block.type === 'analysis' || block.type === 'plot') && (
                  <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2 text-[13px] text-teal-900">
                    {block.type === 'analysis'
                      ? block.summary || 'Open this pack’s Analyze & plot studio to refresh results.'
                      : block.caption || 'Graph linked to a datasheet — edit in the pack workspace.'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {blocks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EVIDENCE_FORMAT_META) as EvidenceFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => addBlock(format)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add {EVIDENCE_FORMAT_META[format].short.toLowerCase()}
            </button>
          ))}
        </div>
      )}

      <input
        ref={sheetInputRef}
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          const id = pendingSheetBlockId.current;
          if (id) void handleSheetFile(id, file);
          e.target.value = '';
        }}
      />
      <input
        ref={figureInputRef}
        type="file"
        accept="image/*,.tif,.tiff,.png,.jpg,.jpeg,.gif,.webp,.bmp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          const id = pendingFigureBlockId.current;
          if (id) void handleFigureFile(id, file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default EvidenceBlockEditor;
