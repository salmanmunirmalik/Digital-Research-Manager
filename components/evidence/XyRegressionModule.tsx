import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ANALYSIS_TYPE,
  analyzeXyRegression,
  axisTitle,
  DEFAULT_CHART_OPTIONS,
  defaultDataset,
  ensureReplicateWidth,
  errorBarSubtitle,
  exampleDataset,
  formatStat,
  newRowId,
  parsePasteToRows,
  type ChartDisplayOptions,
  type XyRegressionDataset,
} from '../../utils/xyRegression';
import { fmt } from '../../utils/researchStats';
import {
  exportChartPdf,
  exportChartPng,
  exportChartSvg,
  exportFullReport,
  exportResultsCsv,
  exportResultsExcel,
} from '../../utils/xyRegressionExport';

type Props = {
  /** Controlled dataset (syncs with parent). */
  value?: XyRegressionDataset;
  onChange?: (next: XyRegressionDataset) => void;
  /** Uncontrolled initial dataset (used once on mount / when `key` changes). */
  initial?: XyRegressionDataset;
  /** When true and no value/initial, start with the worked example. */
  seedExample?: boolean;
  className?: string;
};

const btn =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50';
const btnPrimary =
  'inline-flex items-center justify-center gap-1 rounded-lg bg-sky-700 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-sm hover:bg-sky-800 transition-colors disabled:opacity-50';
const field =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300';
const label = 'mb-1 block text-[11px] font-medium text-slate-600';

/**
 * Reusable Replicate Data Entry + XY Regression / Standard Curve module.
 * Workflow: raw replicates → row stats → mean±error plot → linear regression on means.
 */
