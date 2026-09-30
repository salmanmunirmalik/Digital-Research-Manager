import React, { useState } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
  TagListField,
} from './notebook/NotebookFormPrimitives';

export type ProtocolFormValues = {
  title: string;
  description: string;
  category: string;
  /** Kept for API compatibility; not shown in the form */
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_duration: number;
  objective: string;
  background: string;
  /** What this method applies to / does not cover */
  scope: string;
  /** Sample / starting material requirements */
  sample_requirements: string;
  /** Run parameters: temp, atmosphere, buffer, instrument settings, culture conditions */
  experimental_conditions: string;
  /** Nature-style reagent / buffer prep before the run */
  reagent_setup: string;
  materials: string[];
  equipment: string[];
  safety_notes: string;
  /** Positive / negative controls and pass/fail criteria */
  controls: string;
  procedure: string;
  expected_results: string;
  troubleshooting: string;
  references: string[];
  tags: string[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  version: string;
  video_url: string;
};

type Props = {
  mode?: 'create' | 'edit';
  initialData?: Partial<ProtocolFormValues>;
  onSubmit: (payload: ProtocolFormValues & { content: string }) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaults: ProtocolFormValues = {
  title: '',
  description: '',
  category: 'molecular_biology',
  difficulty_level: 'intermediate',
  estimated_duration: 60,
  objective: '',
  background: '',
  scope: '',
  sample_requirements: '',
  experimental_conditions: '',
  reagent_setup: '',
  materials: [],
  equipment: [],
  safety_notes: '',
  controls: '',
  procedure: '',
  expected_results: '',
  troubleshooting: '',
  references: [],
  tags: [],
  privacy_level: 'lab',
  version: '1.0',
  video_url: '',
};

/** Compose a durable SOP body for DB `content` column */
export function composeProtocolContent(form: ProtocolFormValues): string {
  const sections: string[] = [];
  let n = 1;
  const push = (title: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    sections.push(`## ${n}. ${title}\n${text}`);
    n += 1;
  };

  push('Objective', form.objective);
  push('Background', form.background);
  push('Scope', form.scope);
  push('Sample requirements', form.sample_requirements);
  push('Experimental conditions', form.experimental_conditions);
  push('Reagent setup', form.reagent_setup);
  if (form.materials.length) {
    push(
      'Materials / Reagents',
      form.materials.map((m, i) => `${i + 1}. ${m}`).join('\n')
    );
  }
  if (form.equipment.length) {
    push('Equipment', form.equipment.map((m, i) => `${i + 1}. ${m}`).join('\n'));
  }
  push('Safety', form.safety_notes);
  push('Controls & acceptance criteria', form.controls);
  push('Procedure', form.procedure);
  push('Expected results', form.expected_results);
  push('Troubleshooting', form.troubleshooting);
  if (form.references.length) {
    push('References', form.references.map((r, i) => `${i + 1}. ${r}`).join('\n'));
  }

  return sections.join('\n\n') || form.description || form.title;
}

const ProtocolForm: React.FC<Props> = ({
  mode = 'create',
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<ProtocolFormValues>({ ...defaults, ...initialData });

  const set = <K extends keyof ProtocolFormValues>(key: K, value: ProtocolFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Revise protocol' : 'Write protocol'}
      subtitle="Lab-ready SOP — conditions, setup, controls, and stepwise method"
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...form,
          difficulty_level: form.difficulty_level || 'intermediate',
          content: composeProtocolContent(form),
        });
      }}
      submitLabel={
        isSubmitting
          ? 'Saving…'
          : mode === 'edit'
            ? 'Save revision'
            : 'Publish to library'
      }
      maxWidth="max-w-3xl"
    >
      <FormSection
        title="Identity"
        description="How this method will appear in the library"
      >
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Quantitative PCR for gene expression - SYBR Green"
            required
          />
        </Field>
        <Field label="Short summary" required>
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            placeholder="One-paragraph overview for search and browsing…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={[
                { value: 'molecular_biology', label: 'Molecular biology' },
                { value: 'cell_biology', label: 'Cell biology' },
                { value: 'protein_analysis', label: 'Protein analysis' },
                { value: 'biochemistry', label: 'Biochemistry' },
                { value: 'microbiology', label: 'Microbiology' },
                { value: 'imaging', label: 'Imaging / microscopy' },
                { value: 'bioinformatics', label: 'Bioinformatics' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Version">
            <Input
              value={form.version}
              onChange={(e) => set('version', e.target.value)}
              placeholder="1.0"
            />
          </Field>
          <Field label="Duration (min)">
            <Input
              type="number"
              min={1}
              value={form.estimated_duration}
              onChange={(e) => set('estimated_duration', Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Scientific framing"
        description="Purpose, applicability, and what success means"
      >
        <Field label="Objective" required>
          <TextArea
            value={form.objective}
            onChange={(e) => set('objective', e.target.value)}
            rows={3}
            placeholder="State the scientific goal and measurable endpoint…"
            required
          />
        </Field>
        <Field label="Background">
          <TextArea
            value={form.background}
            onChange={(e) => set('background', e.target.value)}
            rows={2}
            placeholder="Rationale, prior art, and assumptions…"
          />
        </Field>
        <Field label="Scope">
          <TextArea
            value={form.scope}
            onChange={(e) => set('scope', e.target.value)}
            rows={2}
            placeholder="Applies to… Does not cover… (sample types, instruments, or use-cases)"
          />
        </Field>
        <Field label="Sample / starting material">
          <TextArea
            value={form.sample_requirements}
            onChange={(e) => set('sample_requirements', e.target.value)}
            rows={2}
            placeholder="e.g. 1×10⁶ HEK293 cells, mid-log E. coli culture, 50–100 mg tissue, RNA integrity…"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Experimental conditions"
        description="Define the run environment so others can reproduce the same experiment"
      >
        <Field label="Conditions & parameters" required>
          <TextArea
            value={form.experimental_conditions}
            onChange={(e) => set('experimental_conditions', e.target.value)}
            rows={5}
            placeholder={`Temperature / atmosphere (e.g. 37°C, 5% CO₂)\nIncubation times and light/dark cycles\nBuffer / medium composition and pH\nInstrument settings (speed ×g, wavelength, voltage, software version)\nCulture density, MOI, or loading amounts`}
            required
          />
        </Field>
        <Field label="Reagent & buffer setup">
          <TextArea
            value={form.reagent_setup}
            onChange={(e) => set('reagent_setup', e.target.value)}
            rows={4}
            placeholder="How to prepare master mixes, stocks, and working solutions before step 1 (concentrations, volumes, storage, expiry)…"
          />
        </Field>
      </FormSection>

      <FormSection title="Materials & equipment">
        <TagListField
          label="Reagents / materials"
          values={form.materials}
          onChange={(v) => set('materials', v)}
          placeholder="e.g. Taq polymerase (Cat# …), 10 µM primers"
          hint="Include concentration, grade, or catalog notes when they affect outcome"
        />
        <TagListField
          label="Equipment"
          values={form.equipment}
          onChange={(v) => set('equipment', v)}
          placeholder="e.g. Thermal cycler (model), refrigerated centrifuge"
        />
      </FormSection>

      <FormSection
        title="Safety & quality controls"
        description="Hazards before anyone starts; controls that prove the run worked"
      >
        <Field label="Safety notes">
          <TextArea
            value={form.safety_notes}
            onChange={(e) => set('safety_notes', e.target.value)}
            rows={3}
            placeholder="PPE, chemical/biological hazards, BSL, waste disposal, engineering controls…"
          />
        </Field>
        <Field label="Controls & acceptance criteria">
          <TextArea
            value={form.controls}
            onChange={(e) => set('controls', e.target.value)}
            rows={4}
            placeholder={`Positive control: …\nNegative / no-template control: …\nAcceptance: e.g. Ct 25–30 for +Ctrl; NTC must show no amplification`}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Procedure"
        description="Numbered imperative steps — timing, temperature, and critical checks inline"
      >
        <Field label="Stepwise method" required>
          <TextArea
            value={form.procedure}
            onChange={(e) => set('procedure', e.target.value)}
            rows={10}
            placeholder={`1. Thaw reagents on ice; vortex briefly (CRITICAL: keep RNase-free).\n2. Prepare master mix for N+2 reactions.\n3. Incubate at 37°C for 30 min (PAUSE POINT: can hold at 4°C overnight).\n4. …`}
            required
          />
        </Field>
        <Field label="Expected results">
          <TextArea
            value={form.expected_results}
            onChange={(e) => set('expected_results', e.target.value)}
            rows={3}
            placeholder="What a successful run looks like (bands, Ct range, yield, morphology…)…"
          />
        </Field>
        <Field label="Troubleshooting">
          <TextArea
            value={form.troubleshooting}
            onChange={(e) => set('troubleshooting', e.target.value)}
            rows={3}
            placeholder="Symptom → likely cause → corrective action…"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Method demo (YouTube)"
        description="Optional — a unique walkthrough peers can watch before running the SOP"
      >
        <Field label="YouTube URL">
          <Input
            value={form.video_url}
            onChange={(e) => set('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
          />
        </Field>
        <p className="text-[12px] text-slate-500 -mt-2">
          Paste a watch or short link. It appears as an embedded demo on the protocol page.
        </p>
      </FormSection>

      <FormSection title="Provenance & access">
        <TagListField
          label="References"
          values={form.references}
          onChange={(v) => set('references', v)}
          placeholder="Citation or DOI"
        />
        <TagListField
          label="Tags"
          values={form.tags}
          onChange={(v) => set('tags', v)}
          placeholder="qPCR, SYBR, gene-expression"
        />
        <Field label="Visibility">
          <Select
            value={form.privacy_level}
            onChange={(e) =>
              set('privacy_level', e.target.value as ProtocolFormValues['privacy_level'])
            }
            options={[
              { value: 'personal', label: 'Only me' },
              { value: 'team', label: 'My team' },
              { value: 'lab', label: 'My lab' },
              { value: 'institution', label: 'Institution' },
              { value: 'global', label: 'Public library' },
            ]}
          />
        </Field>
      </FormSection>
    </NotebookFormModal>
  );
};

export default ProtocolForm;
