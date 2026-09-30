/**
 * XY Regression / Standard Curve — replicate entry → mean±error → linear fit.
 * Regression uses one mean Y per X (not raw technical replicates as independent points).
 */

import {
  describe,
  fmt,
  linearRegression,
  parseNumeric,
  pearson,
  type RegressionResult,
} from './researchStats';

export type XyRegressionMeta = {
  name: string;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
};

export type XyRegressionRow = {
  id: string;
  /** Raw X cell (may be empty / non-numeric). */
  xRaw: string;
  /** Raw replicate Y cells — empty ≠ zero. */
  readings: string[];
};

export type XyRegressionDataset = XyRegressionMeta & {
  rows: XyRegressionRow[];
  replicateCount: number;
};

export type RowSummary = {
  id: string;
  xRaw: string;
  x: number | null;
  readingsRaw: string[];
  /** Valid numeric replicates only (empties excluded). */
  values: number[];
  n: number;
  mean: number | null;
  sd: number | null;
  sem: number | null;
  min: number | null;
  max: number | null;
  cvPercent: number | null;
  hasNonNumeric: boolean;
  missingCount: number;
};

export type QcWarning = {
  code:
    | 'high_cv'
    | 'missing_replicates'
    | 'non_numeric'
    | 'duplicate_x'
    | 'insufficient_x'
    | 'no_x_variation'
    | 'zero_mean_cv'
    | 'extreme_spread'
    | 'two_point_caution';
  severity: 'info' | 'warn';
  message: string;
  rowId?: string;
  x?: number | null;
};

export type ErrorBarMode = 'none' | 'sd' | 'sem';
export type PlotPointsMode = 'mean' | 'mean_replicates';
export type RegressionMode = 'none' | 'linear';

export type ChartDisplayOptions = {
  pointsMode: PlotPointsMode;
  errorBars: ErrorBarMode;
  regression: RegressionMode;
  showEquation: boolean;
  showR2: boolean;
  showLegend: boolean;
  showGrid: boolean;
  showPointLabels: boolean;
  decimalPlaces: number;
  cvWarnThreshold: number;
};

export const DEFAULT_CHART_OPTIONS: ChartDisplayOptions = {
  pointsMode: 'mean_replicates',
  errorBars: 'sd',
  regression: 'linear',
  showEquation: true,
  showR2: true,
  showLegend: true,
  showGrid: true,
  showPointLabels: false,
  decimalPlaces: 4,
  cvWarnThreshold: 15,
};

export type MeanPoint = {
  x: number;
  y: number;
  n: number;
  sd: number | null;
  sem: number | null;
  errorY: number;
  label: string;
  rowId: string;
};

export type ReplicatePoint = {
  x: number;
  y: number;
  xTrue: number;
  rowId: string;
  readingIndex: number;
};

export type XyRegressionAnalysis = {
  summaries: RowSummary[];
  meanPoints: MeanPoint[];
  replicatePoints: ReplicatePoint[];
  regression: (RegressionResult & { r: number }) | null;
  warnings: QcWarning[];
  replicateCount: number;
  typicalN: number;
  canRegress: boolean;
};

let idSeq = 0;
export function newRowId(): string {
  idSeq += 1;
  return `xyr-${Date.now().toString(36)}-${idSeq}`;
}

export function defaultDataset(replicateCount = 3, rowCount = 5): XyRegressionDataset {
  const n = Math.max(2, Math.min(24, replicateCount));
  return {
    name: 'XY Regression / Standard Curve',
    xLabel: 'Concentration',
    xUnit: 'µg/mL',
    yLabel: 'Absorbance',
    yUnit: 'AU',
    replicateCount: n,
    rows: Array.from({ length: rowCount }, () => ({
      id: newRowId(),
      xRaw: '',
      readings: Array.from({ length: n }, () => ''),
    })),
  };
}

/** Example calibration-style starter (optional demo fill). */
export function exampleDataset(): XyRegressionDataset {
  const readings = [
    ['0.021', '0.018', '0.020'],
    ['0.181', '0.188', '0.175'],
    ['0.342', '0.355', '0.351'],
    ['0.515', '0.503', '0.510'],
    ['0.681', '0.702', '0.690'],
  ];
  const xs = ['0', '2', '4', '6', '8'];
  return {
    name: 'Standard curve example',
    xLabel: 'Concentration',
    xUnit: 'µg/mL',
    yLabel: 'Absorbance',
    yUnit: 'AU',
    replicateCount: 3,
    rows: xs.map((x, i) => ({
      id: newRowId(),
      xRaw: x,
      readings: [...readings[i]],
    })),
  };
}

