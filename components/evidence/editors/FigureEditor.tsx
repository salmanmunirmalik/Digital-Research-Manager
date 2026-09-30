import React, { useRef } from 'react';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Field, TextArea } from '../../notebook/NotebookFormPrimitives';
import { PhotoIcon } from '../../icons';
import type { FigureArtifact, ImageModality } from '../../../utils/evidencePack';

type Props = {
  artifact: FigureArtifact;
  onChange: (next: FigureArtifact) => void;
  sourceOptions?: { id: string; name: string }[];
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Figure editor — caption discipline + modality + optional source data link.
 * An image without a title/legend is almost useless in a results pack.
 */
const FigureEditor: React.FC<Props> = ({ artifact, onChange, sourceOptions = [] }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File | null) => {
    if (!file) return;
    const previewUrl = await readFileAsDataUrl(file);
    onChange({
      ...artifact,
      fileName: file.name,
      mimeType: file.type || 'image/*',
      size: file.size,
      previewUrl,
      name:
        artifact.name === 'Figure' ? file.name.replace(/\.[^.]+$/, '') : artifact.name,
      title: artifact.title || file.name.replace(/\.[^.]+$/, ''),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Capture the figure the way a paper needs it: clear title, legend that explains panels, and a
        link back to the datasheet if this was quantified.
      </p>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full inline-flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-sky-300 bg-sky-50/40 text-sky-900 hover:bg-sky-50"
      >
        {artifact.previewUrl ? (
          <img
            src={artifact.previewUrl}
            alt=""
            className="max-h-48 max-w-full object-contain rounded-lg"
          />
        ) : (
          <PhotoIcon className="w-8 h-8 opacity-60" />
        )}
        <span className="text-[13px] font-medium">
          {artifact.fileName || 'Choose image (gel, blot, micrograph, plot…)'}
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.tif,.tiff,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={(e) => {
          void onPick(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Modality">
          <Select
            value={artifact.modality}
            onChange={(e) =>
              onChange({ ...artifact, modality: e.target.value as ImageModality })
            }
            options={[
              { value: 'gel', label: 'Gel' },
              { value: 'blot', label: 'Blot' },
              { value: 'microscopy', label: 'Microscopy' },
              { value: 'flow', label: 'Flow cytometry' },
              { value: 'plot', label: 'Plot / chart' },
              { value: 'photo', label: 'Photo' },
              { value: 'schematic', label: 'Schematic' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Field>
        <Field label="Scale / calibration">
          <Input
            value={artifact.scaleNote}
            onChange={(e) => onChange({ ...artifact, scaleNote: e.target.value })}
            placeholder="e.g. 50 µm; 1:1000 Ab"
          />
        </Field>
      </div>

      <Field label="Figure title">
        <Input
          value={artifact.title}
          onChange={(e) => onChange({ ...artifact, title: e.target.value })}
          placeholder="Short title (as in Figure 1. …)"
        />
      </Field>

      <Field label="Legend">
        <TextArea
          value={artifact.legend}
          onChange={(e) => onChange({ ...artifact, legend: e.target.value })}
          rows={4}
          placeholder="Panel descriptions, arrows, what the reader should notice…"
        />
      </Field>

      {sourceOptions.length > 0 && (
        <Field label="Quantified / derived from (optional)">
          <Select
            value={artifact.sourceArtifactId || ''}
            onChange={(e) =>
              onChange({ ...artifact, sourceArtifactId: e.target.value || undefined })
            }
            options={[
              { value: '', label: '— not linked —' },
              ...sourceOptions.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </Field>
      )}
    </div>
  );
};

export default FigureEditor;
