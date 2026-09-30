/**
 * Evidence pack — scientist-first domain model (v2).
 *
 * Mental model (like a lab project folder, not a CMS form):
 *   TEXT  → what you conclude (structured narrative)
 *   TABLE → what you would put in a paper (summary / derived)
 *   SHEET → what you measured (raw / long-form data)
 *   IMAGE → what you show (figure with caption + context)
 *
 * Storage: `research_data.metadata.pack` (versioned).
 * Legacy `metadata.evidenceBlocks` is migrated on read.
 */

export type ArtifactKind = 'text' | 'table' | 'sheet' | 'image';

export type ResultPolarity = 'positive' | 'negative' | 'mixed' | 'inconclusive' | 'not_applicable';

export interface PackArtifactBase {
  id: string;
  kind: ArtifactKind;
  /** Name inside the pack (like a filename) */
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * TEXT RESULT
 * Most useful when it forces a scientific claim structure instead of a diary.
 * - finding: one-sentence claim
 * - evidence: what supports it (can cite Table/Sheet/Image by name)
 * - caveats: limits, n, controls missing
 * - body: optional free notes / methods detail
 */
export interface TextResultArtifact extends PackArtifactBase {
  kind: 'text';
  polarity: ResultPolarity;
  finding: string;
  evidence: string;
  caveats: string;
  body: string;
}

export type TableColumnType = 'text' | 'number' | 'percent' | 'pvalue' | 'category';

export interface TableColumn {
  id: string;
  header: string;
  /** What the column means to an analyst */
  type: TableColumnType;
  unit?: string;
  /** Display decimals for number/percent; ignored for text */
  decimals?: number;
}

/**
 * SUMMARY TABLE
 * Publication / communication table — small, typed, footnoted.
 * Not a dump of raw replicates (that belongs in a sheet).
 */
export interface SummaryTableArtifact extends PackArtifactBase {
  kind: 'table';
  columns: TableColumn[];
  rows: string[][];
  footnotes: string;
  /** Optional link to the raw sheet this was derived from */
  sourceSheetId?: string;
}

export type SheetColumnType = 'text' | 'number' | 'category' | 'datetime' | 'id';

export interface SheetColumnMeta {
  header: string;
  type: SheetColumnType;
  unit?: string;
  required?: boolean;
}

/**
 * DATASHEET
 * Raw experimental matrix — Excel-like, importable, analysis-ready later.
 * Metadata (assay/date/operator) makes the sheet reusable by others in the lab.
 */
export interface DataSheetArtifact extends PackArtifactBase {
  kind: 'sheet';
  fileName: string;
  assay?: string;
  collectedOn?: string;
  operator?: string;
  instrument?: string;
  columnMeta: SheetColumnMeta[];
  headers: string[];
  rows: string[][];
  notes: string;
}

export type ImageModality =
  | 'gel'
  | 'blot'
  | 'microscopy'
  | 'flow'
  | 'plot'
  | 'photo'
  | 'schematic'
  | 'other';

/**
 * FIGURE / IMAGE
 * Useful only with caption discipline + modality + optional data link.
 * Title = short figure title; legend = what panels/scale mean.
 */
export interface FigureArtifact extends PackArtifactBase {
  kind: 'image';
  fileName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  modality: ImageModality;
  title: string;
  legend: string;
  scaleNote: string;
  /** Sheet or table this figure was quantified/derived from */
  sourceArtifactId?: string;
}

export type PackArtifact =
  | TextResultArtifact
  | SummaryTableArtifact
  | DataSheetArtifact
  | FigureArtifact;

export interface EvidencePackData {
  version: 2;
  artifacts: PackArtifact[];
}

export const ARTIFACT_META: Record<
  ArtifactKind,
  { label: string; short: string; role: string; hint: string }
> = {
  text: {
    label: 'Text result',
    short: 'Text',
    role: 'Claim',
    hint: 'Structured finding — what happened, what supports it, what limits it',
  },
  table: {
    label: 'Summary table',
    short: 'Table',
    role: 'Derived',
    hint: 'Small typed table for sharing / papers — not raw replicates',
  },
  sheet: {
    label: 'Datasheet',
    short: 'Sheet',
    role: 'Raw',
    hint: 'Excel-style raw data with assay context — import, edit, export',
  },
  image: {
    label: 'Figure',
    short: 'Image',
    role: 'Visual',
    hint: 'Image + title, legend, modality, optional link to source data',
  },
};

export function newArtifactId(): string {
  return `art_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyArtifact(kind: ArtifactKind, name?: string): PackArtifact {
  const id = newArtifactId();
  const ts = nowIso();
  const base = { id, createdAt: ts, updatedAt: ts };

  switch (kind) {
    case 'text':
      return {
        ...base,
        kind,
        name: name || 'Result note',
        polarity: 'not_applicable',
        finding: '',
        evidence: '',
        caveats: '',
        body: '',
      };
    case 'table':
      return {
        ...base,
        kind,
        name: name || 'Summary table',
        columns: [
          { id: newArtifactId(), header: 'Condition', type: 'category' },
          { id: newArtifactId(), header: 'Mean', type: 'number', unit: '', decimals: 2 },
          { id: newArtifactId(), header: 'SEM', type: 'number', unit: '', decimals: 2 },
          { id: newArtifactId(), header: 'n', type: 'number', decimals: 0 },
          { id: newArtifactId(), header: 'p', type: 'pvalue', decimals: 4 },
        ],
        rows: [
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
        ],
        footnotes: '',
      };
    case 'sheet':
      return {
        ...base,
        kind,
        name: name || 'Datasheet',
        fileName: '',
        assay: '',
        collectedOn: '',
        operator: '',
        instrument: '',
        columnMeta: Array.from({ length: 8 }, (_, i) => ({
          header: `Column ${i + 1}`,
          type: 'text' as SheetColumnType,
        })),
        headers: Array.from({ length: 8 }, (_, i) => `Column ${i + 1}`),
        rows: Array.from({ length: 20 }, () => Array.from({ length: 8 }, () => '')),
        notes: '',
      };
    case 'image':
      return {
        ...base,
        kind,
        name: name || 'Figure',
        fileName: '',
        mimeType: '',
        size: 0,
        previewUrl: '',
        modality: 'other',
        title: '',
        legend: '',
        scaleNote: '',
      };
  }
}

export function artifactHasContent(a: PackArtifact): boolean {
  switch (a.kind) {
    case 'text':
      return Boolean(a.finding.trim() || a.evidence.trim() || a.body.trim());
    case 'table':
      return (
        a.columns.some((c) => c.header.trim()) ||
        a.rows.some((r) => r.some((c) => String(c || '').trim()))
      );
    case 'sheet':
      return (
        Boolean(a.fileName.trim() || a.assay?.trim()) ||
        a.headers.some((h) => h.trim()) ||
        a.rows.some((r) => r.some((c) => String(c || '').trim()))
      );
    case 'image':
      return Boolean(a.previewUrl || a.fileName.trim() || a.title.trim() || a.legend.trim());
  }
}

export function summarizePack(artifacts: PackArtifact[]): string {
  const counts: Partial<Record<ArtifactKind, number>> = {};
  artifacts.filter(artifactHasContent).forEach((a) => {
    counts[a.kind] = (counts[a.kind] || 0) + 1;
  });
  const order: ArtifactKind[] = ['sheet', 'table', 'image', 'text'];
  const parts = order
    .filter((k) => counts[k])
    .map((k) => `${counts[k]} ${ARTIFACT_META[k].short.toLowerCase()}`);
  return parts.length ? parts.join(' · ') : 'Empty pack';
}

/**
 * Compact text serialization of a pack for LLM prompts (no image binaries).
 */
export function buildPackAIContext(input: {
  title?: string;
  summary?: string;
  methodology?: string;
  conclusions?: string;
  pack: EvidencePackData;
}): string {
  const lines: string[] = [];
  if (input.title) lines.push(`Title: ${input.title}`);
  if (input.summary) lines.push(`Summary: ${input.summary}`);
  if (input.methodology) lines.push(`Methodology: ${input.methodology}`);
  if (input.conclusions) lines.push(`Conclusions: ${input.conclusions}`);
  lines.push(`Inventory: ${summarizePack(input.pack.artifacts)}`);
  lines.push('');

  for (const a of input.pack.artifacts) {
    lines.push(`--- ${a.kind.toUpperCase()}: ${a.name} (id=${a.id}) ---`);
    switch (a.kind) {
      case 'text':
        lines.push(`Polarity: ${a.polarity}`);
        if (a.finding) lines.push(`Finding: ${a.finding}`);
        if (a.evidence) lines.push(`Evidence: ${a.evidence}`);
        if (a.caveats) lines.push(`Caveats: ${a.caveats}`);
        if (a.body) lines.push(`Notes: ${a.body.slice(0, 2000)}`);
        break;
      case 'table': {
        const headers = a.columns.map((c) => c.header || c.id).join(' | ');
        lines.push(`Columns: ${headers}`);
        a.rows.slice(0, 30).forEach((row, i) => {
          lines.push(`R${i + 1}: ${row.join(' | ')}`);
        });
        if (a.rows.length > 30) lines.push(`… ${a.rows.length - 30} more rows`);
        if (a.footnotes) lines.push(`Footnotes: ${a.footnotes}`);
        break;
      }
      case 'sheet': {
        lines.push(
          [
            a.fileName && `File: ${a.fileName}`,
            a.assay && `Assay: ${a.assay}`,
            a.collectedOn && `Collected: ${a.collectedOn}`,
            a.operator && `Operator: ${a.operator}`,
          ]
            .filter(Boolean)
            .join(' · ')
        );
        lines.push(`Headers: ${(a.headers || []).join(' | ')}`);
        a.rows.slice(0, 25).forEach((row, i) => {
          lines.push(`R${i + 1}: ${row.slice(0, 20).join(' | ')}`);
        });
        if (a.rows.length > 25) lines.push(`… ${a.rows.length - 25} more rows`);
        if (a.notes) lines.push(`Notes: ${a.notes.slice(0, 500)}`);
        break;
      }
      case 'image':
        lines.push(
          [
            a.modality && `Modality: ${a.modality}`,
            a.title && `Title: ${a.title}`,
            a.fileName && `File: ${a.fileName}`,
          ]
            .filter(Boolean)
            .join(' · ')
        );
        if (a.legend) lines.push(`Legend: ${a.legend}`);
        break;
    }
    lines.push('');
  }

  return lines.join('\n').slice(0, 24_000);
}

export function touchArtifact<T extends PackArtifact>(artifact: T): T {
  return { ...artifact, updatedAt: nowIso() };
}

export function sanitizePackForStorage(pack: EvidencePackData): EvidencePackData {
  return {
    version: 2,
    artifacts: pack.artifacts.map((a) => {
      if (a.kind === 'image' && a.previewUrl?.startsWith('data:') && a.previewUrl.length > 400_000) {
        return { ...a, previewUrl: '' };
      }
      if (a.kind === 'sheet') {
        const headers = (a.headers || []).slice(0, 40);
        const rows = (a.rows || []).slice(0, 500).map((r) => r.slice(0, 40));
        return {
          ...a,
          headers,
          rows,
          columnMeta: (a.columnMeta || []).slice(0, 40),
          notes:
            a.rows.length > 500 || a.headers.length > 40
              ? [a.notes, 'Trimmed for storage (500×40).'].filter(Boolean).join(' ')
              : a.notes,
        };
      }
      return a;
    }),
  };
}

export function emptyPack(): EvidencePackData {
  return { version: 2, artifacts: [] };
}

export function isPackData(value: unknown): value is EvidencePackData {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (value as EvidencePackData).version === 2 &&
    Array.isArray((value as EvidencePackData).artifacts)
  );
}

/** Migrate legacy evidenceBlocks (+ optional pack) into v2 pack data. */
export function loadPackFromMetadata(metadata: unknown): EvidencePackData {
  const meta = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<
    string,
    unknown
  >;

  if (isPackData(meta.pack)) {
    return {
      version: 2,
      artifacts: meta.pack.artifacts.filter(isPackArtifact),
    };
  }

  const legacy = Array.isArray(meta.evidenceBlocks) ? meta.evidenceBlocks : [];
  return {
    version: 2,
    artifacts: legacy.map(migrateLegacyBlock).filter((a): a is PackArtifact => Boolean(a)),
  };
}

function isPackArtifact(value: unknown): value is PackArtifact {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'kind' in (value as object) &&
      'id' in (value as object) &&
      ['text', 'table', 'sheet', 'image'].includes(String((value as PackArtifact).kind))
  );
}

function migrateLegacyBlock(raw: unknown): PackArtifact | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const ts = nowIso();
  const id = String(b.id || newArtifactId());
  const title = String(b.title || 'Untitled');

  // Already v2
  if (isPackArtifact(raw)) return raw as PackArtifact;

  const type = String(b.type || '');

  if (type === 'narrative' || type === 'text') {
    return {
      id,
      kind: 'text',
      name: title,
      createdAt: ts,
      updatedAt: ts,
      polarity: 'not_applicable',
      finding: '',
      evidence: '',
      caveats: '',
      body: String(b.body || ''),
    };
  }

  if (type === 'table') {
    const headers = Array.isArray(b.headers) ? (b.headers as string[]) : [];
    const rows = Array.isArray(b.rows) ? (b.rows as string[][]) : [];
    return {
      id,
      kind: 'table',
      name: title,
      createdAt: ts,
      updatedAt: ts,
      columns: headers.map((h) => ({
        id: newArtifactId(),
        header: String(h || ''),
        type: 'text' as TableColumnType,
      })),
      rows,
      footnotes: String(b.notes || ''),
    };
  }

  if (type === 'sheet') {
    const headers = Array.isArray(b.headers) ? (b.headers as string[]) : [];
    const rows = Array.isArray(b.rows)
      ? (b.rows as string[][])
      : Array.isArray(b.previewRows)
        ? (b.previewRows as string[][])
        : [];
    return {
      id,
      kind: 'sheet',
      name: title,
      createdAt: ts,
      updatedAt: ts,
      fileName: String(b.fileName || ''),
      assay: '',
      collectedOn: '',
      operator: '',
      instrument: '',
      columnMeta: headers.map((h) => ({ header: String(h || ''), type: 'text' as SheetColumnType })),
      headers,
      rows,
      notes: String(b.notes || ''),
    };
  }

  if (type === 'figure' || type === 'image') {
    return {
      id,
      kind: 'image',
      name: title,
      createdAt: ts,
      updatedAt: ts,
      fileName: String(b.fileName || ''),
      mimeType: String(b.mimeType || ''),
      size: Number(b.size || 0),
      previewUrl: String(b.previewUrl || ''),
      modality: (['gel', 'blot', 'microscopy', 'flow', 'plot', 'photo', 'schematic', 'other'].includes(
        String(b.modality)
      )
        ? String(b.modality)
        : 'other') as ImageModality,
      title: String(b.caption || title),
      legend: '',
      scaleNote: String(b.scaleNote || ''),
    };
  }

  // Drop analysis/plot/stats/code from pack surface — fold code/stats notes into text if useful
  if (type === 'stats') {
    const metrics = Array.isArray(b.metrics) ? b.metrics : [];
    const lines = metrics
      .map((m: unknown) => {
        const mm = m as Record<string, unknown>;
        return [mm.label, mm.value, mm.unit].filter(Boolean).join(' ');
      })
      .filter(Boolean);
    return {
      id,
      kind: 'text',
      name: title || 'Key statistics',
      createdAt: ts,
      updatedAt: ts,
      polarity: 'not_applicable',
      finding: lines[0] || '',
      evidence: lines.slice(1).join('\n'),
      caveats: String(b.notes || ''),
      body: '',
    };
  }

  if (type === 'code') {
    return {
      id,
      kind: 'text',
      name: title || 'Analysis notes',
      createdAt: ts,
      updatedAt: ts,
      polarity: 'not_applicable',
      finding: '',
      evidence: '',
      caveats: '',
      body: ['```' + String(b.language || ''), String(b.content || ''), '```'].join('\n'),
    };
  }

  return null;
}

/** Build file refs for completeness / API compatibility. */
export function buildFilesFromPack(artifacts: PackArtifact[]): Array<{
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  role?: string;
  blockId?: string;
}> {
  const files: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
    role?: string;
    blockId?: string;
  }> = [];

  artifacts.forEach((a) => {
    if (a.kind === 'image' && (a.fileName || a.previewUrl)) {
      files.push({
        name: a.fileName || a.name,
        type: a.mimeType || 'image/*',
        size: a.size || 0,
        url: a.previewUrl || '',
        uploadedAt: new Date(a.updatedAt),
        role: 'figure',
        blockId: a.id,
      });
    }
    if (a.kind === 'sheet' && a.fileName) {
      files.push({
        name: a.fileName,
        type: 'text/csv',
        size: a.rows.length * a.headers.length,
        url: '',
        uploadedAt: new Date(a.updatedAt),
        role: 'sheet',
        blockId: a.id,
      });
    }
  });

  return files;
}
