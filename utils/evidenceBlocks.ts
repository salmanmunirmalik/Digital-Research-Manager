/**
 * Multi-format research evidence blocks.
 * Experienced labs rarely store a single format — a pack often mixes
 * narrative, tables, sheets, figures, stats, and analysis code.
 */

export type EvidenceFormat =
  | 'narrative'
  | 'table'
  | 'sheet'
  | 'figure'
  | 'stats'
  | 'code'
  | 'analysis'
  | 'plot';

export type EvidenceBlock =
  | NarrativeBlock
  | TableBlock
  | SheetBlock
  | FigureBlock
  | StatsBlock
  | CodeBlock
  | AnalysisBlock
  | PlotBlock;

export interface EvidenceBlockBase {
  id: string;
  type: EvidenceFormat;
  title: string;
}

export interface NarrativeBlock extends EvidenceBlockBase {
  type: 'narrative';
  body: string;
}

export interface TableBlock extends EvidenceBlockBase {
  type: 'table';
  headers: string[];
  rows: string[][];
  notes?: string;
}

export interface SheetBlock extends EvidenceBlockBase {
  type: 'sheet';
  fileName: string;
  mimeType?: string;
  /** Raw CSV/TSV snapshot for export/interop */
  rawText: string;
  headers: string[];
  /** Full editable grid (Excel-style) */
  rows: string[][];
  /** @deprecated kept for older packs — prefer rows */
  previewRows: string[][];
  notes?: string;
}

export interface FigureBlock extends EvidenceBlockBase {
  type: 'figure';
  fileName: string;
  mimeType: string;
  size: number;
  /** Data URL or remote URL for preview */
  previewUrl: string;
  caption: string;
  modality: 'gel' | 'blot' | 'microscopy' | 'chart' | 'photo' | 'other';
  scaleNote?: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  notes: string;
}

export interface StatsBlock extends EvidenceBlockBase {
  type: 'stats';
  metrics: StatMetric[];
  notes?: string;
}

export interface CodeBlock extends EvidenceBlockBase {
  type: 'code';
  language: string;
  content: string;
  notes?: string;
}

export type AnalysisMethod =
  | 'descriptive'
  | 'ttest'
  | 'anova'
  | 'correlation'
  | 'regression'
  | 'xy_standard_curve';

export type PlotKind = 'column_sem' | 'scatter' | 'xy_line' | 'xy_mean_error';

export interface AnalysisColumnMap {
  group?: string;
  value?: string;
  x?: string;
  y?: string;
  groupA?: string;
  groupB?: string;
}

export interface AnalysisBlock extends EvidenceBlockBase {
  type: 'analysis';
  sourceBlockId: string;
  sourceTitle: string;
  method: AnalysisMethod;
  columnMap: AnalysisColumnMap;
  /** Serializable analysis payload */
  result: unknown;
  summary: string;
  notes?: string;
}

export interface PlotBlock extends EvidenceBlockBase {
  type: 'plot';
  sourceBlockId: string;
  sourceTitle: string;
  analysisBlockId?: string;
  plotKind: PlotKind;
  columnMap: AnalysisColumnMap;
  /** Points for rendering (means±SEM or XY) */
  series: Array<{
    label: string;
    mean?: number;
    sem?: number;
    sd?: number;
    n?: number;
    x?: number;
    y?: number;
  }>;
  fit?: { slope: number; intercept: number; equation: string };
  caption: string;
  yLabel?: string;
  xLabel?: string;
  notes?: string;
}

export const EVIDENCE_FORMAT_META: Record<
  EvidenceFormat,
  { label: string; short: string; hint: string }
> = {
  narrative: {
    label: 'Narrative text',
    short: 'Text',
    hint: 'Observations, findings, qualitative notes',
  },
  table: {
    label: 'Results table',
    short: 'Table',
    hint: 'Paste from Excel / Prism — rows & columns',
  },
  sheet: {
    label: 'Datasheet',
    short: 'Sheet',
    hint: 'Excel-style grid — type, paste, or import .xlsx / CSV',
  },
  figure: {
    label: 'Figure / image',
    short: 'Image',
    hint: 'Gels, blots, micrographs, charts',
  },
  stats: {
    label: 'Key statistics',
    short: 'Stats',
    hint: 'n, mean ± SD, p-values, effect sizes',
  },
  code: {
    label: 'Analysis code',
    short: 'Code',
    hint: 'R / Python / ImageJ macros used to produce outputs',
  },
  analysis: {
    label: 'Analysis result',
    short: 'Analysis',
    hint: 'Descriptive stats, t-tests, ANOVA, correlation from a datasheet',
  },
  plot: {
    label: 'Graph',
    short: 'Graph',
    hint: 'Publication-style plot linked to sheet columns',
  },
};

