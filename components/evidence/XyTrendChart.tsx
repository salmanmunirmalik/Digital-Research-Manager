import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { resolveMatrixFormulas } from '../../utils/sheetFormulas';
import { fmt, linearRegression, parseNumeric } from '../../utils/researchStats';

export type AxisBounds = {
  xMin?: number | null;
  xMax?: number | null;
  yMin?: number | null;
  yMax?: number | null;
};

type Props = {
  headers: string[];
  rows: string[][];
  /** Default X column index (0 = first column). */
  defaultXIndex?: number;
  title?: string;
  height?: number;
  className?: string;
  /** Hide column pickers (print-only surfaces). */
  hideColumnPickers?: boolean;
  /** Show axis min/max controls (default true). */
  showBounds?: boolean;
  bounds?: AxisBounds;
  onBoundsChange?: (next: AxisBounds) => void;
};

function findAverageColumnIndex(headers: string[]): number {
  const exact = headers.findIndex((h) => /^(average|mean|avg)$/i.test(String(h).trim()));
  if (exact >= 0) return exact;
  return headers.findIndex((h) => /average|mean/i.test(String(h).trim()));
}

function extractPairs(
  rows: string[][],
  xIndex: number,
  yIndex: number
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  rows.forEach((row) => {
    const x = parseNumeric(row[xIndex]);
    const y = parseNumeric(row[yIndex]);
    if (x == null || y == null) return;
    out.push({ x, y });
  });
  return out;
}

function pickDefaultXIndex(
  headers: string[],
  rows: string[][],
  yIndex: number,
  preferred = 0
): number {
  const tryOrder = [
    preferred,
    ...headers.map((_, i) => i).filter((i) => i !== preferred),
  ].filter((i) => i !== yIndex && i >= 0 && i < headers.length);

  for (const i of tryOrder) {
    if (extractPairs(rows, i, yIndex).length >= 2) return i;
  }
  return preferred < headers.length ? preferred : 0;
}

