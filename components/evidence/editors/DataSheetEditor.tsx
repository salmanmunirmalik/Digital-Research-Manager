import React, { useMemo, useRef, useState } from 'react';
import Input from '../../ui/Input';
import { Field, TextArea } from '../../notebook/NotebookFormPrimitives';
import { DocumentArrowUpIcon } from '../../icons';
import SpreadsheetGrid from '../SpreadsheetGrid';
import ReplicateAverageBar from '../ReplicateAverageBar';
import XyRegressionModule from '../XyRegressionModule';
import type { DataSheetArtifact, SheetColumnMeta } from '../../../utils/evidencePack';
import {
  downloadMatrixAsCsv,
  downloadMatrixAsXlsx,
  importSpreadsheetFile,
} from '../../../utils/spreadsheet';
import { resolveMatrixFormulas } from '../../../utils/sheetFormulas';
import {
  datasetToMatrix,
  defaultDataset,
  matrixToDataset,
  type XyRegressionDataset,
} from '../../../utils/xyRegression';

type Props = {
  artifact: DataSheetArtifact;
  onChange: (next: DataSheetArtifact) => void;
};

type EditorMode = 'sheet' | 'xy_regression';

/**
 * Datasheet — raw experimental matrix with assay context.
 * Includes XY Regression / Standard Curve for replicate → mean → fit workflows.
 */
const DataSheetEditor: React.FC<Props> = ({ artifact, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [mode, setMode] = useState<EditorMode>('sheet');

  const syncMetaFromHeaders = (headers: string[], prev: SheetColumnMeta[]): SheetColumnMeta[] =>
    headers.map((h, i) => ({
      header: h,
      type: prev[i]?.type || 'text',
      unit: prev[i]?.unit,
      required: prev[i]?.required,
    }));

  const xyFromSheet = useMemo(() => {
    const resolved = resolveMatrixFormulas(artifact.headers, artifact.rows);
    return matrixToDataset(resolved.headers, resolved.rows, {
      name: artifact.name || 'XY Regression / Standard Curve',
      xLabel: artifact.headers[0] || 'Concentration',
    });
  }, [artifact.headers, artifact.rows, artifact.name]);

  const [xyLocal, setXyLocal] = useState<XyRegressionDataset | null>(null);
  const xyDataset = xyLocal || xyFromSheet || defaultDataset(3, 5);

  const applyXyDataset = (next: XyRegressionDataset) => {
    setXyLocal(next);
    const { headers, rows } = datasetToMatrix(next);
    onChange({
      ...artifact,
      name: next.name || artifact.name,
      headers,
      rows,
      columnMeta: syncMetaFromHeaders(headers, artifact.columnMeta),
    });
  };

  const onImport = async (file: File | null) => {
    if (!file) return;
    try {
      setImportError('');
      const imported = await importSpreadsheetFile(file);
      setXyLocal(null);
      onChange({
        ...artifact,
        fileName: imported.fileName,
        headers: imported.headers,
        rows: imported.rows,
        columnMeta: syncMetaFromHeaders(imported.headers, artifact.columnMeta),
        name:
          artifact.name === 'Datasheet'
            ? imported.fileName.replace(/\.[^.]+$/, '')
            : artifact.name,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Treat this like the Excel file you archive with the experiment: raw values, clear headers,
        and enough context that someone else can reanalyze it.
      </p>

      {importError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          {importError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Assay / experiment">
          <Input
            value={artifact.assay || ''}
            onChange={(e) => onChange({ ...artifact, assay: e.target.value })}
            placeholder="e.g. MTT viability, 48 h"
          />
        </Field>
        <Field label="Collected on">
          <Input
            type="date"
            value={artifact.collectedOn || ''}
            onChange={(e) => onChange({ ...artifact, collectedOn: e.target.value })}
          />
        </Field>
        <Field label="Operator">
          <Input
            value={artifact.operator || ''}
            onChange={(e) => onChange({ ...artifact, operator: e.target.value })}
            placeholder="Who ran it"
          />
        </Field>
        <Field label="Instrument / platform">
          <Input
            value={artifact.instrument || ''}
            onChange={(e) => onChange({ ...artifact, instrument: e.target.value })}
            placeholder="e.g. SpectraMax, QuantStudio"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-100 hover:bg-sky-100"
        >
          <DocumentArrowUpIcon className="w-3.5 h-3.5" />
          Import Excel / CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm"
          className="hidden"
          onChange={(e) => {
            void onImport(e.target.files?.[0] || null);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => {
            const resolved = resolveMatrixFormulas(artifact.headers, artifact.rows);
            downloadMatrixAsCsv(
              artifact.fileName || artifact.name || 'datasheet',
              resolved.headers,
              resolved.rows
            );
          }}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={() => {
            const resolved = resolveMatrixFormulas(artifact.headers, artifact.rows);
            downloadMatrixAsXlsx(
              artifact.fileName || artifact.name || 'datasheet',
              resolved.headers,
              resolved.rows
            );
          }}
          className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Download Excel
        </button>
        <Input
          value={artifact.fileName}
          onChange={(e) => onChange({ ...artifact, fileName: e.target.value })}
          placeholder="Filename (e.g. viability_run12.xlsx)"
          className="flex-1 min-w-[160px] h-9"
        />
      </div>

      <div
        className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        aria-label="Datasheet mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sheet'}
          onClick={() => setMode('sheet')}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
            mode === 'sheet'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          General sheet
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'xy_regression'}
          onClick={() => {
            setMode('xy_regression');
            if (!xyLocal && !xyFromSheet) {
              applyXyDataset(defaultDataset(3, 5));
            }
          }}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
            mode === 'xy_regression'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          XY Regression / Standard Curve
        </button>
      </div>

      {mode === 'sheet' ? (
        <>
          <ReplicateAverageBar
            headers={artifact.headers}
            rows={artifact.rows}
            onApply={({ headers, rows }) => {
              setXyLocal(null);
              onChange({
                ...artifact,
                headers,
                rows,
                columnMeta: syncMetaFromHeaders(headers, artifact.columnMeta),
              });
            }}
          />

          <SpreadsheetGrid
            headers={artifact.headers}
            rows={artifact.rows}
            onChange={({ headers, rows }) => {
              setXyLocal(null);
              onChange({
                ...artifact,
                headers,
                rows,
                columnMeta: syncMetaFromHeaders(headers, artifact.columnMeta),
              });
            }}
            minRows={20}
            minCols={8}
          />
        </>
      ) : (
        <XyRegressionModule
          value={xyDataset}
          onChange={applyXyDataset}
          seedExample={!xyFromSheet && !xyLocal}
        />
      )}

      <Field label="Notes (QC, exclusions, plate map)">
        <TextArea
          value={artifact.notes}
          onChange={(e) => onChange({ ...artifact, notes: e.target.value })}
          rows={2}
          placeholder="Blank wells, excluded outliers, dilution scheme, file path on shared drive…"
        />
      </Field>
    </div>
  );
};

export default DataSheetEditor;
