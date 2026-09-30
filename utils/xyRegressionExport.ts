/**
 * Export helpers for XY Regression / Standard Curve analyses.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadMatrixAsCsv, downloadMatrixAsXlsx, matrixToCsv } from './spreadsheet';
import {
  ANALYSIS_TYPE,
  axisTitle,
  errorBarSubtitle,
  formatStat,
  resultsTableMatrix,
  type ChartDisplayOptions,
  type XyRegressionAnalysis,
  type XyRegressionDataset,
} from './xyRegression';
import { fmt } from './researchStats';

function safeName(name: string): string {
  return (name || 'xy-regression').replace(/[^\w.-]+/g, '_').slice(0, 80);
}

export function exportResultsCsv(
  dataset: XyRegressionDataset,
  analysis: XyRegressionAnalysis,
  digits: number
) {
  const table = resultsTableMatrix(analysis, digits);
  downloadMatrixAsCsv(`${safeName(dataset.name)}_results`, table.headers, table.rows);
}

export function exportResultsExcel(
  dataset: XyRegressionDataset,
  analysis: XyRegressionAnalysis,
  digits: number
) {
  const rawHeaders = [
    dataset.xLabel || 'X',
    ...Array.from({ length: dataset.replicateCount }, (_, i) => `Reading ${i + 1}`),
  ];
  const rawRows = dataset.rows.map((r) => [r.xRaw, ...r.readings]);
  const summary = resultsTableMatrix(analysis, digits);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([rawHeaders, ...rawRows]), 'Raw');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([summary.headers, ...summary.rows]),
    'Summary'
  );

  if (analysis.regression) {
    const r = analysis.regression;
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['Parameter', 'Value'],
        ['Equation', r.equation],
        ['Slope', r.slope],
        ['Intercept', r.intercept],
        ['R²', r.rSquared],
        ['r', r.r],
        ['N (X values)', r.n],
      ]),
      'Regression'
    );
  }

  XLSX.writeFile(wb, `${safeName(dataset.name)}_analysis.xlsx`);
}

export async function exportChartPng(chartEl: HTMLElement | null, fileName: string) {
  if (!chartEl) throw new Error('Chart not ready');
  const canvas = await html2canvas(chartEl, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
  });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName(fileName)}.png`;
  a.click();
}

export async function exportChartSvg(chartEl: HTMLElement | null, fileName: string) {
  if (!chartEl) throw new Error('Chart not ready');
  const svg = chartEl.querySelector('svg');
  if (!svg) throw new Error('No SVG found in chart');
  const clone = svg.cloneNode(true) as SVGElement;
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const blob = new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>', new XMLSerializer().serializeToString(clone)],
    { type: 'image/svg+xml;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName(fileName)}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportChartPdf(chartEl: HTMLElement | null, fileName: string) {
  if (!chartEl) throw new Error('Chart not ready');
  const canvas = await html2canvas(chartEl, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
  });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(img, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save(`${safeName(fileName)}_chart.pdf`);
}

export async function exportFullReport(args: {
  dataset: XyRegressionDataset;
  analysis: XyRegressionAnalysis;
  options: ChartDisplayOptions;
  chartEl: HTMLElement | null;
}) {
  const { dataset, analysis, options, chartEl } = args;
  const digits = options.decimalPlaces;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;
  const pageW = pdf.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;

  const line = (text: string, size = 11, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, maxW);
    pdf.text(lines, margin, y);
    y += lines.length * (size + 4);
    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  line(ANALYSIS_TYPE.name, 16, true);
  line(dataset.name || 'Untitled dataset', 12, true);
  line(`X: ${axisTitle(dataset.xLabel, dataset.xUnit)}`);
  line(`Y: ${axisTitle(dataset.yLabel, dataset.yUnit)}`);
  line(errorBarSubtitle(options.errorBars, analysis.typicalN), 10);
  y += 8;

  line('Raw replicates', 13, true);
  dataset.rows.forEach((row) => {
    const vals = row.readings.filter((r) => String(r).trim() !== '').join(', ');
    line(`X=${row.xRaw || '—'}  →  ${vals || '(empty)'}`, 9);
  });
  y += 8;

  line('Summary (mean of replicates)', 13, true);
  const summary = resultsTableMatrix(analysis, digits);
  line(summary.headers.join(' | '), 8, true);
  summary.rows.forEach((r) => line(r.join(' | '), 8));
  y += 8;

  line('Linear regression (on means)', 13, true);
  if (analysis.regression) {
    const r = analysis.regression;
    line(`Equation: ${r.equation}`);
    line(`Slope: ${formatStat(r.slope, digits)}`);
    line(`Intercept: ${formatStat(r.intercept, digits)}`);
    line(`R²: ${Number.isFinite(r.rSquared) ? fmt(r.rSquared, 4) : '—'}`);
    line(`r: ${Number.isFinite(r.r) ? fmt(r.r, 4) : '—'}`);
    line(`N: ${r.n} X-values`);
  } else {
    line('Regression not available (need ≥2 distinct X values).');
  }

  if (analysis.warnings.length) {
    y += 8;
    line('Quality notes', 13, true);
    analysis.warnings.forEach((w) => line(`• ${w.message}`, 9));
  }

  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      pdf.addPage();
      y = margin;
      line('Graph', 13, true);
      const img = canvas.toDataURL('image/png');
      const maxH = pdf.internal.pageSize.getHeight() - y - margin;
      const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      pdf.addImage(img, 'PNG', margin, y, canvas.width * ratio, canvas.height * ratio);
    } catch {
      // chart capture optional
    }
  }

  // Also attach CSV blob content as a text appendix isn't needed — write PDF
  pdf.save(`${safeName(dataset.name)}_report.pdf`);

  // Convenience: also drop a CSV of summary beside the report flow is optional
  void matrixToCsv;
}

export { downloadMatrixAsXlsx };
