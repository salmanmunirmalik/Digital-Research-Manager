/**
 * Lightweight spreadsheet formulas for lab packs.
 * Supports Excel-like AVERAGE / SUM / STDEV / SEM on the current row or ranges.
 */

import { colLetter } from './spreadsheet';

const FORMULA_FNS = new Set([
  'AVERAGE',
  'AVG',
  'MEAN',
  'SUM',
  'STDEV',
  'STDEV.S',
  'STD',
  'SEM',
  'COUNT',
  'MIN',
  'MAX',
]);

export function isFormula(raw: unknown): boolean {
  return String(raw ?? '')
    .trim()
    .startsWith('=');
}

export function colIndexFromLetter(letter: string): number {
  const s = letter.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return -1;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n - 1;
}

function parseNumber(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || isFormula(s)) return null;
  const cleaned = s.replace(/,/g, '');
  if (!cleaned || /^na(n)?$/i.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function mean(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function sampleStdev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = mean(vals);
  const v = vals.reduce((a, b) => a + (b - m) ** 2, 0) / (vals.length - 1);
  return Math.sqrt(v);
}

function fmtResult(n: number): string {
  if (!Number.isFinite(n)) return '';
  // Keep readable lab precision without noisy float tails
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e6 || abs < 0.0001)) return n.toExponential(4);
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}

type GetCell = (r: number, c: number) => string;

/**
 * Resolve a formula string against a sheet.
 * rowIndex is 0-based data row (Excel row = rowIndex + 2).
 */
export function evaluateFormula(
  raw: string,
  rowIndex: number,
  getCell: GetCell,
  colCount: number,
  rowCount: number
): string {
  const text = String(raw || '').trim();
  if (!text.startsWith('=')) return text;
  const body = text.slice(1).trim();
  const match = /^([A-Z_.]+)\((.*)\)$/i.exec(body);
  if (!match) return '#ERR';
  const fn = match[1].toUpperCase().replace(/\.S$/, '');
  const argsRaw = match[2].trim();
  if (!FORMULA_FNS.has(fn) && !FORMULA_FNS.has(fn.replace('.', ''))) {
    // normalize STDEV.S already handled
    if (!['STDEV', 'STD', 'AVERAGE', 'AVG', 'MEAN', 'SUM', 'SEM', 'COUNT', 'MIN', 'MAX'].includes(fn)) {
      return '#FN?';
    }
  }

  const values = collectArgs(argsRaw, rowIndex, getCell, colCount, rowCount);
  if (!values.length) return '';

  switch (fn) {
    case 'AVERAGE':
    case 'AVG':
    case 'MEAN':
      return fmtResult(mean(values));
    case 'SUM':
      return fmtResult(values.reduce((a, b) => a + b, 0));
    case 'STDEV':
    case 'STDEV.S':
    case 'STD':
      return values.length >= 2 ? fmtResult(sampleStdev(values)) : '';
    case 'SEM':
      return values.length >= 2 ? fmtResult(sampleStdev(values) / Math.sqrt(values.length)) : '';
    case 'COUNT':
      return String(values.length);
    case 'MIN':
      return fmtResult(Math.min(...values));
    case 'MAX':
      return fmtResult(Math.max(...values));
    default:
      return '#FN?';
  }
}

function collectArgs(
  argsRaw: string,
  rowIndex: number,
  getCell: GetCell,
  colCount: number,
  rowCount: number
): number[] {
  if (!argsRaw) return [];
  const parts = splitArgs(argsRaw);
  const out: number[] = [];

  parts.forEach((part) => {
    const token = part.trim();
    if (!token) return;

    // Literal number
    const lit = parseNumber(token);
    if (lit != null && !/^[A-Z]/i.test(token)) {
      out.push(lit);
      return;
    }

    // Same-row column span: B:D or B
    const sameRow = /^([A-Z]+)(?::([A-Z]+))?$/i.exec(token);
    if (sameRow && !/\d/.test(token)) {
      const c0 = colIndexFromLetter(sameRow[1]);
      const c1 = sameRow[2] ? colIndexFromLetter(sameRow[2]) : c0;
      if (c0 < 0 || c1 < 0) return;
      const lo = Math.min(c0, c1);
      const hi = Math.max(c0, c1);
      for (let c = lo; c <= hi && c < colCount; c++) {
        const n = resolveNumericCell(rowIndex, c, getCell, rowCount, colCount);
        if (n != null) out.push(n);
      }
      return;
    }

    // Range A2:C4
    const range = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.exec(token);
    if (range) {
      const c0 = colIndexFromLetter(range[1]);
      const r0 = Number(range[2]) - 2; // Excel row → 0-based data
      const c1 = colIndexFromLetter(range[3]);
      const r1 = Number(range[4]) - 2;
      if (c0 < 0 || c1 < 0) return;
      for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) {
        if (r < 0 || r >= rowCount) continue;
        for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) {
          if (c < 0 || c >= colCount) continue;
          const n = resolveNumericCell(r, c, getCell, rowCount, colCount);
          if (n != null) out.push(n);
        }
      }
      return;
    }

    // Single cell B2
    const cell = /^([A-Z]+)(\d+)$/i.exec(token);
    if (cell) {
      const c = colIndexFromLetter(cell[1]);
      const r = Number(cell[2]) - 2;
      if (c < 0 || r < 0 || r >= rowCount || c >= colCount) return;
      const n = resolveNumericCell(r, c, getCell, rowCount, colCount);
      if (n != null) out.push(n);
    }
  });

  return out;
}

