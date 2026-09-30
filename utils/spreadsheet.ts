/**
 * Spreadsheet helpers — Excel-like grids for research data packs.
 */

import * as XLSX from 'xlsx';
import { parseDelimitedText } from './evidenceBlocks';

export type SheetMatrix = {
  headers: string[];
  rows: string[][];
};

export function colLetter(index: number): string {
  let n = index;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function emptyMatrix(cols = 8, rows = 20, blankHeaders = false): SheetMatrix {
  const headers = Array.from({ length: cols }, (_, i) =>
    blankHeaders ? '' : `Column ${i + 1}`
  );
  const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  return { headers, rows: data };
}

export function normalizeMatrix(
  headers: string[],
  rows: string[][],
  minCols = 1,
  minRows = 1
): SheetMatrix {
  const colCount = Math.max(
    minCols,
    headers.length,
    ...rows.map((r) => r.length),
    1
  );
  const paddedHeaders = Array.from({ length: colCount }, (_, i) => headers[i] ?? '');
  const paddedRows = rows.map((r) =>
    Array.from({ length: colCount }, (_, i) => String(r[i] ?? ''))
  );
  while (paddedRows.length < minRows) {
    paddedRows.push(Array.from({ length: colCount }, () => ''));
  }
  return { headers: paddedHeaders, rows: paddedRows };
}

export function matrixToTsv(headers: string[], rows: string[][]): string {
  const escape = (c: string) => {
    const v = String(c ?? '');
    if (/[\t\n\r"]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  return [headers.map(escape).join('\t'), ...rows.map((r) => r.map(escape).join('\t'))].join(
    '\n'
  );
}

export function matrixToCsv(headers: string[], rows: string[][]): string {
  const escape = (c: string) => {
    const v = String(c ?? '');
    if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join(
    '\n'
  );
}

/** Parse pasted Excel/Sheets clipboard (usually TSV). */
export function parseClipboardMatrix(text: string): SheetMatrix {
  const { headers, rows } = parseDelimitedText(text);
  if (!headers.length && !rows.length) return emptyMatrix();
  // If only one line came through as headers with no rows, treat as a data row
  if (!rows.length) {
    return {
      headers: headers.map((_, i) => `Column ${i + 1}`),
      rows: [headers],
    };
  }
  return normalizeMatrix(headers, rows);
}

export async function importSpreadsheetFile(file: File): Promise<SheetMatrix & { fileName: string; mimeType: string }> {
  const name = file.name.toLowerCase();
  const mimeType = file.type || '';

  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Workbook has no sheets');
    const sheet = workbook.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    const cleaned = aoa
      .map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '')) : []))
      .filter((row) => row.some((c) => String(c).trim() !== ''));
    if (!cleaned.length) return { ...emptyMatrix(), fileName: file.name, mimeType };
    const headers = cleaned[0].map((h, i) => h.trim() || `Column ${i + 1}`);
    const rows = cleaned.slice(1);
    return {
      ...normalizeMatrix(headers, rows, headers.length, Math.max(rows.length, 5)),
      fileName: file.name,
      mimeType: mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  // CSV / TSV / TXT
  const text = await file.text();
  const parsed = parseDelimitedText(text);
  if (!parsed.headers.length) {
    return { ...emptyMatrix(), fileName: file.name, mimeType: mimeType || 'text/csv' };
  }
  return {
    ...normalizeMatrix(parsed.headers, parsed.rows, parsed.headers.length, Math.max(parsed.rows.length, 5)),
    fileName: file.name,
    mimeType: mimeType || 'text/csv',
  };
}

export function downloadMatrixAsCsv(fileName: string, headers: string[], rows: string[][]) {
  const csv = matrixToCsv(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.csv') ? fileName : `${fileName || 'sheet'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMatrixAsXlsx(fileName: string, headers: string[], rows: string[][]) {
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const base = fileName.replace(/\.(csv|tsv|txt|xlsx|xls)$/i, '') || 'sheet';
  XLSX.writeFile(wb, `${base}.xlsx`);
}