function parseBound(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function axisDomain(
  min: number | null | undefined,
  max: number | null | undefined
): [number | 'auto', number | 'auto'] | [number, number] {
  const lo = min != null && Number.isFinite(min) ? min : null;
  const hi = max != null && Number.isFinite(max) ? max : null;
  if (lo != null && hi != null && lo < hi) return [lo, hi];
  if (lo != null && hi != null && lo >= hi) return [hi, lo];
  if (lo != null) return [lo, 'auto'];
  if (hi != null) return ['auto', hi];
  return ['auto', 'auto'];
}

/**
 * XY scatter with linear trendline, equation, R², and optional axis bounds.
 * Defaults: X = column 1 (or first numeric), Y = Average.
 */
const XyTrendChart: React.FC<Props> = ({
  headers,
  rows,
  defaultXIndex = 0,
  title,
  height = 300,
  className = '',
  hideColumnPickers = false,
  showBounds = true,
  bounds: controlledBounds,
  onBoundsChange,
}) => {
  const resolved = useMemo(() => resolveMatrixFormulas(headers, rows), [headers, rows]);

  const avgIdx = useMemo(() => findAverageColumnIndex(resolved.headers), [resolved.headers]);

  const initialY = avgIdx >= 0 ? avgIdx : Math.min(1, Math.max(0, headers.length - 1));
  const initialX = pickDefaultXIndex(
    resolved.headers,
    resolved.rows,
    initialY,
    defaultXIndex
  );

  const [xIndex, setXIndex] = useState(initialX);
  const [yIndex, setYIndex] = useState(initialY);
  const [userPicked, setUserPicked] = useState(false);

  const [localBounds, setLocalBounds] = useState<AxisBounds>({
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null,
  });
  const bounds = controlledBounds ?? localBounds;
  const setBounds = (next: AxisBounds) => {
    if (onBoundsChange) onBoundsChange(next);
    else setLocalBounds(next);
  };

  const [xMinStr, setXMinStr] = useState('');
  const [xMaxStr, setXMaxStr] = useState('');
  const [yMinStr, setYMinStr] = useState('');
  const [yMaxStr, setYMaxStr] = useState('');

  useEffect(() => {
    setXMinStr(bounds.xMin != null ? String(bounds.xMin) : '');
    setXMaxStr(bounds.xMax != null ? String(bounds.xMax) : '');
    setYMinStr(bounds.yMin != null ? String(bounds.yMin) : '');
    setYMaxStr(bounds.yMax != null ? String(bounds.yMax) : '');
  }, [bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax]);

  useEffect(() => {
    if (userPicked) {
      if (xIndex >= resolved.headers.length) setXIndex(0);
      if (yIndex >= resolved.headers.length) {
        setYIndex(avgIdx >= 0 ? avgIdx : Math.min(1, resolved.headers.length - 1));
      }
      return;
    }
    const nextY = avgIdx >= 0 ? avgIdx : Math.min(1, Math.max(0, resolved.headers.length - 1));
    const nextX = pickDefaultXIndex(resolved.headers, resolved.rows, nextY, defaultXIndex);
    setYIndex(nextY);
    setXIndex(nextX);
  }, [
    avgIdx,
    defaultXIndex,
    resolved.headers,
    resolved.rows,
    userPicked,
    xIndex,
    yIndex,
  ]);

  const points = useMemo(
    () => extractPairs(resolved.rows, xIndex, yIndex),
    [resolved.rows, xIndex, yIndex]
  );

  const fit = useMemo(() => (points.length >= 2 ? linearRegression(points) : null), [points]);

  const xDomain = axisDomain(bounds.xMin, bounds.xMax);
  const yDomain = axisDomain(bounds.yMin, bounds.yMax);

  const fitLine = useMemo(() => {
    if (!fit || !Number.isFinite(fit.slope) || points.length < 2) return [];
    const xs = points.map((p) => p.x);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    if (typeof xDomain[0] === 'number') minX = xDomain[0];
    if (typeof xDomain[1] === 'number') maxX = xDomain[1];
    if (minX === maxX) {
      return [{ x: minX, y: fit.intercept + fit.slope * minX }];
    }
    return [
      { x: minX, y: fit.intercept + fit.slope * minX },
      { x: maxX, y: fit.intercept + fit.slope * maxX },
    ];
  }, [fit, points, xDomain]);

  const xLabel = resolved.headers[xIndex] || 'X';
  const yLabel = resolved.headers[yIndex] || 'Y';
  const hasAverage = avgIdx >= 0;

  const commitBounds = (partial: Partial<Record<'xMin' | 'xMax' | 'yMin' | 'yMax', string>>) => {
    const nextStr = {
      xMin: partial.xMin ?? xMinStr,
      xMax: partial.xMax ?? xMaxStr,
      yMin: partial.yMin ?? yMinStr,
      yMax: partial.yMax ?? yMaxStr,
    };
    setBounds({
      xMin: parseBound(nextStr.xMin),
      xMax: parseBound(nextStr.xMax),
      yMin: parseBound(nextStr.yMin),
      yMax: parseBound(nextStr.yMax),
    });
  };

  const clearBounds = () => {
    setXMinStr('');
    setXMaxStr('');
    setYMinStr('');
    setYMaxStr('');
    setBounds({ xMin: null, xMax: null, yMin: null, yMax: null });
  };

  if (resolved.headers.length < 2) {
    return null;
  }

  if (hideColumnPickers && !showBounds && points.length < 2) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            XY plot
          </p>
          <p className="text-[14px] font-semibold text-slate-900">
            {title || `${xLabel} vs ${yLabel}`}
          </p>
          {!hasAverage && (
            <p className="mt-0.5 text-[11px] text-amber-800">
              No Average column found — pick Y manually, or add replicates → Average first.
            </p>
          )}
        </div>
        {!hideColumnPickers && (
          <div className="flex flex-wrap gap-2 text-[12px]">
            <label className="flex items-center gap-1.5 text-slate-600">
              <span className="font-medium">X</span>
              <select
                value={xIndex}
                onChange={(e) => {
                  setUserPicked(true);
                  setXIndex(Number(e.target.value));
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-800"
              >
                {resolved.headers.map((h, i) => (
                  <option key={`${h}-${i}`} value={i}>
                    {h || `Col ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-slate-600">
              <span className="font-medium">Y</span>
              <select
                value={yIndex}
                onChange={(e) => {
                  setUserPicked(true);
                  setYIndex(Number(e.target.value));
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-800"
              >
                {resolved.headers.map((h, i) => (
                  <option key={`${h}-${i}`} value={i}>
                    {h || `Col ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            {hasAverage && (
              <button
                type="button"
                onClick={() => {
                  setUserPicked(false);
                  setXIndex(
                    pickDefaultXIndex(resolved.headers, resolved.rows, avgIdx, defaultXIndex)
                  );
                  setYIndex(avgIdx);
                }}
                className="text-[11px] font-medium text-sky-800 hover:underline"
              >
                Reset to col 1 vs Average
              </button>
            )}
          </div>
        )}
      </div>

      {showBounds && (
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-end gap-2 print:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-full sm:w-auto sm:mr-1">
            Axis bounds
          </p>
          {(
            [
              ['X min', xMinStr, setXMinStr, 'xMin'],
              ['X max', xMaxStr, setXMaxStr, 'xMax'],
              ['Y min', yMinStr, setYMinStr, 'yMin'],
              ['Y max', yMaxStr, setYMaxStr, 'yMax'],
            ] as const
          ).map(([label, value, setValue, key]) => (
            <label key={key} className="flex flex-col gap-0.5 text-[11px] text-slate-600">
              <span>{label}</span>
              <input
                type="number"
                step="any"
                value={value}
                placeholder="auto"
                onChange={(e) => setValue(e.target.value)}
                onBlur={(e) => commitBounds({ [key]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-[5.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-800 tabular-nums"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={clearBounds}
            className="ml-1 mb-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 underline"
          >
            Auto all
          </button>
        </div>
      )}

      {/* Print title when chrome is hidden */}
      <p className="hidden print:block px-4 pt-3 text-[13px] font-semibold text-slate-900">
        {title || `${xLabel} vs ${yLabel}`}
      </p>

      {points.length < 2 ? (
        <div className="px-4 py-12 text-center text-[13px] text-slate-500">
          Need at least two numeric pairs. Column 1 should be a numeric X (e.g. dose /
          concentration); Y defaults to Average.
        </div>
      ) : (
        <div className="relative px-2 pt-2 pb-3">
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart margin={{ top: 28, right: 20, left: 8, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="x"
                name={xLabel}
                domain={xDomain}
                allowDataOverflow
                tick={{ fontSize: 11, fill: '#475569' }}
                label={{
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -4,
                  style: { fontSize: 11, fill: '#64748b' },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yLabel}
                domain={yDomain}
                allowDataOverflow
                tick={{ fontSize: 11, fill: '#475569' }}
                label={{
                  value: yLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: '#64748b' },
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  fmt(value),
                  name === 'y' ? yLabel : name,
                ]}
                labelFormatter={(label) => `${xLabel}: ${fmt(Number(label))}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Scatter data={points} fill="#0369a1" name="Data" />
              {fitLine.length >= 2 && (
                <Line
                  data={fitLine}
                  type="linear"
                  dataKey="y"
                  stroke="#b45309"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  name="Trendline"
                  legendType="line"
                  isAnimationActive={false}
                />
              )}
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </ComposedChart>
          </ResponsiveContainer>

          {fit && Number.isFinite(fit.rSquared) && (
            <div className="pointer-events-none absolute top-3 right-4 rounded-lg border border-amber-200/80 bg-amber-50/95 px-2.5 py-1.5 shadow-sm print:bg-white">
              <p className="text-[12px] font-semibold text-amber-950 tabular-nums">
                {fit.equation}
              </p>
              <p className="text-[11px] text-amber-900/90 tabular-nums">
                R² = {fmt(fit.rSquared, 4)} · n = {fit.n}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XyTrendChart;