export function ensureReplicateWidth(
  dataset: XyRegressionDataset,
  count: number
): XyRegressionDataset {
  const n = Math.max(2, Math.min(24, count));
  return {
    ...dataset,
    replicateCount: n,
    rows: dataset.rows.map((row) => {
      const readings = [...row.readings];
      while (readings.length < n) readings.push('');
      return { ...row, readings: readings.slice(0, n) };
    }),
  };
}

export function summarizeRow(row: XyRegressionRow): RowSummary {
  const values: number[] = [];
  let hasNonNumeric = false;
  let missingCount = 0;

  row.readings.forEach((raw) => {
    const t = String(raw ?? '').trim();
    if (!t) {
      missingCount += 1;
      return;
    }
    const v = parseNumeric(t);
    if (v == null) {
      hasNonNumeric = true;
      return;
    }
    values.push(v);
  });

  const n = values.length;
  const x = parseNumeric(row.xRaw);
  if (!n) {
    return {
      id: row.id,
      xRaw: row.xRaw,
      x,
      readingsRaw: row.readings,
      values: [],
      n: 0,
      mean: null,
      sd: null,
      sem: null,
      min: null,
      max: null,
      cvPercent: null,
      hasNonNumeric,
      missingCount,
    };
  }

  const stats = describe(values);
  const sd = n >= 2 ? stats.sd : null;
  const sem = n >= 2 ? stats.sem : null;
  let cvPercent: number | null = null;
  if (n >= 2 && sd != null && stats.mean !== 0 && Number.isFinite(stats.mean)) {
    cvPercent = (sd / Math.abs(stats.mean)) * 100;
  }

  return {
    id: row.id,
    xRaw: row.xRaw,
    x,
    readingsRaw: row.readings,
    values,
    n,
    mean: stats.mean,
    sd,
    sem,
    min: stats.min,
    max: stats.max,
    cvPercent,
    hasNonNumeric,
    missingCount,
  };
}

function jitterX(x: number, index: number, total: number, spanHint: number): number {
  if (total <= 1) return x;
  const spread = Math.max(Math.abs(spanHint) * 0.02, Math.abs(x) * 0.015, 0.08);
  const t = (index / (total - 1)) * 2 - 1;
  return x + t * spread;
}