export function newBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyBlock(type: EvidenceFormat): EvidenceBlock {
  const id = newBlockId();
  switch (type) {
    case 'narrative':
      return { id, type, title: 'Findings', body: '' };
    case 'table':
      return {
        id,
        type,
        title: 'Results table',
        headers: ['Condition', 'Value', 'Notes'],
        rows: [
          ['', '', ''],
          ['', '', ''],
        ],
        notes: '',
      };
    case 'sheet':
      return {
        id,
        type,
        title: 'Datasheet',
        fileName: '',
        rawText: '',
        headers: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((l, i) => `Column ${i + 1}`),
        rows: Array.from({ length: 20 }, () => Array.from({ length: 8 }, () => '')),
        previewRows: [],
        notes: '',
      };
    case 'figure':
      return {
        id,
        type,
        title: 'Figure',
        fileName: '',
        mimeType: '',
        size: 0,
        previewUrl: '',
        caption: '',
        modality: 'other',
        scaleNote: '',
      };
    case 'stats':
      return {
        id,
        type,
        title: 'Key statistics',
        metrics: [
          { id: newBlockId(), label: 'n', value: '', unit: '', notes: '' },
          { id: newBlockId(), label: 'mean', value: '', unit: '', notes: '' },
          { id: newBlockId(), label: 'p-value', value: '', unit: '', notes: '' },
        ],
        notes: '',
      };
    case 'code':
      return {
        id,
        type,
        title: 'Analysis script',
        language: 'python',
        content: '',
        notes: '',
      };
    case 'analysis':
      return {
        id,
        type,
        title: 'Analysis',
        sourceBlockId: '',
        sourceTitle: '',
        method: 'descriptive',
        columnMap: {},
        result: null,
        summary: '',
        notes: '',
      };
    case 'plot':
      return {
        id,
        type,
        title: 'Graph',
        sourceBlockId: '',
        sourceTitle: '',
        plotKind: 'column_sem',
        columnMap: {},
        series: [],
        caption: '',
        notes: '',
      };
  }
}

/** Parse CSV or TSV (auto-detect delimiter from first line). */
export function parseDelimitedText(raw: string): { headers: string[]; rows: string[][] } {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) return { headers: [], rows: [] };

  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delim = tabCount > commaCount ? '\t' : ',';

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const splitLine = (line: string): string[] => {
    if (delim === '\t') return line.split('\t').map((c) => c.trim());
    // Simple CSV split that respects quoted fields
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const parsed = lines.map(splitLine);
  const headers = parsed[0] || [];
  const rows = parsed.slice(1);
  return { headers, rows };
}

export function blockHasContent(block: EvidenceBlock): boolean {
  switch (block.type) {
    case 'narrative':
      return Boolean(block.body.trim());
    case 'table':
      return (
        block.headers.some((h) => h.trim()) ||
        block.rows.some((r) => r.some((c) => String(c || '').trim()))
      );
    case 'sheet': {
      const rows = (block.rows?.length ? block.rows : block.previewRows) || [];
      return (
        Boolean(block.fileName.trim()) ||
        block.headers.some((h) => h.trim()) ||
        rows.some((r) => r.some((c) => String(c || '').trim()))
      );
    }
    case 'figure':
      return Boolean(block.fileName.trim() || block.previewUrl || block.caption.trim());
    case 'stats':
      return block.metrics.some((m) => m.label.trim() || m.value.trim());
    case 'code':
      return Boolean(block.content.trim());
    case 'analysis':
      return Boolean(block.summary.trim() || block.result);
    case 'plot':
      return block.series.length > 0 || Boolean(block.caption.trim());
  }
}

export function formatsFromBlocks(blocks: EvidenceBlock[]): EvidenceFormat[] {
  const set = new Set<EvidenceFormat>();
  blocks.forEach((b) => set.add(b.type));
  return Array.from(set);
}

export function summarizeEvidence(blocks: EvidenceBlock[]): string {
  const counts: Partial<Record<EvidenceFormat, number>> = {};
  blocks.filter(blockHasContent).forEach((b) => {
    counts[b.type] = (counts[b.type] || 0) + 1;
  });
  const parts = (Object.keys(counts) as EvidenceFormat[]).map(
    (k) => `${counts[k]} ${EVIDENCE_FORMAT_META[k].short.toLowerCase()}`
  );
  return parts.length ? parts.join(' · ') : 'No evidence content yet';
}

