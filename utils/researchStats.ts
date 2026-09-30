/**
 * Research-oriented stats for evidence packs (Excel/Prism-style workflows).
 * Client-side, deterministic — suitable for exploratory lab analysis.
 */

export type DescriptiveStats = {
  n: number;
  mean: number;
  sd: number;
  sem: number;
  median: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
};

export type GroupSummary = DescriptiveStats & { group: string };

export type TTestResult = {
  test: 'welch_ttest' | 'student_ttest';
  groupA: string;
  groupB: string;
  nA: number;
  nB: number;
  meanA: number;
  meanB: number;
  sdA: number;
  sdB: number;
  t: number;
  df: number;
  pValue: number;
  meanDiff: number;
  ci95: [number, number];
  significant: boolean;
};

export type AnovaResult = {
  test: 'one_way_anova';
  groups: GroupSummary[];
  F: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  significant: boolean;
};

export type CorrelationResult = {
  test: 'pearson';
  n: number;
  r: number;
  rSquared: number;
  pValue: number;
  significant: boolean;
};

export type RegressionResult = {
  test: 'linear_regression';
  n: number;
  slope: number;
  intercept: number;
  rSquared: number;
  residualSe: number;
  equation: string;
};

export type AnalysisPayload =
  | { kind: 'descriptive'; groups: GroupSummary[] }
  | { kind: 'ttest'; descriptive: GroupSummary[]; result: TTestResult }
  | { kind: 'anova'; result: AnovaResult }
  | { kind: 'correlation'; result: CorrelationResult; points: { x: number; y: number }[] }
  | { kind: 'regression'; result: RegressionResult; points: { x: number; y: number }[] };