function resolveNumericCell(
  r: number,
  c: number,
  getCell: GetCell,
  rowCount: number,
  colCount: number,
  depth = 0
): number | null {
  if (depth > 8) return null;
  const raw = getCell(r, c);
  if (isFormula(raw)) {
    // Evaluate nested formula (no circular protection beyond depth)
    const evaluated = evaluateFormula(raw, r, getCell, colCount, rowCount);
    return parseNumber(evaluated);
  }
  return parseNumber(raw);
}

function splitArgs(s: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

export function displayCellValue(
  raw: string,
  rowIndex: number,
  headers: string[],
  rows: string[][]
): { display: string; formula: string | null } {
  if (!isFormula(raw)) return { display: raw, formula: null };
  const getCell = (r: number, c: number) => rows[r]?.[c] ?? '';
  const display = evaluateFormula(raw, rowIndex, getCell, headers.length, rows.length);
  return { display, formula: raw };
}

/** Resolve all formula cells to computed values (for CSV/Excel export). */
export function resolveMatrixFormulas(
  headers: string[],
  rows: string[][]
): { headers: string[]; rows: string[][] } {
  const getCell = (r: number, c: number) => rows[r]?.[c] ?? '';
  const next = rows.map((row, ri) =>
    row.map((cell, _ci) => {
      if (!isFormula(cell)) return cell;
      return evaluateFormula(cell, ri, getCell, headers.length, rows.length);
    })
  );
  return { headers: [...headers], rows: next };
}

export type ReplicateSetupOptions = {
  readingCount?: number;
  includeSem?: boolean;
  includeSd?: boolean;
  /** Prefix for reading headers */
  readingLabel?: string;
  sampleLabel?: string;
};

/**
 * Build a lab replicate layout:
 * Sample | Reading 1 … Reading N | Average | [SD] | [SEM]
 * Average/SEM/SD cells get same-row formulas (=AVERAGE(B:D), etc.).
 */
export function buildReplicateAverageMatrix(
  existing: { headers: string[]; rows: string[][] },
  options: ReplicateSetupOptions = {}
): { headers: string[]; rows: string[][] } {
  const n = Math.max(2, Math.min(12, options.readingCount ?? 3));
  const readingLabel = options.readingLabel || 'Reading';
  const sampleLabel = options.sampleLabel || 'Sample';
  const includeSem = options.includeSem !== false;
  const includeSd = Boolean(options.includeSd);

  const readingHeaders = Array.from({ length: n }, (_, i) => `${readingLabel} ${i + 1}`);
  const headers = [sampleLabel, ...readingHeaders, 'Average'];
  if (includeSd) headers.push('SD');
  if (includeSem) headers.push('SEM');

  const firstReadingCol = 1; // B
  const lastReadingCol = n; // e.g. D when n=3
  const avgRange = `${colLetter(firstReadingCol)}:${colLetter(lastReadingCol)}`;

  const rowCount = Math.max(existing.rows.length, 10);
  const rows = Array.from({ length: rowCount }, (_, ri) => {
    const prev = existing.rows[ri] || [];
    const row: string[] = Array(headers.length).fill('');
    // Keep first column sample id if present
    row[0] = String(prev[0] ?? '');
    // Try to preserve existing reading values if headers already matched
    for (let i = 0; i < n; i++) {
      const oldIdx = existing.headers.findIndex(
        (h) => h.trim().toLowerCase() === `${readingLabel} ${i + 1}`.toLowerCase()
      );
      if (oldIdx >= 0) row[1 + i] = String(prev[oldIdx] ?? '');
      else if (prev[1 + i] != null && !isFormula(prev[1 + i])) row[1 + i] = String(prev[1 + i]);
    }
    let c = 1 + n;
    row[c++] = `=AVERAGE(${avgRange})`;
    if (includeSd) row[c++] = `=STDEV(${avgRange})`;
    if (includeSem) row[c++] = `=SEM(${avgRange})`;
    return row;
  });

  return { headers, rows };
}

/**
 * Fill / refresh an Average column from named reading columns (or column letters).
 * If averageColHeader is missing, appends "Average".
 */
export function applyAverageColumn(
  headers: string[],
  rows: string[][],
  readingHeaders: string[],
  averageHeader = 'Average'
): { headers: string[]; rows: string[][] } {
  const readingIdx = readingHeaders
    .map((h) => headers.findIndex((x) => x.trim() === h.trim()))
    .filter((i) => i >= 0);
  if (readingIdx.length < 2) {
    throw new Error('Select at least two reading columns');
  }
  const sorted = [...readingIdx].sort((a, b) => a - b);
  const contiguous = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  const rangeExpr = contiguous
    ? `${colLetter(sorted[0])}:${colLetter(sorted[sorted.length - 1])}`
    : sorted.map((i) => colLetter(i)).join(',');

  let nextHeaders = [...headers];
  let avgIdx = nextHeaders.findIndex((h) => h.trim() === averageHeader);
  if (avgIdx < 0) {
    nextHeaders.push(averageHeader);
    avgIdx = nextHeaders.length - 1;
  }

  const nextRows = rows.map((row) => {
    const copy = [...row];
    while (copy.length < nextHeaders.length) copy.push('');
    copy[avgIdx] = `=AVERAGE(${rangeExpr})`;
    return copy;
  });

  return { headers: nextHeaders, rows: nextRows };
}
