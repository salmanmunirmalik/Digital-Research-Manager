import React, { useMemo, useState } from 'react';
import {
  applyAverageColumn,
  buildReplicateAverageMatrix,
} from '../../utils/sheetFormulas';

type Props = {
  headers: string[];
  rows: string[][];
  onApply: (next: { headers: string[]; rows: string[][] }) => void;
};

/**
 * Lab helper: set up Reading 1..N + Average (+ SEM), or average existing columns.
 */
const ReplicateAverageBar: React.FC<Props> = ({ headers, rows, onApply }) => {
  const [readingCount, setReadingCount] = useState(3);
  const [includeSem, setIncludeSem] = useState(true);
  const [mode, setMode] = useState<'setup' | 'from-columns'>('setup');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  const numericishHeaders = useMemo(
    () => headers.filter((h) => h.trim() && !/^average|mean|sem|sd|stdev$/i.test(h.trim())),
    [headers]
  );

  const setupReplicates = () => {
    setError('');
    const next = buildReplicateAverageMatrix(
      { headers, rows },
      { readingCount, includeSem, includeSd: false }
    );
    onApply(next);
  };

  const averageSelected = () => {
    setError('');
    try {
      if (selected.length < 2) {
        setError('Pick at least two reading columns');
        return;
      }
      onApply(applyAverageColumn(headers, rows, selected, 'Average'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply average');
    }
  };

  const toggleCol = (h: string) => {
    setSelected((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  };

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-teal-950">Lab replicates → average</p>
          <p className="text-[11px] text-teal-900/80">
            Enter Reading 1, 2, 3… — Average (and SEM) fill automatically with formulas.
          </p>
        </div>
        <div className="flex rounded-lg border border-teal-200 bg-white overflow-hidden text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setMode('setup')}
            className={`px-2.5 py-1.5 ${mode === 'setup' ? 'bg-teal-800 text-white' : 'text-teal-900'}`}
          >
            New layout
          </button>
          <button
            type="button"
            onClick={() => setMode('from-columns')}
            className={`px-2.5 py-1.5 ${mode === 'from-columns' ? 'bg-teal-800 text-white' : 'text-teal-900'}`}
          >
            Average existing cols
          </button>
        </div>
      </div>

      {mode === 'setup' ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] text-teal-950">
            Number of readings
            <select
              value={readingCount}
              onChange={(e) => setReadingCount(Number(e.target.value))}
              className="mt-1 block h-9 rounded-lg border border-teal-200 bg-white px-2 text-[13px]"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 3 ? '(typical)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] text-teal-950 pb-2">
            <input
              type="checkbox"
              checked={includeSem}
              onChange={(e) => setIncludeSem(e.target.checked)}
              className="rounded border-teal-300"
            />
            Also add SEM column
          </label>
          <button
            type="button"
            onClick={setupReplicates}
            className="h-9 px-3 rounded-lg bg-teal-800 text-white text-[12px] font-semibold hover:bg-teal-900"
          >
            Build Sample + Readings + Average
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-teal-900/80">
            Select the columns that hold your replicate readings (e.g. Reading 1–3).
          </p>
          <div className="flex flex-wrap gap-1.5">
            {numericishHeaders.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => toggleCol(h)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border ${
                  selected.includes(h)
                    ? 'bg-teal-800 text-white border-teal-800'
                    : 'bg-white text-teal-900 border-teal-200'
                }`}
              >
                {h}
              </button>
            ))}
            {!numericishHeaders.length && (
              <span className="text-[12px] text-teal-800">No columns yet — add headers first.</span>
            )}
          </div>
          <button
            type="button"
            onClick={averageSelected}
            className="h-9 px-3 rounded-lg bg-teal-800 text-white text-[12px] font-semibold hover:bg-teal-900"
          >
            Fill Average column (=AVERAGE…)
          </button>
        </div>
      )}

      {error && <p className="text-[12px] text-rose-700">{error}</p>}
    </div>
  );
};

export default ReplicateAverageBar;
