import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts';
import type { PlotBlock } from '../../utils/evidenceBlocks';
import { fmt } from '../../utils/researchStats';

type Props = {
  plot: PlotBlock;
  height?: number;
  className?: string;
};

const PlotRenderer: React.FC<Props> = ({ plot, height = 280, className = '' }) => {
  if (!plot.series.length) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-200 py-10 text-center text-[13px] text-slate-500 ${className}`}>
        No plotted data yet
      </div>
    );
  }

  if (plot.plotKind === 'column_sem') {
    const data = plot.series.map((p) => ({
      name: p.label,
      mean: p.mean ?? 0,
      sem: p.sem ?? 0,
      n: p.n ?? 0,
    }));
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
            <YAxis
              tick={{ fontSize: 12, fill: '#475569' }}
              label={
                plot.yLabel
                  ? { value: plot.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }
                  : undefined
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [fmt(value), name === 'mean' ? 'Mean' : name]}
              labelFormatter={(label) => String(label)}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="mean" name="Mean" fill="#0369a1" radius={[4, 4, 0, 0]} maxBarSize={56}>
              <ErrorBar dataKey="sem" width={6} strokeWidth={1.5} stroke="#0f172a" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-slate-500 text-center mt-1">Mean ± SEM</p>
      </div>
    );
  }

  const scatter = plot.series
    .filter((p) => p.x != null && p.y != null)
    .map((p) => ({ x: p.x as number, y: p.y as number }));

  const fitLine =
    plot.fit && scatter.length >= 2
      ? (() => {
          const xs = scatter.map((p) => p.x);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          return [
            { x: minX, y: plot.fit!.intercept + plot.fit!.slope * minX, fit: true },
            { x: maxX, y: plot.fit!.intercept + plot.fit!.slope * maxX, fit: true },
          ];
        })()
      : [];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="x"
            name={plot.xLabel || 'X'}
            tick={{ fontSize: 12, fill: '#475569' }}
            label={
              plot.xLabel
                ? { value: plot.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 11, fill: '#64748b' } }
                : undefined
            }
          />
          <YAxis
            type="number"
            dataKey="y"
            name={plot.yLabel || 'Y'}
            tick={{ fontSize: 12, fill: '#475569' }}
            label={
              plot.yLabel
                ? { value: plot.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }
                : undefined
            }
          />
          <Tooltip
            formatter={(value: number) => fmt(value)}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          {plot.plotKind === 'xy_line' ? (
            <Line
              data={scatter}
              type="monotone"
              dataKey="y"
              stroke="#0369a1"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0369a1' }}
              name="Data"
            />
          ) : (
            <Scatter data={scatter} fill="#0369a1" name="Data" />
          )}
          {fitLine.length > 0 && (
            <Line
              data={fitLine}
              type="linear"
              dataKey="y"
              stroke="#b45309"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="Fit"
              legendType="line"
            />
          )}
          {fitLine.length > 0 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        </ComposedChart>
      </ResponsiveContainer>
      {plot.fit?.equation && (
        <p className="text-[11px] text-slate-500 text-center mt-1">{plot.fit.equation}</p>
      )}
    </div>
  );
};

export default PlotRenderer;
