import React, { useState } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
  TagListField,
  SegmentedChoice,
} from './notebook/NotebookFormPrimitives';

export type ProtocolFormValues = {
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_duration: number;
  objective: string;
  background: string;
  materials: string[];
  equipment: string[];
  safety_notes: string;
  procedure: string;
  expected_results: string;
  troubleshooting: string;
  references: string[];
  tags: string[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  version: string;
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
  materials: [],
  equipment: [],
  safety_notes: '',
  procedure: '',
  expected_results: '',
  troubleshooting: '',
  references: [],
  tags: [],
  privacy_level: 'lab',
  version: '1.0',
};

/** Compose a durable SOP body for DB `content` column */
export function composeProtocolContent(form: ProtocolFormValues): string {
  const sections: string[] = [];

  if (form.objective.trim()) {
    sections.push(`## 1. Objective\n${form.objective.trim()}`);
  }
  if (form.background.trim()) {
    sections.push(`## 2. Background\n${form.background.trim()}`);
  }
  if (form.materials.length) {
    sections.push(
      `## 3. Materials / Reagents\n${form.materials.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    );
  }
  if (form.equipment.length) {
    sections.push(
      `## 4. Equipment\n${form.equipment.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    );
  }
  if (form.safety_notes.trim()) {
    sections.push(`## 5. Safety\n${form.safety_notes.trim()}`);
  }
  if (form.procedure.trim()) {
    sections.push(`## 6. Procedure\n${form.procedure.trim()}`);
  }
  if (form.expected_results.trim()) {
    sections.push(`## 7. Expected results\n${form.expected_results.trim()}`);
  }
  if (form.troubleshooting.trim()) {
    sections.push(`## 8. Troubleshooting\n${form.troubleshooting.trim()}`);
  }
  if (form.references.length) {
    sections.push(
      `## 9. References\n${form.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    );
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
      subtitle="Structured SOP - objective, materials, safety, and stepwise procedure"
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...form,
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
        <SegmentedChoice
          label="Difficulty"
          value={form.difficulty_level}
          onChange={(v) => set('difficulty_level', v)}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'expert', label: 'Expert' },
          ]}
        />
      </FormSection>

      <FormSection
        title="Scientific framing"
        description="Why this method exists and what success looks like"
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
            rows={3}
            placeholder="Rationale, prior art, and assumptions…"
          />
        </Field>
      </FormSection>

      <FormSection title="Materials & equipment">
        <TagListField
          label="Reagents / materials"
          values={form.materials}
          onChange={(v) => set('materials', v)}
          placeholder="e.g. Taq polymerase, 10 µM primers"
          hint="Include concentration or catalog notes when relevant"
        />
        <TagListField
          label="Equipment"
          values={form.equipment}
          onChange={(v) => set('equipment', v)}
          placeholder="e.g. Thermal cycler, ice bucket"
        />
      </FormSection>

      <FormSection
        title="Safety"
        description="Hazards, PPE, and containment before anyone runs this"
      >
        <Field label="Safety notes">
          <TextArea
            value={form.safety_notes}
            onChange={(e) => set('safety_notes', e.target.value)}
            rows={3}
            placeholder="Chemical/biological hazards, PPE, waste disposal, BSL…"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Procedure"
        description="Numbered steps a trained operator can follow without ambiguity"
      >
        <Field label="Stepwise method" required>
          <TextArea
            value={form.procedure}
            onChange={(e) => set('procedure', e.target.value)}
            rows={10}
            placeholder={`1. Thaw reagents on ice; vortex briefly.\n2. Prepare master mix for N+2 reactions.\n3. …\n\nInclude timing, temperature, and critical checks.`}
            required
          />
        </Field>
        <Field label="Expected results">
          <TextArea
            value={form.expected_results}
            onChange={(e) => set('expected_results', e.target.value)}
            rows={3}
            placeholder="What a successful run looks like (bands, Ct range, yield…)…"
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
