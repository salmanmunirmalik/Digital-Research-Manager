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
    ...initialData,
  });

  const set = <K extends keyof ResultsData>(field: K, value: ResultsData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <NotebookFormModal
      title="Results note"
      subtitle="Record findings and analysis in your notebook - store files in My data & results"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save results note"
      maxWidth="max-w-2xl"
    >
      <FormSection title="Overview">
        <Field label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Week 12 Western blot - densitometry"
            required
          />
        </Field>
        <Field label="Summary" required>
          <TextArea
            value={formData.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="What you measured or analyzed, in narrative form…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Note type">
            <Select
              value={formData.result_type}
              onChange={(e) => set('result_type', e.target.value as ResultsData['result_type'])}
              options={[
                { value: 'summary', label: 'Results summary' },
                { value: 'analysis', label: 'Analysis' },
                { value: 'data', label: 'Data notes' },
                { value: 'visualization', label: 'Figure notes' },
                { value: 'processed_data', label: 'Processed data' },
              ]}
            />
          </Field>
          <Field label="Data source">
            <Select
              value={formData.data_source}
              onChange={(e) => set('data_source', e.target.value as ResultsData['data_source'])}
              options={[
                { value: 'manual', label: 'Manual entry' },
                { value: 'instrument', label: 'Instrument' },
                { value: 'software', label: 'Software' },
                { value: 'calculation', label: 'Calculation' },
                { value: 'simulation', label: 'Simulation' },
              ]}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Linked experiment">
            <EntityLinkSelect
              value={formData.experiment_id}
              options={experiments}
              onChange={(id) => set('experiment_id', id)}
              placeholder="None - choose an experiment"
            />
          </Field>
          <Field label="Linked protocol">
            <EntityLinkSelect
              value={formData.protocol_id}
              options={protocols}
              onChange={(id) => set('protocol_id', id)}
              placeholder="None - choose a protocol"
            />
          </Field>
        </div>
        <Field label="Analysis method">
          <Input
            value={formData.methodology}
            onChange={(e) => set('methodology', e.target.value)}
            placeholder="e.g. GraphPad, ImageJ"
          />
        </Field>
      </FormSection>

      <FormSection title="Findings" description="What stood out">
        <TagListField
          label="Key findings"
          values={formData.key_findings}
          onChange={(v) => set('key_findings', v)}
          placeholder="One finding, then Enter"
        />
        <Field label="Statistics">
          <TextArea
            value={formData.statistical_analysis}
            onChange={(e) => set('statistical_analysis', e.target.value)}
            rows={3}
            placeholder="Tests, p-values, effect sizes…"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SegmentedChoice
            label="Confidence"
            value={formData.confidence_level}
            onChange={(v) => set('confidence_level', v)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Field label="Significance">
            <Select
              value={formData.significance}
              onChange={(e) =>
                set('significance', e.target.value as ResultsData['significance'])
              }
              options={[
                { value: 'not_significant', label: 'Not significant' },
                { value: 'marginally_significant', label: 'Marginal' },
                { value: 'significant', label: 'Significant' },
                { value: 'highly_significant', label: 'Highly significant' },
              ]}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Interpretation">
        <Field label="Conclusions">
          <TextArea
            value={formData.conclusions}
            onChange={(e) => set('conclusions', e.target.value)}
            rows={3}
            placeholder="What you conclude from these results…"
          />
        </Field>
        <Field label="Implications">
          <TextArea
            value={formData.implications}
            onChange={(e) => set('implications', e.target.value)}
            rows={2}
            placeholder="Broader meaning for the project…"
          />
        </Field>
        <TagListField
          label="Limitations"
          values={formData.limitations}
          onChange={(v) => set('limitations', v)}
          placeholder="Caveat"
        />
        <TagListField
          label="Next steps"
          values={formData.next_steps}
          onChange={(v) => set('next_steps', v)}
          placeholder="Follow-up action"
        />
        <Field label="Reproducibility notes">
          <TextArea
            value={formData.reproducibility_notes}
            onChange={(e) => set('reproducibility_notes', e.target.value)}
            rows={2}
            placeholder="What someone would need to reproduce this…"
          />
        </Field>
      </FormSection>

      <FormSection title="References & access">
        <TagListField
          label="Data / figure references"
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
            onChange={(e) =>
              set('privacy_level', e.target.value as ResultsData['privacy_level'])
            }
            options={[
              { value: 'personal', label: 'Only me' },
              { value: 'team', label: 'My team' },
              { value: 'lab', label: 'My lab' },
              { value: 'institution', label: 'Institution' },
              { value: 'global', label: 'Public' },
            ]}
          />
        </Field>
      </FormSection>
    </NotebookFormModal>
  );
};

export default ResultsForm;