const XyRegressionModule: React.FC<Props> = ({
  value,
  onChange,
  initial,
  seedExample = false,
  className = '',
}) => {
  const [internal, setInternal] = useState<XyRegressionDataset>(() =>
    value ?? initial ?? (seedExample ? exampleDataset() : defaultDataset(3, 5))
  );
  const dataset = value ?? internal;
  const setDataset = (next: XyRegressionDataset) => {
    if (onChange) onChange(next);
    else setInternal(next);
  };

  const [options, setOptions] = useState<ChartDisplayOptions>({ ...DEFAULT_CHART_OPTIONS });
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);

  const analysis = useMemo(
    () =>
      analyzeXyRegression(dataset, {
        cvWarnThreshold: options.cvWarnThreshold,
        errorBars: options.errorBars,
      }),
    [dataset, options.cvWarnThreshold, options.errorBars]
  );

  const digits = options.decimalPlaces;

  const fitLine = useMemo(() => {
    if (options.regression !== 'linear' || !analysis.regression || analysis.meanPoints.length < 2) {
      return [];
    }
    const xs = analysis.meanPoints.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const { slope, intercept } = analysis.regression;
    return [
      { x: minX, y: intercept + slope * minX },
      { x: maxX, y: intercept + slope * maxX },
    ];
  }, [analysis.meanPoints, analysis.regression, options.regression]);

  const patchMeta = (partial: Partial<XyRegressionDataset>) =>
    setDataset({ ...dataset, ...partial });

  const updateCell = (rowId: string, kind: 'x' | number, raw: string) => {
    setDataset({
      ...dataset,
      rows: dataset.rows.map((row) => {
        if (row.id !== rowId) return row;
        if (kind === 'x') return { ...row, xRaw: raw };
        const readings = [...row.readings];
        readings[kind] = raw;
        return { ...row, readings };
      }),
    });
  };

  const addRow = () => {
    setDataset({
      ...dataset,
      rows: [
        ...dataset.rows,
        {
          id: newRowId(),
          xRaw: '',
          readings: Array.from({ length: dataset.replicateCount }, () => ''),
        },
      ],
    });
  };

  const deleteRow = (id: string) => {
    if (dataset.rows.length <= 1) return;
    setDataset({ ...dataset, rows: dataset.rows.filter((r) => r.id !== id) });
  };

  const addReplicate = () => setDataset(ensureReplicateWidth(dataset, dataset.replicateCount + 1));
  const removeReplicate = () => {
    if (dataset.replicateCount <= 2) return;
    setDataset(ensureReplicateWidth(dataset, dataset.replicateCount - 1));
  };

  const clearDataset = () => setDataset(defaultDataset(dataset.replicateCount, 5));

  const applyPaste = () => {
    const parsed = parsePasteToRows(pasteText, dataset.replicateCount);
    if (!parsed.length) return;
    setDataset({
      ...dataset,
      rows: parsed.map((p) => ({
        id: newRowId(),
        xRaw: p.xRaw,
        readings: p.readings,
      })),
    });
    setPasteOpen(false);
    setPasteText('');
  };

  const runExport = async (kind: string) => {
    setExportMsg('');
    try {
      if (kind === 'csv') exportResultsCsv(dataset, analysis, digits);
      else if (kind === 'xlsx') exportResultsExcel(dataset, analysis, digits);
      else if (kind === 'png') await exportChartPng(chartRef.current, dataset.name);
      else if (kind === 'svg') await exportChartSvg(chartRef.current, dataset.name);
      else if (kind === 'pdf-chart') await exportChartPdf(chartRef.current, dataset.name);
      else if (kind === 'report') {
        await exportFullReport({
          dataset,
          analysis,
          options,
          chartEl: chartRef.current,
        });
      }
      setExportMsg('Export ready');
    } catch (err) {
      setExportMsg(err instanceof Error ? err.message : 'Export failed');
    }
  };

  useEffect(() => {
    if (!exportMsg) return;
    const t = window.setTimeout(() => setExportMsg(''), 2500);
    return () => window.clearTimeout(t);
  }, [exportMsg]);

  const xAxis = axisTitle(dataset.xLabel, dataset.xUnit);
  const yAxis = axisTitle(dataset.yLabel, dataset.yUnit);
  const subtitle = errorBarSubtitle(options.errorBars, analysis.typicalN);

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-sky-200/40 overflow-hidden ${className}`}
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50/90 via-white to-slate-50/80 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800/80">
              Analysis
            </p>
            <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
              {ANALYSIS_TYPE.name}
            </h3>
            <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-500">
              {ANALYSIS_TYPE.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <button type="button" className={btn} onClick={() => setDataset(exampleDataset())}>
              Load example
            </button>
            <button type="button" className={btn} onClick={clearDataset}>
              Clear dataset
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label className={label}>Dataset name</label>
            <input
              className={field}
              value={dataset.name}
              onChange={(e) => patchMeta({ name: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>X variable</label>
            <input
              className={field}
              value={dataset.xLabel}
              onChange={(e) => patchMeta({ xLabel: e.target.value })}
              placeholder="Concentration"
            />
          </div>
          <div>
            <label className={label}>X unit</label>
            <input
              className={field}
              value={dataset.xUnit}
              onChange={(e) => patchMeta({ xUnit: e.target.value })}
              placeholder="µg/mL"
            />
          </div>
          <div>
            <label className={label}>Y variable</label>
            <input
              className={field}
              value={dataset.yLabel}
              onChange={(e) => patchMeta({ yLabel: e.target.value })}
              placeholder="Absorbance"
            />
          </div>
          <div>
            <label className={label}>Y unit</label>
            <input
              className={field}
              value={dataset.yUnit}
              onChange={(e) => patchMeta({ yUnit: e.target.value })}
              placeholder="AU"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {/* Data entry */}
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-[14px] font-semibold text-slate-900">1. Enter replicates</h4>
              <p className="text-[12px] text-slate-500">
                First column = X. Remaining columns = replicate Y readings. Empty cells are ignored
                (not treated as zero).
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={btn} onClick={addRow}>
                Add X row
              </button>
              <button type="button" className={btn} onClick={addReplicate}>
                Add replicate
              </button>
              <button
                type="button"
                className={btn}
                onClick={removeReplicate}
                disabled={dataset.replicateCount <= 2}
              >
                Remove replicate
              </button>
              <button type="button" className={btn} onClick={() => setPasteOpen((v) => !v)}>
                Paste from Excel
              </button>
            </div>
          </div>

          {pasteOpen && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-2">
              <p className="text-[12px] text-slate-600">
                Paste tab-separated rows: X, Reading 1, Reading 2… (header row optional).
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                className={`${field} font-mono text-[12px]`}
                placeholder={'0\t0.021\t0.018\t0.020\n2\t0.181\t0.188\t0.175'}
              />
              <div className="flex gap-2">
                <button type="button" className={btnPrimary} onClick={applyPaste}>
                  Apply paste
                </button>
                <button type="button" className={btn} onClick={() => setPasteOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-[13px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2.5 py-2 font-semibold sticky left-0 bg-slate-50">
                    {dataset.xLabel || 'X'}
                    {dataset.xUnit ? ` (${dataset.xUnit})` : ''}
                  </th>
                  {Array.from({ length: dataset.replicateCount }, (_, i) => (
                    <th key={i} className="px-2.5 py-2 font-semibold whitespace-nowrap">
                      Reading {i + 1}
                    </th>
                  ))}
                  <th className="px-2.5 py-2 font-semibold text-slate-400">Mean</th>
                  <th className="px-2.5 py-2 font-semibold text-slate-400">SD</th>
                  <th className="px-2.5 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {dataset.rows.map((row, ri) => {
                  const s = analysis.summaries[ri];
                  return (
                    <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-1.5 py-1 sticky left-0 bg-white">
                        <input
                          className={`${field} min-w-[5rem]`}
                          value={row.xRaw}
                          onChange={(e) => updateCell(row.id, 'x', e.target.value)}
                          aria-label={`X value row ${ri + 1}`}
                        />
                      </td>
                      {row.readings.map((cell, ci) => (
                        <td key={ci} className="px-1.5 py-1">
                          <input
                            className={`${field} min-w-[4.5rem]`}
                            value={cell}
                            onChange={(e) => updateCell(row.id, ci, e.target.value)}
                            aria-label={`Reading ${ci + 1} row ${ri + 1}`}
                          />
                        </td>
                      ))}
                      <td className="px-2.5 py-1 tabular-nums text-slate-700">
                        {formatStat(s?.mean, digits)}
                      </td>
                      <td className="px-2.5 py-1 tabular-nums text-slate-500">
                        {formatStat(s?.sd, digits)}
                      </td>
                      <td className="px-1.5 py-1">
                        <button
                          type="button"
                          className="rounded-md px-1.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50"
                          onClick={() => deleteRow(row.id)}
                          disabled={dataset.rows.length <= 1}
                          aria-label="Delete row"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary table */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="text-[14px] font-semibold text-slate-900">2. Summary statistics</h4>
              <p className="text-[12px] text-slate-500">
                Per X-value: N, mean, sample SD, SEM, min, max, CV%. Regression uses these means.
              </p>
            </div>
            <label className="text-[12px] text-slate-600">
              Decimal places
              <select
                className={`${field} mt-1 w-20`}
                value={options.decimalPlaces}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, decimalPlaces: Number(e.target.value) }))
                }
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-[13px]">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {['X', 'N', 'Mean', 'SD', 'SEM', 'Min', 'Max', 'CV %'].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.summaries
                  .filter((s) => s.x != null || s.n > 0)
                  .map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {s.x != null ? s.x : s.xRaw || '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{s.n}</td>
                      <td className="px-3 py-2 tabular-nums">{formatStat(s.mean, digits)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatStat(s.sd, digits)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatStat(s.sem, digits)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatStat(s.min, digits)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatStat(s.max, digits)}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {s.cvPercent != null ? fmt(s.cvPercent, 1) : '—'}
                      </td>
                    </tr>
                  ))}
                {!analysis.summaries.some((s) => s.x != null || s.n > 0) && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-[13px] text-slate-500">
                      Enter X values and readings to see summary statistics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Chart settings + chart + analysis panel */}
        <section className="space-y-3">
          <div>
            <h4 className="text-[14px] font-semibold text-slate-900">
              3. XY scatter &amp; regression
            </h4>
            <p className="text-[12px] text-slate-500">
              Default fit uses <span className="font-medium text-slate-700">mean Y at each X</span>
              — not individual technical replicates as separate regression points.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <p className="text-[12px] font-semibold text-slate-800">Chart settings</p>

              <label className="block text-[12px] text-slate-600">
                Plot
                <select
                  className={`${field} mt-1`}
                  value={options.pointsMode}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      pointsMode: e.target.value as ChartDisplayOptions['pointsMode'],
                    }))
                  }
                >
                  <option value="mean">Mean only</option>
                  <option value="mean_replicates">Mean + individual replicates</option>
                </select>
              </label>

              <label className="block text-[12px] text-slate-600">
                Error bars
                <select
                  className={`${field} mt-1`}
                  value={options.errorBars}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      errorBars: e.target.value as ChartDisplayOptions['errorBars'],
                    }))
                  }
                >
                  <option value="none">None</option>
                  <option value="sd">SD</option>
                  <option value="sem">SEM</option>
                </select>
              </label>

              <label className="block text-[12px] text-slate-600">
                Regression
                <select
                  className={`${field} mt-1`}
                  value={options.regression}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      regression: e.target.value as ChartDisplayOptions['regression'],
                    }))
                  }
                >
                  <option value="none">None</option>
                  <option value="linear">Linear regression</option>
                </select>
              </label>

              <div className="space-y-1.5 pt-1">
                {(
                  [
                    ['showEquation', 'Regression equation'],
                    ['showR2', 'R²'],
                    ['showLegend', 'Legend'],
                    ['showGrid', 'Grid'],
                    ['showPointLabels', 'Point labels'],
                  ] as const
                ).map(([key, text]) => (
                  <label key={key} className="flex items-center gap-2 text-[12px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))}
                      className="rounded border-slate-300"
                    />
                    {text}
                  </label>
                ))}
              </div>

              <label className="block text-[12px] text-slate-600">
                High-CV warning (%)
                <input
                  type="number"
                  min={1}
                  max={100}
                  className={`${field} mt-1`}
                  value={options.cvWarnThreshold}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      cvWarnThreshold: Math.max(1, Number(e.target.value) || 15),
                    }))
                  }
                />
              </label>
            </div>

            <div className="lg:col-span-6 space-y-2">
              <div
                ref={chartRef}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2">
                  <p className="text-[13px] font-semibold text-slate-900">{dataset.name}</p>
                  <p className="text-[11px] text-slate-500">{subtitle}</p>
                </div>
                <div className="h-[320px] w-full">
                  {analysis.meanPoints.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[13px] text-slate-400">
                      Add at least one valid X with readings to plot.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 12, right: 16, bottom: 8, left: 8 }}>
                        {options.showGrid ? (
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        ) : null}
                        <XAxis
                          type="number"
                          dataKey="x"
                          name={xAxis}
                          label={{ value: xAxis, position: 'insideBottom', offset: -2, fontSize: 11 }}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          domain={['auto', 'auto']}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name={yAxis}
                          label={{
                            value: yAxis,
                            angle: -90,
                            position: 'insideLeft',
                            offset: 8,
                            fontSize: 11,
                          }}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          formatter={(value: number, name: string) => [
                            formatStat(value, digits),
                            name,
                          ]}
                          labelFormatter={(label) => `${xAxis}: ${label}`}
                        />
                        {options.showLegend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}

                        {options.pointsMode === 'mean_replicates' &&
                        analysis.replicatePoints.length ? (
                          <Scatter
                            name="Replicates"
                            data={analysis.replicatePoints}
                            fill="#94a3b8"
                            fillOpacity={0.7}
                            legendType="circle"
                          />
                        ) : null}

                        <Scatter
                          name="Mean"
                          data={analysis.meanPoints}
                          fill="#0369a1"
                          stroke="#0c4a6e"
                          strokeWidth={1.5}
                          legendType="circle"
                        >
                          {options.errorBars !== 'none' ? (
                            <ErrorBar
                              dataKey="errorY"
                              width={5}
                              strokeWidth={1.25}
                              stroke="#0369a1"
                              direction="y"
                            />
                          ) : null}
                        </Scatter>

                        {options.regression === 'linear' && fitLine.length === 2 ? (
                          <Line
                            name="Linear fit"
                            data={fitLine}
                            dataKey="y"
                            stroke="#0f766e"
                            strokeWidth={2}
                            dot={false}
                            legendType="line"
                            isAnimationActive={false}
                          />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {(options.showEquation || options.showR2) && analysis.regression ? (
                  <p className="mt-2 text-center text-[12px] text-slate-700">
                    {options.showEquation ? analysis.regression.equation : null}
                    {options.showEquation && options.showR2 ? ' · ' : null}
                    {options.showR2
                      ? `R² = ${
                          Number.isFinite(analysis.regression.rSquared)
                            ? fmt(analysis.regression.rSquared, 4)
                            : '—'
                        }`
                      : null}
                  </p>
                ) : null}
                {options.showPointLabels && analysis.meanPoints.length > 0 ? (
                  <p className="mt-1 text-center text-[11px] text-slate-400">
                    Labels: {analysis.meanPoints.map((p) => p.label).join(', ')}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-3.5">
                <p className="text-[12px] font-semibold text-teal-950">Linear regression</p>
                {analysis.regression && options.regression === 'linear' ? (
                  <dl className="mt-2 space-y-1.5 text-[12px] text-slate-700">
                    <div>
                      <dt className="text-slate-500">Equation</dt>
                      <dd className="font-medium text-slate-900">{analysis.regression.equation}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Slope</span>
                      <span className="tabular-nums font-medium">
                        {formatStat(analysis.regression.slope, digits)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Intercept</span>
                      <span className="tabular-nums font-medium">
                        {formatStat(analysis.regression.intercept, digits)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">R²</span>
                      <span className="tabular-nums font-medium">
                        {Number.isFinite(analysis.regression.rSquared)
                          ? fmt(analysis.regression.rSquared, 4)
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">r</span>
                      <span className="tabular-nums font-medium">
                        {Number.isFinite(analysis.regression.r)
                          ? fmt(analysis.regression.r, 4)
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">N</span>
                      <span className="tabular-nums font-medium">
                        {analysis.regression.n} X-values
                      </span>
                    </div>
                    <div className="border-t border-teal-100 pt-1.5 text-[11px] text-slate-500">
                      Replicates: ~{analysis.typicalN} per X · Error bars:{' '}
                      {options.errorBars === 'none' ? 'None' : options.errorBars.toUpperCase()}
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-[12px] text-slate-500">
                    {options.regression === 'none'
                      ? 'Regression display is off.'
                      : 'Need ≥2 distinct X values with means to fit a line.'}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <p className="text-[12px] font-semibold text-slate-800">Export</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className={btn} onClick={() => void runExport('png')}>
                    PNG
                  </button>
                  <button type="button" className={btn} onClick={() => void runExport('svg')}>
                    SVG
                  </button>
                  <button type="button" className={btn} onClick={() => void runExport('pdf-chart')}>
                    Chart PDF
                  </button>
                  <button type="button" className={btn} onClick={() => void runExport('csv')}>
                    CSV
                  </button>
                  <button type="button" className={btn} onClick={() => void runExport('xlsx')}>
                    Excel
                  </button>
                  <button type="button" className={btnPrimary} onClick={() => void runExport('report')}>
                    Full report
                  </button>
                </div>
                {exportMsg ? (
                  <p className="text-[11px] text-slate-500">{exportMsg}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* QC */}
        {analysis.warnings.length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-3">
            <p className="text-[12px] font-semibold text-amber-950">Quality-control notes</p>
            <ul className="mt-1.5 space-y-1">
              {analysis.warnings.map((w, i) => (
                <li key={`${w.code}-${i}`} className="text-[12px] text-amber-950/90">
                  <span
                    className={`mr-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-semibold uppercase ${
                      w.severity === 'warn'
                        ? 'bg-amber-200/80 text-amber-950'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {w.severity === 'warn' ? 'Warn' : 'Note'}
                  </span>
                  {w.message}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default XyRegressionModule;