export function parseNumeric(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/,/g, '');
  if (!s || s === '-' || s === '.' || /^na(n)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function columnIndex(headers: string[], name: string): number {
  return headers.findIndex((h) => h === name);
}

/** Extract paired (group, value) rows from a matrix. */
export function extractGroupedValues(
  headers: string[],
  rows: string[][],
  groupCol: string,
  valueCol: string
): Map<string, number[]> {
  const gi = columnIndex(headers, groupCol);
  const vi = columnIndex(headers, valueCol);
  const map = new Map<string, number[]>();
  if (gi < 0 || vi < 0) return map;
  rows.forEach((row) => {
    const g = String(row[gi] ?? '').trim();
    const v = parseNumeric(row[vi]);
    if (!g || v == null) return;
    const list = map.get(g) || [];
    list.push(v);
    map.set(g, list);
  });
  return map;
}

export function extractXY(
  headers: string[],
  rows: string[][],
  xCol: string,
  yCol: string
): { x: number; y: number }[] {
  const xi = columnIndex(headers, xCol);
  const yi = columnIndex(headers, yCol);
  if (xi < 0 || yi < 0) return [];
  const out: { x: number; y: number }[] = [];
  rows.forEach((row) => {
    const x = parseNumeric(row[xi]);
    const y = parseNumeric(row[yi]);
    if (x == null || y == null) return;
    out.push({ x, y });
  });
  return out;
}

function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

export function describe(values: number[]): DescriptiveStats {
  const n = values.length;
  if (!n) {
    return { n: 0, mean: NaN, sd: NaN, sem: NaN, median: NaN, min: NaN, max: NaN, q1: NaN, q3: NaN };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = n > 1 ? values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  return {
    n,
    mean,
    sd,
    sem: n > 0 ? sd / Math.sqrt(n) : NaN,
    median: quantile(sorted, 0.5),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
  };
}

export function describeGroups(grouped: Map<string, number[]>): GroupSummary[] {
  return Array.from(grouped.entries())
    .map(([group, values]) => ({ group, ...describe(values) }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

/** Approximate two-tailed p from t via regularized incomplete beta (good enough for lab UI). */
function tDistPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return 1;
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  const ib = incompleteBeta(x, a, b);
  return Math.min(1, Math.max(0, ib));
}

/** Continued-fraction incomplete beta Ix(a,b) */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  // Lentz continued fraction
  let f = 1;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  f = d;
  for (let m = 1; m <= 200; m++) {
    let num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    f *= d * c;

    num = (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-8) break;
  }
  return front * f;
}

function logGamma(z: number): number {
  // Lanczos approximation
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.984369654078761e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function fDistPValue(F: number, d1: number, d2: number): number {
  if (!Number.isFinite(F) || F < 0 || d1 <= 0 || d2 <= 0) return 1;
  const x = d2 / (d2 + d1 * F);
  return incompleteBeta(x, d2 / 2, d1 / 2);
}

export function welchTTest(a: number[], b: number[], labelA = 'A', labelB = 'B'): TTestResult {
  const da = describe(a);
  const db = describe(b);
  const va = da.sd ** 2;
  const vb = db.sd ** 2;
  const se = Math.sqrt(va / da.n + vb / db.n);
  const t = se > 0 ? (da.mean - db.mean) / se : 0;
  const num = (va / da.n + vb / db.n) ** 2;
  const den =
    (va / da.n) ** 2 / Math.max(da.n - 1, 1) + (vb / db.n) ** 2 / Math.max(db.n - 1, 1);
  const df = den > 0 ? num / den : 1;
  const pValue = tDistPValue(t, df);
  const meanDiff = da.mean - db.mean;
  const crit = 1.96; // approx for CI display
  return {
    test: 'welch_ttest',
    groupA: labelA,
    groupB: labelB,
    nA: da.n,
    nB: db.n,
    meanA: da.mean,
    meanB: db.mean,
    sdA: da.sd,
    sdB: db.sd,
    t,
    df,
    pValue,
    meanDiff,
    ci95: [meanDiff - crit * se, meanDiff + crit * se],
    significant: pValue < 0.05,
  };
}

export function oneWayAnova(grouped: Map<string, number[]>): AnovaResult {
  const groups = describeGroups(grouped);
  const all = Array.from(grouped.values()).flat();
  const N = all.length;
  const k = groups.length;
  const grand = describe(all).mean;
  let ssBetween = 0;
  let ssWithin = 0;
  groups.forEach((g) => {
    const vals = grouped.get(g.group) || [];
    ssBetween += g.n * (g.mean - grand) ** 2;
    vals.forEach((v) => {
      ssWithin += (v - g.mean) ** 2;
    });
  });
  const dfBetween = Math.max(k - 1, 1);
  const dfWithin = Math.max(N - k, 1);
  const msB = ssBetween / dfBetween;
  const msW = ssWithin / dfWithin;
  const F = msW > 0 ? msB / msW : 0;
  const pValue = fDistPValue(F, dfBetween, dfWithin);
  return {
    test: 'one_way_anova',
    groups,
    F,
    dfBetween,
    dfWithin,
    pValue,
    significant: pValue < 0.05,
  };
}

export function pearson(points: { x: number; y: number }[]): CorrelationResult {
  const n = points.length;
  if (n < 3) {
    return { test: 'pearson', n, r: NaN, rSquared: NaN, pValue: 1, significant: false };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const mx = describe(xs).mean;
  const my = describe(ys).mean;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const r = dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : 0;
  const df = n - 2;
  const t = Math.abs(r) < 1 ? (r * Math.sqrt(df)) / Math.sqrt(1 - r * r) : Infinity;
  const pValue = Number.isFinite(t) ? tDistPValue(t, df) : 0;
  return {
    test: 'pearson',
    n,
    r,
    rSquared: r * r,
    pValue,
    significant: pValue < 0.05,
  };
}

export function linearRegression(points: { x: number; y: number }[]): RegressionResult {
  const n = points.length;
  if (n < 2) {
    return {
      test: 'linear_regression',
      n,
      slope: NaN,
      intercept: NaN,
      rSquared: NaN,
      residualSe: NaN,
      equation: 'y = —',
    };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const mx = describe(xs).mean;
  const my = describe(ys).mean;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = my - slope * mx;
  const corr = pearson(points);
  let rss = 0;
  points.forEach((p) => {
    const pred = intercept + slope * p.x;
    rss += (p.y - pred) ** 2;
  });
  const residualSe = n > 2 ? Math.sqrt(rss / (n - 2)) : 0;
  const sign = intercept >= 0 ? '+' : '−';
  return {
    test: 'linear_regression',
    n,
    slope,
    intercept,
    rSquared: corr.rSquared,
    residualSe,
    equation: `y = ${fmt(slope)}·x ${sign} ${fmt(Math.abs(intercept))}`,
  };
}

export function fmt(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000 || (Math.abs(n) > 0 && Math.abs(n) < 0.001)) return n.toExponential(3);
  return Number(n.toPrecision(digits)).toString();
}

export function fmtP(p: number): string {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.0001) return '<0.0001';
  return p.toFixed(4);
}

export type PlotSeriesPoint = {
  label: string;
  mean?: number;
  sem?: number;
  sd?: number;
  n?: number;
  x?: number;
  y?: number;
};

export function columnPlotData(groups: GroupSummary[]): PlotSeriesPoint[] {
  return groups.map((g) => ({
    label: g.group,
    mean: g.mean,
    sem: g.sem,
    sd: g.sd,
    n: g.n,
  }));
}
