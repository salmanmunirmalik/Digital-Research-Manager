import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import { Field } from '../notebook/NotebookFormPrimitives';
import { XMarkIcon } from '../icons';
import TextResultEditor from './editors/TextResultEditor';
import SummaryTableEditor from './editors/SummaryTableEditor';
import DataSheetEditor from './editors/DataSheetEditor';
import FigureEditor from './editors/FigureEditor';
import {
  ARTIFACT_META,
  ArtifactKind,
  PackArtifact,
  createEmptyArtifact,
  touchArtifact,
} from '../../utils/evidencePack';

type Props = {
  artifact: PackArtifact | null;
  createKind?: ArtifactKind;
  packArtifacts: PackArtifact[];
  onSave: (artifact: PackArtifact) => void;
  onCancel: () => void;
};

/** Focused editor host — one artifact at a time, like opening one file. */
const ArtifactEditorHost: React.FC<Props> = ({
  artifact,
  createKind,
  packArtifacts,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<PackArtifact>(() =>
    artifact ? structuredClone(artifact) : createEmptyArtifact(createKind || 'text')
  );

  useEffect(() => {
    setDraft(artifact ? structuredClone(artifact) : createEmptyArtifact(createKind || 'text'));
  }, [artifact, createKind]);

  const meta = ARTIFACT_META[draft.kind];
  const sheetOptions = packArtifacts
    .filter((a) => a.kind === 'sheet')
    .map((a) => ({ id: a.id, name: a.name }));
  const sourceOptions = packArtifacts
    .filter((a) => a.kind === 'sheet' || a.kind === 'table')
    .map((a) => ({ id: a.id, name: `${a.name} (${a.kind})` }));

  const wide = draft.kind === 'sheet' || draft.kind === 'table';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-900/50">
      <div
        className={`bg-white w-full max-h-[92vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden ${
          wide ? 'max-w-6xl' : 'max-w-2xl'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
              {meta.role} · {meta.short}
            </p>
            <h3 className="text-[16px] font-semibold text-slate-900 tracking-tight">
              {artifact ? `Edit ${meta.label.toLowerCase()}` : `Add ${meta.label.toLowerCase()}`}
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">{meta.hint}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Field label="Name in this pack">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={`e.g. ${meta.short.toLowerCase()} — condition A`}
            />
          </Field>

          {draft.kind === 'text' && (
            <TextResultEditor artifact={draft} onChange={setDraft} />
          )}
          {draft.kind === 'table' && (
            <SummaryTableEditor
              artifact={draft}
              onChange={setDraft}
              sheetOptions={sheetOptions}
            />
          )}
          {draft.kind === 'sheet' && (
            <DataSheetEditor artifact={draft} onChange={setDraft} />
          )}
          {draft.kind === 'image' && (
            <FigureEditor
              artifact={draft}
              onChange={setDraft}
              sourceOptions={sourceOptions}
            />
          )}
        </div>

        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-[13px] font-medium text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(touchArtifact(draft))}
            className="px-4 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-lg hover:bg-sky-800"
          >
            {artifact ? 'Update' : 'Add to pack'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactEditorHost;
