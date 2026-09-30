import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  colLetter,
  matrixToTsv,
  normalizeMatrix,
  parseClipboardMatrix,
} from '../../utils/spreadsheet';
import { displayCellValue } from '../../utils/sheetFormulas';

type Props = {
  headers: string[];
  rows: string[][];
  onChange: (next: { headers: string[]; rows: string[][] }) => void;
  /** Minimum visible empty rows */
  minRows?: number;
  minCols?: number;
  className?: string;
};

type CellPos = { r: number; c: number }; // r=-1 means header row

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Excel-style datasheet: click cells, type, Tab/Enter/arrows, paste from Excel.
 */
const SpreadsheetGrid: React.FC<Props> = ({
  headers,
  rows,
  onChange,
  minRows = 15,
  minCols = 6,
  className = '',
}) => {
  const matrix = useMemo(
    () => normalizeMatrix(headers, rows, minCols, minRows),
    [headers, rows, minCols, minRows]
  );

  const [active, setActive] = useState<CellPos>({ r: 0, c: 0 });
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [selEnd, setSelEnd] = useState<CellPos | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const skipBlurCommit = useRef(false);

  const colCount = matrix.headers.length;
  const rowCount = matrix.rows.length;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing, active]);

  const commit = useCallback(
    (value: string, move?: CellPos) => {
      const nextValue = value ?? '';
      if (active.r === -1) {
        const nextHeaders = [...matrix.headers];
        nextHeaders[active.c] = nextValue;
        onChange({ headers: nextHeaders, rows: matrix.rows });
      } else {
        const nextRows = matrix.rows.map((row) => [...row]);
        nextRows[active.r] = [...(nextRows[active.r] || Array(colCount).fill(''))];
        while (nextRows[active.r].length < colCount) nextRows[active.r].push('');
        nextRows[active.r][active.c] = nextValue;
        onChange({ headers: matrix.headers, rows: nextRows });
      }
      setEditing(false);
      setEditValue('');
      if (move) {
        setActive({
          r: clamp(move.r, -1, rowCount - 1),
          c: clamp(move.c, 0, colCount - 1),
        });
        setSelEnd(null);
      }
    },
    [active, matrix, onChange, colCount, rowCount]
  );

  const cellValue = (pos: CellPos) => {
    if (pos.r === -1) return matrix.headers[pos.c] ?? '';
    return matrix.rows[pos.r]?.[pos.c] ?? '';
  };

  const startEdit = (pos: CellPos, initial?: string) => {
    setActive(pos);
    setSelEnd(null);
    setEditValue(initial !== undefined ? initial : cellValue(pos));
    setEditing(true);
  };

  const ensureSize = (needR: number, needC: number) => {
    let nextHeaders = [...matrix.headers];
    let nextRows = matrix.rows.map((r) => [...r]);
    while (nextHeaders.length < needC) nextHeaders.push(`Column ${nextHeaders.length + 1}`);
    nextRows = nextRows.map((r) => {
      const copy = [...r];
      while (copy.length < nextHeaders.length) copy.push('');
      return copy;
    });
    while (nextRows.length < needR) {
      nextRows.push(Array.from({ length: nextHeaders.length }, () => ''));
    }
    return { headers: nextHeaders, rows: nextRows };
  };

  const addRows = (n = 5) => {
    const next = ensureSize(matrix.rows.length + n, colCount);
    onChange(next);
  };

  const addCols = (n = 1) => {
    const next = ensureSize(rowCount, colCount + n);
    onChange(next);
  };

  const deleteRow = (ri: number) => {
    if (rowCount <= 1) return;
    onChange({
      headers: matrix.headers,
      rows: matrix.rows.filter((_, i) => i !== ri),
    });
    setActive((a) => ({ ...a, r: clamp(a.r === ri ? ri - 1 : a.r > ri ? a.r - 1 : a.r, -1, rowCount - 2) }));
  };

  const deleteCol = (ci: number) => {
    if (colCount <= 1) return;
    onChange({
      headers: matrix.headers.filter((_, i) => i !== ci),
      rows: matrix.rows.map((r) => r.filter((_, i) => i !== ci)),
    });
    setActive((a) => ({ ...a, c: clamp(a.c === ci ? ci - 1 : a.c > ci ? a.c - 1 : a.c, 0, colCount - 2) }));
  };

  const selectionBounds = () => {
    const end = selEnd || active;
    return {
      r0: Math.min(active.r, end.r),
      r1: Math.max(active.r, end.r),
      c0: Math.min(active.c, end.c),
      c1: Math.max(active.c, end.c),
    };
  };

  const isSelected = (r: number, c: number) => {
    if (active.r === r && active.c === c) return true;
    if (!selEnd) return false;
    const b = selectionBounds();
    if (b.r0 === -1 && r === -1) return c >= b.c0 && c <= b.c1;
    if (r === -1 || b.r0 === -1) return false;
    return r >= b.r0 && r <= b.r1 && c >= b.c0 && c <= b.c1;
  };

  const copySelection = async () => {
    const b = selectionBounds();
    const lines: string[] = [];
    if (b.r0 === -1) {
      lines.push(
        matrix.headers.slice(b.c0, b.c1 + 1).join('\t')
      );
    }
    for (let r = Math.max(0, b.r0); r <= b.r1; r++) {
      if (r < 0) continue;
      lines.push(
        Array.from({ length: b.c1 - b.c0 + 1 }, (_, i) => matrix.rows[r]?.[b.c0 + i] ?? '').join(
          '\t'
        )
      );
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      /* ignore */
    }
  };

  const pasteAtActive = async (text?: string) => {
    let raw = text;
    if (raw == null) {
      try {
        raw = await navigator.clipboard.readText();
      } catch {
        raw = window.prompt('Paste spreadsheet data (from Excel):') || '';
      }
    }
    if (!raw?.trim()) return;

    const parsed = parseClipboardMatrix(raw);
    // If paste has no meaningful header distinction, treat all as values from active cell
    const pasteRows = [parsed.headers, ...parsed.rows].filter((row) =>
      row.some((c) => String(c).trim() !== '')
    );
    if (!pasteRows.length) return;

    const startR = active.r < 0 ? 0 : active.r;
    const startC = active.c;
    const needR = startR + pasteRows.length;
    const needC = startC + Math.max(...pasteRows.map((r) => r.length));
    const next = ensureSize(needR, needC);
    pasteRows.forEach((prow, ri) => {
      prow.forEach((val, ci) => {
        next.rows[startR + ri][startC + ci] = val;
      });
    });
    onChange(next);
    setEditing(false);
    setSelEnd({
      r: startR + pasteRows.length - 1,
      c: startC + (pasteRows[0]?.length || 1) - 1,
    });
  };

  const replaceAllFromPaste = async () => {
    try {
      const raw = await navigator.clipboard.readText();
      if (!raw?.trim()) return;
      const parsed = parseClipboardMatrix(raw);
      onChange(normalizeMatrix(parsed.headers, parsed.rows, minCols, minRows));
      setActive({ r: 0, c: 0 });
      setSelEnd(null);
    } catch {
      const raw = window.prompt('Paste full sheet from Excel (first row = headers):');
      if (!raw?.trim()) return;
      const parsed = parseClipboardMatrix(raw);
      onChange(normalizeMatrix(parsed.headers, parsed.rows, minCols, minRows));
    }
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;

    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      void copySelection();
      return;
    }
    if (meta && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      void pasteAtActive();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      startEdit(active);
      return;
    }
    if (e.key === 'F2') {
      e.preventDefault();
      startEdit(active);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextC = e.shiftKey ? active.c - 1 : active.c + 1;
      if (nextC < 0) setActive({ r: clamp(active.r - 1, -1, rowCount - 1), c: colCount - 1 });
      else if (nextC >= colCount) setActive({ r: clamp(active.r + 1, -1, rowCount - 1), c: 0 });
      else setActive({ ...active, c: nextC });
      setSelEnd(null);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const b = selectionBounds();
      if (b.r0 === -1) {
        const nextHeaders = [...matrix.headers];
        for (let c = b.c0; c <= b.c1; c++) nextHeaders[c] = '';
        onChange({ headers: nextHeaders, rows: matrix.rows });
      } else {
        const nextRows = matrix.rows.map((row) => [...row]);
        for (let r = Math.max(0, b.r0); r <= b.r1; r++) {
          for (let c = b.c0; c <= b.c1; c++) {
            if (!nextRows[r]) nextRows[r] = Array(colCount).fill('');
            nextRows[r][c] = '';
          }
        }
        onChange({ headers: matrix.headers, rows: nextRows });
      }
      return;
    }

    if (e.key.length === 1 && !meta && !e.altKey) {
      e.preventDefault();
      startEdit(active, e.key);
      return;
    }

    const move = (dr: number, dc: number, extend: boolean) => {
      e.preventDefault();
      const next = {
        r: clamp(active.r + dr, -1, rowCount - 1),
        c: clamp(active.c + dc, 0, colCount - 1),
      };
      if (extend) {
        setSelEnd(next);
      } else {
        setActive(next);
        setSelEnd(null);
      }
    };

    if (e.key === 'ArrowUp') move(-1, 0, e.shiftKey);
    if (e.key === 'ArrowDown') move(1, 0, e.shiftKey);
    if (e.key === 'ArrowLeft') move(0, -1, e.shiftKey);
    if (e.key === 'ArrowRight') move(0, 1, e.shiftKey);
  };

  const formulaLabel =
    active.r === -1 ? `${colLetter(active.c)}1 (header)` : `${colLetter(active.c)}${active.r + 2}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void replaceAllFromPaste()}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-100 hover:bg-sky-100"
        >
          Paste sheet from Excel
        </button>
        <button
          type="button"
          onClick={() => void pasteAtActive()}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Paste at cell
        </button>
        <button
          type="button"
          onClick={() => addRows(10)}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          + 10 rows
        </button>
        <button
          type="button"
          onClick={() => addCols(1)}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          + Column
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              void navigator.clipboard.writeText(matrixToTsv(matrix.headers, matrix.rows));
            } catch {
              /* ignore */
            }
          }}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Copy all
        </button>
        <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
          Formulas: =AVERAGE(B:D) · =SEM(B:D) · =STDEV(B:D) · Enter edit · Tab next
        </span>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
        <span className="text-[11px] font-semibold text-slate-500 w-16 shrink-0 tabular-nums">
          {formulaLabel}
        </span>
        <input
          ref={inputRef}
          value={editing ? (editValue ?? '') : cellValue(active)}
          onChange={(e) => {
            if (!editing) startEdit(active, e.target.value);
            else setEditValue(e.target.value);
          }}
          onFocus={() => {
            if (!editing) startEdit(active);
          }}
          onKeyDown={(e) => {
            const val = (e.target as HTMLInputElement).value ?? '';
            if (e.key === 'Enter') {
              e.preventDefault();
              skipBlurCommit.current = true;
              commit(val, { r: active.r + 1, c: active.c });
            } else if (e.key === 'Tab') {
              e.preventDefault();
              skipBlurCommit.current = true;
              commit(val, {
                r: active.r,
                c: e.shiftKey ? active.c - 1 : active.c + 1,
              });
            } else if (e.key === 'Escape') {
              e.preventDefault();
              skipBlurCommit.current = true;
              setEditing(false);
              setEditValue('');
              gridRef.current?.focus();
            }
          }}
          onBlur={(e) => {
            if (skipBlurCommit.current) {
              skipBlurCommit.current = false;
              return;
            }
            if (editing) commit(e.currentTarget.value ?? '');
          }}
          className="flex-1 min-w-0 text-[13px] bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-400"
          placeholder="Cell value"
        />
      </div>

      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onGridKeyDown}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (text) {
            e.preventDefault();
            void pasteAtActive(text);
          }
        }}
        className="overflow-auto rounded-xl border border-slate-300 bg-white max-h-[min(55vh,520px)] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      >
        <table className="border-collapse min-w-full text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 border border-slate-200 w-10 min-w-[2.5rem] text-[10px] text-slate-400 font-medium">
                #
              </th>
              {matrix.headers.map((_, ci) => (
                <th
                  key={`letter-${ci}`}
                  className="bg-slate-100 border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 min-w-[100px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{colLetter(ci)}</span>
                    {colCount > 1 && (
                      <button
                        type="button"
                        title="Delete column"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCol(ci);
                        }}
                        className="text-slate-300 hover:text-rose-500 text-[10px] leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-50 border border-slate-200 text-[10px] text-slate-400 font-medium">
                1
              </th>
              {matrix.headers.map((h, ci) => {
                const selected = isSelected(-1, ci);
                const isActive = active.r === -1 && active.c === ci;
                return (
                  <th
                    key={`h-${ci}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      gridRef.current?.focus();
                      if (e.shiftKey) setSelEnd({ r: -1, c: ci });
                      else {
                        setActive({ r: -1, c: ci });
                        setSelEnd(null);
                      }
                    }}
                    onDoubleClick={() => startEdit({ r: -1, c: ci })}
                    className={`border border-slate-200 p-0 font-semibold text-left ${
                      isActive
                        ? 'ring-2 ring-inset ring-sky-500 bg-sky-50'
                        : selected
                          ? 'bg-sky-50/70'
                          : 'bg-amber-50/40'
                    }`}
                  >
                    <div className="px-2 py-1.5 min-h-[32px] text-slate-800 truncate">
                      {h || <span className="text-slate-300 font-normal">Header</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row, ri) => (
              <tr key={ri}>
                <td className="sticky left-0 z-10 bg-slate-50 border border-slate-200 text-center text-[10px] text-slate-400 font-medium">
                  <div className="flex items-center justify-center gap-0.5 px-0.5">
                    <span>{ri + 2}</span>
                    {rowCount > 1 && (
                      <button
                        type="button"
                        title="Delete row"
                        onClick={() => deleteRow(ri)}
                        className="text-slate-300 hover:text-rose-500"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </td>
                {matrix.headers.map((_, ci) => {
                  const selected = isSelected(ri, ci);
                  const isActive = active.r === ri && active.c === ci;
                  const raw = row[ci] ?? '';
                  const { display, formula } = displayCellValue(
                    raw,
                    ri,
                    matrix.headers,
                    matrix.rows
                  );
                  return (
                    <td
                      key={`${ri}-${ci}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        gridRef.current?.focus();
                        if (e.shiftKey) setSelEnd({ r: ri, c: ci });
                        else {
                          setActive({ r: ri, c: ci });
                          setSelEnd(null);
                          setEditing(false);
                        }
                      }}
                      onDoubleClick={() => startEdit({ r: ri, c: ci })}
                      title={formula || undefined}
                      className={`border border-slate-200 p-0 ${
                        isActive
                          ? 'ring-2 ring-inset ring-sky-500 bg-sky-50'
                          : selected
                            ? 'bg-sky-50/60'
                            : formula
                              ? 'bg-teal-50/50'
                              : ri % 2
                                ? 'bg-slate-50/30'
                                : 'bg-white'
                      }`}
                    >
                      <div
                        className={`px-2 py-1.5 min-h-[32px] truncate ${
                          formula ? 'text-teal-900 font-medium tabular-nums' : 'text-slate-800'
                        }`}
                      >
                        {editing && isActive ? '' : display}
                        {formula && !editing && (
                          <span className="sr-only"> formula {formula}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        {rowCount} rows · {colCount} columns · row 1 is headers · teal cells are formulas (hover to
        see =AVERAGE…)
      </p>
    </div>
  );
};

export default SpreadsheetGrid;