export function narrativeFromBlocks(blocks: EvidenceBlock[]): string {
  return blocks
    .filter((b): b is NarrativeBlock => b.type === 'narrative' && Boolean(b.body.trim()))
    .map((b) => (b.title ? `## ${b.title}\n${b.body}` : b.body))
    .join('\n\n');
}

export interface EvidenceFileRef {
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  role?: 'figure' | 'sheet' | 'attachment';
  blockId?: string;
}

/** Build file refs from figure/sheet blocks + explicit attachment names. */
export function buildFilesFromEvidence(
  blocks: EvidenceBlock[],
  extraNames: string[] = []
): EvidenceFileRef[] {
  const files: EvidenceFileRef[] = [];
  const seen = new Set<string>();

  blocks.forEach((b) => {
    if (b.type === 'figure' && b.fileName) {
      const key = `figure:${b.fileName}`;
      if (!seen.has(key)) {
        seen.add(key);
        files.push({
          name: b.fileName,
          type: b.mimeType || 'image/*',
          size: b.size || 0,
          url: b.previewUrl || '',
          uploadedAt: new Date(),
          role: 'figure',
          blockId: b.id,
        });
      }
    }
    if (b.type === 'sheet' && b.fileName) {
      const key = `sheet:${b.fileName}`;
      if (!seen.has(key)) {
        seen.add(key);
        files.push({
          name: b.fileName,
          type: b.mimeType || 'text/csv',
          size: b.rawText ? b.rawText.length : 0,
          url: '',
          uploadedAt: new Date(),
          role: 'sheet',
          blockId: b.id,
        });
      }
    }
  });

  extraNames.forEach((name) => {
    const trimmed = name.trim();
    if (!trimmed || seen.has(`att:${trimmed}`)) return;
    seen.add(`att:${trimmed}`);
    files.push({
      name: trimmed,
      type: '',
      size: 0,
      url: '',
      uploadedAt: new Date(),
      role: 'attachment',
    });
  });

  return files;
}

export function sanitizeBlocksForStorage(blocks: EvidenceBlock[]): EvidenceBlock[] {
  // Drop huge data URLs from persistence if over ~400KB to keep JSON lean;
  // keep filename + caption so the pack remains meaningful.
  return blocks.map((b) => {
    if (b.type === 'figure' && b.previewUrl?.startsWith('data:') && b.previewUrl.length > 400_000) {
      return { ...b, previewUrl: '' };
    }
    if (b.type === 'sheet') {
      const rows = b.rows?.length ? b.rows : b.previewRows || [];
      const headers = b.headers || [];
      let next: SheetBlock = {
        ...b,
        rows,
        previewRows: rows.slice(0, 20),
        rawText: b.rawText || '',
      };
      if (next.rawText.length > 200_000) {
        next = {
          ...next,
          rawText: next.rawText.slice(0, 200_000),
          notes: [next.notes, 'Truncated for storage — keep full file locally.']
            .filter(Boolean)
            .join(' '),
        };
      }
      // Cap very large grids for JSON storage (keep first 500 rows / 40 cols)
      if (next.rows.length > 500 || headers.length > 40) {
        next = {
          ...next,
          headers: headers.slice(0, 40),
          rows: next.rows.slice(0, 500).map((r) => r.slice(0, 40)),
          previewRows: next.rows.slice(0, 20).map((r) => r.slice(0, 40)),
          notes: [next.notes, 'Large sheet trimmed for storage (500×40).']
            .filter(Boolean)
            .join(' '),
        };
      }
      return next;
    }
    return b;
  });
}

/** Normalize legacy sheet blocks that only had previewRows. */
export function hydrateSheetBlock(block: SheetBlock): SheetBlock {
  const rows = block.rows?.length
    ? block.rows
    : block.previewRows?.length
      ? block.previewRows
      : Array.from({ length: 20 }, () => Array.from({ length: Math.max(block.headers?.length || 8, 8) }, () => ''));
  const headers =
    block.headers?.length > 0
      ? block.headers
      : Array.from({ length: Math.max(rows[0]?.length || 8, 8) }, (_, i) => `Column ${i + 1}`);
  return { ...block, headers, rows, previewRows: rows.slice(0, 20) };
}

export function isEvidenceBlockArray(value: unknown): value is EvidenceBlock[] {
  return Array.isArray(value) && value.every((b) => b && typeof b === 'object' && 'type' in b && 'id' in b);
}
