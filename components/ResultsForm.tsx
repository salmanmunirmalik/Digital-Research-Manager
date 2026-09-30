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
import { useEntityOptions } from '../hooks/useEntityOptions';
import EntityLinkSelect from './EntityLinkSelect';

interface ResultsFormProps {
  onSubmit: (results: ResultsData) => void;
  onCancel: () => void;
  initialData?: Partial<ResultsData>;
}

interface ResultsData {
  title: string;
  description: string;
  result_type: 'data' | 'analysis' | 'visualization' | 'summary' | 'raw_data' | 'processed_data';
  experiment_id: string;
  protocol_id: string;
  data_source: 'manual' | 'instrument' | 'software' | 'calculation' | 'simulation';
  methodology: string;
  key_findings: string[];
  statistical_analysis: string;
  confidence_level: 'low' | 'medium' | 'high';
  significance: 'not_significant' | 'marginally_significant' | 'significant' | 'highly_significant';
  limitations: string[];
  next_steps: string[];
  conclusions: string;
  implications: string;
  reproducibility_notes: string;
  data_files: string[];
  figures: string[];
  references: string[];
  collaborators: string[];
  tags: string[];
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  result_date: string;
  caveats: string;
}

const ResultsForm: React.FC<ResultsFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { protocols, experiments } = useEntityOptions(['protocols', 'experiments']);
  const [formData, setFormData] = useState<ResultsData>({
    title: '',
    description: '',
    result_type: 'summary',
    experiment_id: '',
    protocol_id: '',
    data_source: 'manual',
    methodology: '',
    key_findings: [],
    statistical_analysis: '',
    confidence_level: 'medium',
    significance: 'not_significant',
    limitations: [],
    next_steps: [],
    conclusions: '',
    implications: '',
    reproducibility_notes: '',
    data_files: [],
    figures: [],
    references: [],
    collaborators: [],
    tags: [],
    lab_id: '',
    privacy_level: 'lab',
    result_date: new Date().toISOString().slice(0, 10),
    caveats: '',
    ...initialData,
  });

  const set = <K extends keyof ResultsData>(field: K, value: ResultsData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Keep caveats mirrored into limitations for save mapping compatibility
    const caveats = formData.caveats?.trim();
    onSubmit({
      ...formData,
      limitations: caveats
        ? Array.from(new Set([...(formData.limitations || []), caveats]))
        : formData.limitations,
    });
  };

  return (
    <NotebookFormModal
      title="Results note"
      subtitle="Interpret findings here — store raw files in My data & results"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save results note"
      maxWidth="max-w-2xl"
    >
      <FormSection title="Result" description="What was measured and when">
        <Field label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Week 12 Western — densitometry summary"
            required
          />
        </Field>
        <Field label="Date" required>
          <Input
            type="date"
            value={formData.result_date}
            onChange={(e) => set('result_date', e.target.value)}
            required
          />
        </Field>
        <Field label="What you measured / analyzed" required>
          <TextArea
            value={formData.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Assay, samples, and what this result covers…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Linked experiment">
            <EntityLinkSelect
              value={formData.experiment_id}
              options={experiments}
              onChange={(id) => set('experiment_id', id)}
              placeholder="None — choose an experiment"
            />
          </Field>
          <Field label="Linked protocol">
            <EntityLinkSelect
              value={formData.protocol_id}
              options={protocols}
              onChange={(id) => set('protocol_id', id)}
              placeholder="None — choose a protocol"
            />
          </Field>
        </div>
        <Field label="Analysis method" hint="Software, stats test, or quantification approach">
          <Input
            value={formData.methodology}
            onChange={(e) => set('methodology', e.target.value)}
            placeholder="e.g. ImageJ densitometry; unpaired t-test in GraphPad"
          />
        </Field>
      </FormSection>

      <FormSection title="Findings" description="Facts first, then interpretation">
        <TagListField
          label="Key findings"
          values={formData.key_findings}
          onChange={(v) => set('key_findings', v)}
          placeholder="One finding, then Enter"
        />
        <Field label="Statistics" hint="Optional — tests, n, p-values, effect sizes">
          <TextArea
            value={formData.statistical_analysis}
            onChange={(e) => set('statistical_analysis', e.target.value)}
            rows={2}
            placeholder="e.g. n=3; p=0.02 vs control; Cohen’s d=0.8"
          />
        </Field>
        <Field label="Conclusion" required>
          <TextArea
            value={formData.conclusions}
            onChange={(e) => set('conclusions', e.target.value)}
            rows={3}
            placeholder="What you conclude from these results for the project…"
            required
          />
        </Field>
        <Field label="Caveats / limitations">
          <TextArea
            value={formData.caveats}
            onChange={(e) => set('caveats', e.target.value)}
            rows={2}
            placeholder="Sample size, batch effects, controls missing…"
          />
        </Field>
        <TagListField
          label="Next experiments"
          values={formData.next_steps}
          onChange={(v) => set('next_steps', v)}
          placeholder="Follow-up action"
        />
      </FormSection>

      <FormSection title="References & access">
        <TagListField
          label="Data / figure links"
          values={[...formData.data_files, ...formData.figures].filter(Boolean)}
          onChange={(v) => {
            set('data_files', v);
            set('figures', []);
          }}
          placeholder="Filename, path, or URL"
          hint="Prefer linking My data & results assets rather than pasting tables here"
        />
        <TagListField
          label="Tags"
          values={formData.tags}
          onChange={(v) => set('tags', v)}
          placeholder="Keyword"
        />
        <Field label="Visibility">
          <Select
            value={formData.privacy_level}
            onChange={(e) => set('privacy_level', e.target.value as ResultsData['privacy_level'])}
            options={[
              { value: 'personal', label: 'Only me' },
              { value: 'lab', label: 'My lab' },
              { value: 'global', label: 'Public' },
            ]}
          />
        </Field>
      </FormSection>
    </NotebookFormModal>
  );
};

export default ResultsForm;