export function analyzeXyRegression(
  dataset: XyRegressionDataset,
  options: Pick<ChartDisplayOptions, 'cvWarnThreshold' | 'errorBars'> = {
    cvWarnThreshold: DEFAULT_CHART_OPTIONS.cvWarnThreshold,
    errorBars: DEFAULT_CHART_OPTIONS.errorBars,
  }
): XyRegressionAnalysis {
  const summaries = dataset.rows.map(summarizeRow);
  const warnings: QcWarning[] = [];

  const meanPoints: MeanPoint[] = [];
  summaries.forEach((s) => {
    if (s.x == null || s.mean == null || s.n < 1) return;
    const err =
      options.errorBars === 'sd'
        ? s.sd ?? 0
        : options.errorBars === 'sem'
          ? s.sem ?? 0
          : 0;
    meanPoints.push({
      x: s.x,
      y: s.mean,
      n: s.n,
      sd: s.sd,
      sem: s.sem,
      errorY: err,
      label: String(s.x),
      rowId: s.id,
    });
  });

  const xs = meanPoints.map((p) => p.x);
  const xSpan = xs.length ? Math.max(...xs) - Math.min(...xs) : 1;

  const replicatePoints: ReplicatePoint[] = [];
  summaries.forEach((s) => {
    if (s.x == null) return;
    s.values.forEach((y, i) => {
      replicatePoints.push({
        x: jitterX(s.x as number, i, s.values.length, xSpan || 1),
        y,
        xTrue: s.x as number,
        rowId: s.id,
        readingIndex: i,
      });
    });
  });

  summaries.forEach((s) => {
    if (s.hasNonNumeric) {
      warnings.push({
        code: 'non_numeric',
        severity: 'warn',
        message: `Non-numeric entry in replicates${s.x != null ? ` (X = ${s.x})` : ''}.`,
        rowId: s.id,
        x: s.x,
      });
    }
    if (s.n > 0 && s.missingCount > 0) {
      warnings.push({
        code: 'missing_replicates',
        severity: 'info',
        message: `Missing replicate(s) at X = ${s.x ?? (s.xRaw || '—')} (n = ${s.n} of ${dataset.replicateCount}).`,
        rowId: s.id,
        x: s.x,
      });
    }
    if (s.cvPercent != null && s.cvPercent > options.cvWarnThreshold) {
      warnings.push({
        code: 'high_cv',
        severity: 'warn',
        message: `High replicate variation — X = ${s.x ?? s.xRaw}, CV = ${fmt(s.cvPercent, 1)}%.`,
        rowId: s.id,
        x: s.x,
      });
    }
    if (s.n >= 2 && s.mean === 0) {
      warnings.push({
        code: 'zero_mean_cv',
        severity: 'info',
        message: `Mean is zero at X = ${s.x ?? s.xRaw}; CV% cannot be calculated.`,
        rowId: s.id,
        x: s.x,
      });
    }
    if (s.n >= 2 && s.min != null && s.max != null && s.mean != null && Math.abs(s.mean) > 0) {
      const rangeFrac = (s.max - s.min) / Math.abs(s.mean);
      if (rangeFrac > 0.5) {
        warnings.push({
          code: 'extreme_spread',
          severity: 'warn',
          message: `Extremely different replicate values at X = ${s.x ?? s.xRaw}.`,
          rowId: s.id,
          x: s.x,
        });
      }
    }
  });

  const xCounts = new Map<number, number>();
  meanPoints.forEach((p) => xCounts.set(p.x, (xCounts.get(p.x) || 0) + 1));
  xCounts.forEach((count, x) => {
    if (count > 1) {
      warnings.push({
        code: 'duplicate_x',
        severity: 'warn',
        message: `Duplicate X value ${x} entered as separate rows — each row is summarized independently.`,
        x,
      });
    }
  });

  const uniqueXs = new Set(meanPoints.map((p) => p.x));
  const canRegress = meanPoints.length >= 2 && uniqueXs.size >= 2;

  if (meanPoints.length < 2) {
    warnings.push({
      code: 'insufficient_x',
      severity: 'info',
      message: 'Regression needs at least 2 valid distinct X values with means.',
    });
  } else if (uniqueXs.size < 2) {
    warnings.push({
      code: 'no_x_variation',
      severity: 'warn',
      message: 'No variation in X values — regression cannot run.',
    });
  } else if (meanPoints.length === 2) {
    warnings.push({
      code: 'two_point_caution',
      severity: 'info',
      message: 'Regression based on only 2 points should be interpreted cautiously.',
    });
  }

  let regression: (RegressionResult & { r: number }) | null = null;
  if (canRegress) {
    const fit = linearRegression(meanPoints.map((p) => ({ x: p.x, y: p.y })));
    const corr =
      meanPoints.length >= 3
        ? pearson(meanPoints.map((p) => ({ x: p.x, y: p.y })))
        : {
            r: Number.isFinite(fit.rSquared)
              ? Math.sign(fit.slope || 1) * Math.sqrt(Math.max(0, fit.rSquared))
              : NaN,
          };
    regression = {
      ...fit,
      r: corr.r,
    };
  }

  const ns = meanPoints.map((p) => p.n);
  const typicalN = ns.length
    ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length)
    : dataset.replicateCount;

  return {
    summaries,
    meanPoints,
    replicatePoints,
    regression,
    warnings,
    replicateCount: dataset.replicateCount,
    typicalN,
    canRegress,
  };
}

export function formatStat(n: number | null | undefined, digits: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return fmt(n, digits);
}

export function axisTitle(label: string, unit: string): string {
  const l = label.trim() || 'X';
  const u = unit.trim();
  return u ? `${l} (${u})` : l;
}

export function errorBarSubtitle(mode: ErrorBarMode, typicalN: number): string {
  if (mode === 'none') return `Points represent mean (n ≈ ${typicalN})`;
  const kind = mode === 'sd' ? 'SD' : 'SEM';
  return `Points represent mean ± ${kind}, n ≈ ${typicalN}`;
}

