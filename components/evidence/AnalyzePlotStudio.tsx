import React, { useMemo, useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PlotRenderer from './PlotRenderer';
import XyRegressionModule from './XyRegressionModule';
import { CalculatorIcon, PresentationChartLineIcon, XMarkIcon } from '../icons';
import {
  AnalysisBlock,
  AnalysisMethod,
  EvidenceBlock,
  PlotBlock,
  PlotKind,
  SheetBlock,
  TableBlock,
  newBlockId,
} from '../../utils/evidenceBlocks';
import {
  AnalysisPayload,
  columnPlotData,
  describeGroups,
  extractGroupedValues,
  extractXY,
  fmt,
  fmtP,
  linearRegression,
  oneWayAnova,
  pearson,
  welchTTest,
} from '../../utils/researchStats';
import { ANALYSIS_TYPE, matrixToDataset } from '../../utils/xyRegression';

type DataSource = SheetBlock | TableBlock;

type Props = {
  blocks: EvidenceBlock[];
  /** Prefill from a specific sheet/table */
  sourceBlockId?: string;
  onSave: (artifacts: EvidenceBlock[]) => void;
  onCancel: () => void;
};

const METHODS: { value: AnalysisMethod; label: string; needs: 'group_value' | 'xy' | 'xy_replicates' }[] = [
  { value: 'descriptive', label: 'Descriptive (by group)', needs: 'group_value' },
  { value: 'ttest', label: 'Unpaired t-test (Welch)', needs: 'group_value' },
  { value: 'anova', label: 'One-way ANOVA', needs: 'group_value' },
  { value: 'correlation', label: 'Pearson correlation', needs: 'xy' },
  { value: 'regression', label: 'Linear regression (paired XY)', needs: 'xy' },
  {
    value: 'xy_standard_curve',
    label: ANALYSIS_TYPE.name,
    needs: 'xy_replicates',
  },
];

const PLOTS: { value: PlotKind; label: string; for: AnalysisMethod[] }[] = [
  { value: 'column_sem', label: 'Column (mean ± SEM)', for: ['descriptive', 'ttest', 'anova'] },
  { value: 'scatter', label: 'XY scatter', for: ['correlation', 'regression'] },
  { value: 'xy_line', label: 'XY connected', for: ['correlation', 'regression'] },
  {
    value: 'xy_mean_error',
    label: 'XY mean ± error (standard curve)',
    for: ['xy_standard_curve'],
  },
];

function sourceMatrix(block: DataSource): { headers: string[]; rows: string[][] } {
  if (block.type === 'sheet') {
    return {
      headers: block.headers || [],
      rows: block.rows?.length ? block.rows : block.previewRows || [],
    };
  }
  return { headers: block.headers || [], rows: block.rows || [] };
}

function summarizePayload(payload: AnalysisPayload): string {
  switch (payload.kind) {
    case 'descriptive':
      return payload.groups
        .map((g) => `${g.group}: n=${g.n}, mean=${fmt(g.mean)} ± ${fmt(g.sem)} SEM`)
        .join(' · ');
    case 'ttest': {
      const r = payload.result;
      return `${r.groupA} vs ${r.groupB}: t=${fmt(r.t)}, df=${fmt(r.df, 2)}, p=${fmtP(r.pValue)}${r.significant ? ' *' : ''}`;
    }
    case 'anova': {
      const r = payload.result;
      return `ANOVA F(${r.dfBetween},${r.dfWithin})=${fmt(r.F)}, p=${fmtP(r.pValue)}${r.significant ? ' *' : ''}`;
    }
    case 'correlation': {
      const r = payload.result;
      return `Pearson r=${fmt(r.r)}, R²=${fmt(r.rSquared)}, p=${fmtP(r.pValue)}, n=${r.n}`;
    }
    case 'regression': {
      const r = payload.result;
      return `${r.equation}; R²=${fmt(r.rSquared)}, n=${r.n}`;
    }
  }
}

/**
 * Prism-style analyze → plot studio bound to pack datasheets/tables.
 */
const AnalyzePlotStudio: React.FC<Props> = ({ blocks, sourceBlockId, onSave, onCancel }) => {
  const sources = useMemo(
    () => blocks.filter((b): b is DataSource => b.type === 'sheet' || b.type === 'table'),
    [blocks]
  );

  const [sourceId, setSourceId] = useState(
    sourceBlockId && sources.some((s) => s.id === sourceBlockId)
      ? sourceBlockId
      : sources[0]?.id || ''
  );
  const [method, setMethod] = useState<AnalysisMethod>('descriptive');
  const [plotKind, setPlotKind] = useState<PlotKind>('column_sem');
  const [groupCol, setGroupCol] = useState('');
  const [valueCol, setValueCol] = useState('');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [groupA, setGroupA] = useState('');
  const [groupB, setGroupB] = useState('');
  const [title, setTitle] = useState('Analysis');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [previewPlot, setPreviewPlot] = useState<PlotBlock | null>(null);

  const source = sources.find((s) => s.id === sourceId) || null;
  const matrix = source ? sourceMatrix(source) : { headers: [], rows: [] };
  const colOptions = matrix.headers.filter((h) => h.trim()).map((h) => ({ value: h, label: h }));

  const methodMeta = METHODS.find((m) => m.value === method)!;
  const plotOptions = PLOTS.filter((p) => p.for.includes(method));

  const run = () => {
    setError('');
    setPayload(null);
    setPreviewPlot(null);
    if (!source) {
      setError('Add a datasheet or table to this pack first.');
      return;
    }
    if (method === 'xy_standard_curve') {
      setError('Use the XY Regression / Standard Curve panel below — it calculates live as you edit.');
      return;
    }
    const { headers, rows } = matrix;

    try {
      let next: AnalysisPayload;
      if (methodMeta.needs === 'group_value') {
        if (!groupCol || !valueCol) {
          setError('Choose a grouping column and a numeric value column.');
          return;
        }
        const grouped = extractGroupedValues(headers, rows, groupCol, valueCol);
        if (grouped.size === 0) {
          setError('No numeric values found for that column mapping.');
          return;
        }
        const groups = describeGroups(grouped);
        if (method === 'descriptive') {
          next = { kind: 'descriptive', groups };
        } else if (method === 'anova') {
          if (grouped.size < 2) {
            setError('ANOVA needs at least two groups.');
            return;
          }
          next = { kind: 'anova', result: oneWayAnova(grouped) };
        } else {
          const keys = Array.from(grouped.keys()).sort();
          const aKey = groupA && grouped.has(groupA) ? groupA : keys[0];
          const bKey = groupB && grouped.has(groupB) ? groupB : keys[1];
          if (!aKey || !bKey || aKey === bKey) {
            setError('t-test needs two different groups.');
            return;
          }
          next = {
            kind: 'ttest',
            descriptive: groups,
            result: welchTTest(grouped.get(aKey) || [], grouped.get(bKey) || [], aKey, bKey),
          };
        }
      } else {
        if (!xCol || !yCol) {
          setError('Choose X and Y numeric columns.');
          return;
        }
        const points = extractXY(headers, rows, xCol, yCol);
        if (points.length < 3) {
          setError('Need at least 3 paired numeric points.');
          return;
        }
        if (method === 'correlation') {
          next = { kind: 'correlation', result: pearson(points), points };
        } else {
          next = { kind: 'regression', result: linearRegression(points), points };
        }
      }

      setPayload(next);
      setTitle(
        method === 'descriptive'
          ? `Descriptive — ${source.title}`
          : method === 'ttest'
            ? `t-test — ${source.title}`
            : method === 'anova'
              ? `ANOVA — ${source.title}`
              : method === 'correlation'
                ? `Correlation — ${source.title}`
                : `Regression — ${source.title}`
      );

      const kind = plotOptions.some((p) => p.value === plotKind)
        ? plotKind
        : plotOptions[0]?.value || 'column_sem';
      setPlotKind(kind);

      const plot = buildPlot(source, next, kind, {
        group: groupCol,
        value: valueCol,
        x: xCol,
        y: yCol,
        groupA,
        groupB,
      }, caption);
      setPreviewPlot(plot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  };

  const saveToPack = () => {
    if (!source || !payload || !previewPlot) {
      setError('Run the analysis first.');
      return;
    }
    const analysisId = newBlockId();
    const analysis: AnalysisBlock = {
      id: analysisId,
      type: 'analysis',
      title: title.trim() || 'Analysis',
      sourceBlockId: source.id,
      sourceTitle: source.title,
      method,
      columnMap: {
        group: groupCol || undefined,
        value: valueCol || undefined,
        x: xCol || undefined,
        y: yCol || undefined,
        groupA: groupA || undefined,
        groupB: groupB || undefined,
      },
      result: payload,
      summary: summarizePayload(payload),
      notes: '',
    };
    const plot: PlotBlock = {
      ...previewPlot,
      id: newBlockId(),
      title: `${previewPlot.title}`,
      analysisBlockId: analysisId,
      caption: caption.trim() || previewPlot.caption,
    };
    onSave([analysis, plot]);
  };

  const groupNames =
    source && groupCol
      ? Array.from(extractGroupedValues(matrix.headers, matrix.rows, groupCol, valueCol || groupCol).keys()).sort()
      : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-900/50">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">
              Analyze &amp; plot
            </p>
            <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">
              From datasheet → stats → figure
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Like Prism: map columns, run a test, keep the graph linked to the data in this pack.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {method === 'xy_standard_curve' ? (
            <div className="space-y-3">
              <div className="max-w-md">
                <label className="text-[12px] font-medium text-slate-600">Analysis</label>
                <Select
                  value={method}
                  onChange={(e) => {
                    const m = e.target.value as AnalysisMethod;
                    setMethod(m);
                    const first = PLOTS.find((p) => p.for.includes(m));
                    if (first) setPlotKind(first.value);
                    setPayload(null);
                    setPreviewPlot(null);
                  }}
                  options={METHODS.map((m) => ({ value: m.value, label: m.label }))}
                  className="mt-1"
                />
              </div>
              <p className="text-[12px] text-slate-500">
                {ANALYSIS_TYPE.description}
              </p>
              {sources.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] text-amber-900">
                  This pack has no datasheet or table yet. Add one, or enter data directly in the module.
                </div>
              ) : null}
              <div>
                <label className="text-[12px] font-medium text-slate-600">Prefill from data source</label>
                <Select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  options={[
                    { value: '', label: 'Blank / example entry' },
                    ...sources.map((s) => ({
                      value: s.id,
                      label: `${s.title} (${s.type})`,
                    })),
                  ]}
                  className="mt-1 max-w-md"
                />
              </div>
              <XyRegressionModule
                key={sourceId || 'blank'}
                initial={
                  source
                    ? matrixToDataset(matrix.headers, matrix.rows, {
                        name: source.title,
                        xLabel: matrix.headers[0] || 'Concentration',
                      }) || undefined
                    : undefined
                }
                seedExample={!source}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-2 text-[13px] font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            {sources.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] text-amber-900">
                This pack has no datasheet or table yet. Add one, enter values, then come back here.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[12px] font-medium text-slate-600">Data source</label>
                  <Select
                    value={sourceId}
                    onChange={(e) => {
                      setSourceId(e.target.value);
                      setPayload(null);
                      setPreviewPlot(null);
                    }}
                    options={sources.map((s) => ({
                      value: s.id,
                      label: `${s.title} (${s.type})`,
                    }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-slate-600">Analysis</label>
                  <Select
                    value={method}
                    onChange={(e) => {
                      const m = e.target.value as AnalysisMethod;
                      setMethod(m);
                      const first = PLOTS.find((p) => p.for.includes(m));
                      if (first) setPlotKind(first.value);
                      setPayload(null);
                      setPreviewPlot(null);
                    }}
                    options={METHODS.map((m) => ({ value: m.value, label: m.label }))}
                    className="mt-1"
                  />
                </div>

                {methodMeta.needs === 'group_value' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-slate-600">Group / factor</label>
                      <Select
                        value={groupCol}
                        onChange={(e) => setGroupCol(e.target.value)}
                        options={[{ value: '', label: 'Select column…' }, ...colOptions]}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-slate-600">Value (numeric)</label>
                      <Select
                        value={valueCol}
                        onChange={(e) => setValueCol(e.target.value)}
                        options={[{ value: '', label: 'Select column…' }, ...colOptions]}
                        className="mt-1"
                      />
                    </div>
                    {method === 'ttest' && groupNames.length >= 2 && (
                      <>
                        <div>
                          <label className="text-[12px] font-medium text-slate-600">Group A</label>
                          <Select
                            value={groupA || groupNames[0]}
                            onChange={(e) => setGroupA(e.target.value)}
                            options={groupNames.map((g) => ({ value: g, label: g }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-slate-600">Group B</label>
                          <Select
                            value={groupB || groupNames[1]}
                            onChange={(e) => setGroupB(e.target.value)}
                            options={groupNames.map((g) => ({ value: g, label: g }))}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-slate-600">X column</label>
                      <Select
                        value={xCol}
                        onChange={(e) => setXCol(e.target.value)}
                        options={[{ value: '', label: 'Select column…' }, ...colOptions]}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-slate-600">Y column</label>
                      <Select
                        value={yCol}
                        onChange={(e) => setYCol(e.target.value)}
                        options={[{ value: '', label: 'Select column…' }, ...colOptions]}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[12px] font-medium text-slate-600">Graph type</label>
                  <Select
                    value={plotKind}
                    onChange={(e) => setPlotKind(e.target.value as PlotKind)}
                    options={plotOptions.map((p) => ({ value: p.value, label: p.label }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-slate-600">Figure caption</label>
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Figure 1. Viability by treatment (mean ± SEM)"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={run}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-800 text-white text-[13px] font-semibold hover:bg-teal-900"
                >
                  <CalculatorIcon className="w-4 h-4" />
                  Run analysis
                </button>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 min-h-[120px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                <CalculatorIcon className="w-3.5 h-3.5" />
                Results
              </p>
              {!payload ? (
                <p className="text-[13px] text-slate-500">Map columns and run to see stats here.</p>
              ) : (
                <ResultPanel payload={payload} />
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                <PresentationChartLineIcon className="w-3.5 h-3.5" />
                Graph preview
              </p>
              {previewPlot ? (
                <PlotRenderer plot={previewPlot} height={260} />
              ) : (
                <p className="text-[13px] text-slate-500 py-8 text-center">Graph appears after analysis.</p>
              )}
              {previewPlot?.caption && (
                <p className="text-[12px] text-slate-600 mt-2 italic">{previewPlot.caption}</p>
              )}
            </div>
          </div>
        </div>
          )}
        </div>

        {method !== 'xy_standard_curve' ? (
        <div className="shrink-0 px-5 py-3 border-t border-slate-100 flex justify-end gap-2 bg-white">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveToPack}
            disabled={!payload || !previewPlot}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-700 text-white text-[13px] font-semibold hover:bg-sky-800 disabled:opacity-40"
          >
            <PresentationChartLineIcon className="w-4 h-4" />
            Save analysis + graph to pack
          </button>
        </div>
        ) : null}
      </div>
    </div>
  );
};

function buildPlot(
  source: DataSource,
  payload: AnalysisPayload,
  kind: PlotKind,
  columnMap: AnalysisBlock['columnMap'],
  caption: string
): PlotBlock {
  const base = {
    id: 'preview',
    type: 'plot' as const,
    sourceBlockId: source.id,
    sourceTitle: source.title,
    columnMap,
    caption: caption || `From ${source.title}`,
    notes: '',
  };

  if (payload.kind === 'descriptive' || payload.kind === 'ttest' || payload.kind === 'anova') {
    const groups =
      payload.kind === 'descriptive'
        ? payload.groups
        : payload.kind === 'ttest'
          ? payload.descriptive
          : payload.result.groups;
    return {
      ...base,
      title: `Graph — ${source.title}`,
      plotKind: 'column_sem',
      series: columnPlotData(groups),
      yLabel: columnMap.value || 'Value',
      xLabel: columnMap.group || 'Group',
    };
  }

  if (payload.kind === 'correlation' || payload.kind === 'regression') {
    const points = payload.points;
    const fit =
      payload.kind === 'regression'
        ? {
            slope: payload.result.slope,
            intercept: payload.result.intercept,
            equation: payload.result.equation,
          }
        : undefined;
    return {
      ...base,
      title: `Scatter — ${source.title}`,
      plotKind: kind === 'xy_line' ? 'xy_line' : 'scatter',
      series: points.map((p, i) => ({ label: String(i + 1), x: p.x, y: p.y })),
      fit,
      xLabel: columnMap.x,
      yLabel: columnMap.y,
    };
  }

  // Exhaustiveness fallback
  return {
    ...base,
    title: `Graph — ${source.title}`,
    plotKind: 'column_sem',
    series: [],
  };
}

function ResultPanel({ payload }: { payload: AnalysisPayload }) {
  if (payload.kind === 'descriptive') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-[12px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-1.5 pr-3 font-medium">Group</th>
              <th className="py-1.5 pr-3 font-medium">n</th>
              <th className="py-1.5 pr-3 font-medium">Mean</th>
              <th className="py-1.5 pr-3 font-medium">SD</th>
              <th className="py-1.5 pr-3 font-medium">SEM</th>
            </tr>
          </thead>
          <tbody>
            {payload.groups.map((g) => (
              <tr key={g.group} className="border-b border-slate-100 text-slate-800">
                <td className="py-1.5 pr-3 font-medium">{g.group}</td>
                <td className="py-1.5 pr-3">{g.n}</td>
                <td className="py-1.5 pr-3">{fmt(g.mean)}</td>
                <td className="py-1.5 pr-3">{fmt(g.sd)}</td>
                <td className="py-1.5 pr-3">{fmt(g.sem)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (payload.kind === 'ttest') {
    const r = payload.result;
    return (
      <ul className="text-[13px] text-slate-800 space-y-1">
        <li>
          <span className="text-slate-500">Comparison:</span> {r.groupA} (n={r.nA}) vs {r.groupB} (n={r.nB})
        </li>
        <li>
          <span className="text-slate-500">Means:</span> {fmt(r.meanA)} vs {fmt(r.meanB)} (Δ {fmt(r.meanDiff)})
        </li>
        <li>
          <span className="text-slate-500">Welch t:</span> {fmt(r.t)} · df {fmt(r.df, 2)} · p {fmtP(r.pValue)}
          {r.significant ? ' · significant (α=0.05)' : ''}
        </li>
      </ul>
    );
  }
  if (payload.kind === 'anova') {
    const r = payload.result;
    return (
      <div className="space-y-2">
        <p className="text-[13px] text-slate-800">
          F({r.dfBetween}, {r.dfWithin}) = {fmt(r.F)} · p = {fmtP(r.pValue)}
          {r.significant ? ' · significant (α=0.05)' : ''}
        </p>
        <ResultPanel payload={{ kind: 'descriptive', groups: r.groups }} />
      </div>
    );
  }
  if (payload.kind === 'correlation') {
    const r = payload.result;
    return (
      <ul className="text-[13px] text-slate-800 space-y-1">
        <li>n = {r.n}</li>
        <li>r = {fmt(r.r)} · R² = {fmt(r.rSquared)}</li>
        <li>p = {fmtP(r.pValue)}{r.significant ? ' · significant (α=0.05)' : ''}</li>
      </ul>
    );
  }
  const r = payload.result;
  return (
    <ul className="text-[13px] text-slate-800 space-y-1">
      <li>{r.equation}</li>
      <li>R² = {fmt(r.rSquared)} · residual SE = {fmt(r.residualSe)} · n = {r.n}</li>
    </ul>
  );
}

export default AnalyzePlotStudio;