/** Convert module dataset ↔ sheet matrix for pack storage. */
export function datasetToMatrix(dataset: XyRegressionDataset): {
  headers: string[];
  rows: string[][];
} {
  const xHeader = dataset.xLabel.trim() || 'X';
  const readingHeaders = Array.from(
    { length: dataset.replicateCount },
    (_, i) => `Reading ${i + 1}`
  );
  const headers = [xHeader, ...readingHeaders, 'Mean', 'SD', 'SEM', 'N', 'CV%'];
  const analysis = analyzeXyRegression(dataset);
  const byId = new Map(analysis.summaries.map((s) => [s.id, s]));

  const rows = dataset.rows.map((row) => {
    const s = byId.get(row.id);
    const cells = [row.xRaw, ...row.readings.map((r) => String(r ?? ''))];
    while (cells.length < 1 + dataset.replicateCount) cells.push('');
    cells.push(
      s?.mean != null ? String(s.mean) : '',
      s?.sd != null ? String(s.sd) : '',
      s?.sem != null ? String(s.sem) : '',
      s && s.n > 0 ? String(s.n) : '',
      s?.cvPercent != null ? String(s.cvPercent) : ''
    );
    return cells;
  });

  return { headers, rows };
}

export function matrixToDataset(
  headers: string[],
  rows: string[][],
  meta?: Partial<XyRegressionMeta>
): XyRegressionDataset | null {
  if (!headers.length) return null;
  const readingIdx: number[] = [];
  headers.forEach((h, i) => {
    if (
      /^reading\s*\d+$/i.test(String(h).trim()) ||
      /^rep(licate)?\s*\d+$/i.test(String(h).trim())
    ) {
      readingIdx.push(i);
    }
  });

  let xIdx = 0;
  let reps = readingIdx;
  if (reps.length < 2) {
    reps = headers
      .map((_, i) => i)
      .filter((i) => i !== 0)
      .filter((i) => !/^(mean|average|avg|sd|stdev|sem|n|cv%?)$/i.test(headers[i].trim()));
  } else {
    const nonReading = headers.findIndex((_, i) => !reps.includes(i));
    xIdx = nonReading >= 0 ? nonReading : 0;
  }

  if (reps.length < 2) return null;

  const replicateCount = reps.length;
  const dataRows = rows
    .filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
    .map((r) => ({
      id: newRowId(),
      xRaw: String(r[xIdx] ?? ''),
      readings: reps.map((i) => String(r[i] ?? '')),
    }));

  if (!dataRows.length) {
    return {
      ...defaultDataset(replicateCount, 5),
      ...meta,
      xLabel: meta?.xLabel || headers[xIdx] || 'X',
      replicateCount,
    };
  }

  return {
    name: meta?.name || 'XY Regression / Standard Curve',
    xLabel: meta?.xLabel || headers[xIdx] || 'Concentration',
    xUnit: meta?.xUnit || '',
    yLabel: meta?.yLabel || 'Absorbance',
    yUnit: meta?.yUnit || '',
    replicateCount,
    rows: dataRows,
  };
}

export function parsePasteToRows(
  text: string,
  replicateCount: number
): { xRaw: string; readings: string[] }[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const split = (line: string) =>
    line.includes('\t') ? line.split('\t') : line.split(/[,;]+/);

  let start = 0;
  const first = split(lines[0]);
  const firstNums = first.map((c) => parseNumeric(c));
  if (
    first.length >= 2 &&
    firstNums[0] == null &&
    /x|sample|conc|dose|time/i.test(first[0])
  ) {
    start = 1;
  }

  const out: { xRaw: string; readings: string[] }[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = split(lines[i]).map((c) => c.trim());
    if (!cells.some(Boolean)) continue;
    const xRaw = cells[0] ?? '';
    const readings = Array.from({ length: replicateCount }, (_, j) => cells[j + 1] ?? '');
    out.push({ xRaw, readings });
  }
  return out;
}

export function resultsTableMatrix(
  analysis: XyRegressionAnalysis,
  digits: number
): { headers: string[]; rows: string[][] } {
  const headers = ['X', 'N', 'Mean', 'SD', 'SEM', 'Min', 'Max', 'CV %'];
  const rows = analysis.summaries
    .filter((s) => s.x != null || s.n > 0)
    .map((s) => [
      s.x != null ? String(s.x) : s.xRaw,
      String(s.n),
      formatStat(s.mean, digits),
      formatStat(s.sd, digits),
      formatStat(s.sem, digits),
      formatStat(s.min, digits),
      formatStat(s.max, digits),
      s.cvPercent != null ? fmt(s.cvPercent, 1) : '—',
    ]);
  return { headers, rows };
}

export const ANALYSIS_TYPE = {
  id: 'xy_regression_standard_curve' as const,
  name: 'XY Regression / Standard Curve',
  description:
    'Analyze the relationship between a numeric X variable and replicate Y measurements. Calculates replicate statistics, plots mean values with error bars, performs linear regression, and reports the regression equation and R².',
};
