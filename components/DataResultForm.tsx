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

export type DataResultFormValues = {
  title: string;
  type: 'experiment' | 'analysis' | 'image' | 'document' | 'code';
  category: string;
  summary: string;
  description: string;
  methodology: string;
  results: string;
  conclusions: string;
  tags: string[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  protocolId: string;
  experimentId: string;
  notebookEntryId: string;
  metadata: {
    linkedExperiment?: string;
    sampleCount?: number;
    replicates?: number;
    instruments?: string;
    reagents?: string;
    analysisMethod?: string;
    software?: string;
  };
  fileNames: string[];
};

type Props = {
  mode?: 'create' | 'edit';
  initialData?: Partial<DataResultFormValues>;
  onSubmit: (data: DataResultFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaultValues: DataResultFormValues = {
  title: '',
  type: 'experiment',
  category: 'molecular_biology',
  summary: '',
  description: '',
  methodology: '',
  results: '',
  conclusions: '',
  tags: [],
  privacy_level: 'lab',
  protocolId: '',
  experimentId: '',
  notebookEntryId: '',
  metadata: {},
  fileNames: [],
};

const DataResultForm: React.FC<Props> = ({
  mode = 'create',
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { protocols, experiments, notebookEntries } = useEntityOptions([
    'protocols',
    'experiments',
    'notebook',
  ]);
  const [form, setForm] = useState<DataResultFormValues>({
    ...defaultValues,
    ...initialData,
    metadata: { ...defaultValues.metadata, ...initialData?.metadata },
  });

  const set = <K extends keyof DataResultFormValues>(key: K, value: DataResultFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setMeta = (key: keyof DataResultFormValues['metadata'], value: string | number | undefined) => {
    setForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      metadata: {
        ...form.metadata,
        linkedExperiment: form.experimentId || form.metadata.linkedExperiment,
      },
    });
  };

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Edit data entry' : 'Add data & results'}
      subtitle="Store personal research artifacts - files and findings you own"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save entry'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Basics">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. qPCR run 12 - Ct values"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => set('type', e.target.value as DataResultFormValues['type'])}
              options={[
                { value: 'experiment', label: 'Experiment outputs' },
                { value: 'analysis', label: 'Analysis' },
                { value: 'image', label: 'Image' },
                { value: 'document', label: 'Document' },
                { value: 'code', label: 'Code' },
              ]}
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={[
                { value: 'molecular_biology', label: 'Molecular biology' },
                { value: 'cell_biology', label: 'Cell biology' },
                { value: 'biochemistry', label: 'Biochemistry' },
                { value: 'microbiology', label: 'Microbiology' },
                { value: 'bioinformatics', label: 'Bioinformatics' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
        </div>
        <Field label="Summary" required>
          <TextArea
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            rows={3}
            placeholder="What this artifact contains and why it matters…"
            required
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="Context, conditions, and notes…"
          />
        </Field>
      </FormSection>

      <FormSection title="Links" description="Connect this artifact to protocols, experiments, or notebook entries">
        <Field label="Linked experiment">
          <EntityLinkSelect
            value={form.experimentId}
            options={experiments}
            onChange={(id) => set('experimentId', id)}
            placeholder="None - choose an experiment"
          />
        </Field>
        <Field label="Linked protocol">
          <EntityLinkSelect
            value={form.protocolId}
            options={protocols}
            onChange={(id) => set('protocolId', id)}
            placeholder="None - choose a protocol"
          />
        </Field>
        <Field label="Linked notebook entry">
          <EntityLinkSelect
            value={form.notebookEntryId}
            options={notebookEntries}
            onChange={(id) => set('notebookEntryId', id)}
            placeholder="None - choose a notebook entry"
          />
        </Field>
      </FormSection>

      <FormSection title="Analysis" description="Optional - deeper write-up">
        <Field label="Methodology">
          <TextArea
            value={form.methodology}
            onChange={(e) => set('methodology', e.target.value)}
            rows={2}
            placeholder="How data was generated or analyzed…"
          />
        </Field>
        <Field label="Results">
          <TextArea
            value={form.results}
            onChange={(e) => set('results', e.target.value)}
            rows={2}
            placeholder="Key quantitative or qualitative findings…"
          />
        </Field>
        <Field label="Conclusions">
          <TextArea
            value={form.conclusions}
            onChange={(e) => set('conclusions', e.target.value)}
            rows={2}
            placeholder="Interpretation…"
          />
        </Field>
      </FormSection>

      <FormSection title="Metadata">
        {form.type === 'experiment' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sample count">
                <Input
                  type="number"
                  value={form.metadata.sampleCount ?? ''}
                  onChange={(e) =>
                    setMeta('sampleCount', e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </Field>
              <Field label="Replicates">
                <Input
                  type="number"
                  value={form.metadata.replicates ?? ''}
                  onChange={(e) =>
                    setMeta('replicates', e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </Field>
            </div>
            <Field label="Instruments">
              <Input
                value={form.metadata.instruments || ''}
                onChange={(e) => setMeta('instruments', e.target.value)}
                placeholder="PCR machine, microscope…"
              />
            </Field>
            <Field label="Reagents">
              <Input
                value={form.metadata.reagents || ''}
                onChange={(e) => setMeta('reagents', e.target.value)}
                placeholder="Key reagents…"
              />
            </Field>
          </>
        )}
        {form.type === 'analysis' && (
          <>
            <Field label="Method">
              <Input
                value={form.metadata.analysisMethod || ''}
                onChange={(e) => setMeta('analysisMethod', e.target.value)}
                placeholder="Western blot, qPCR…"
              />
            </Field>
            <Field label="Software">
              <Input
                value={form.metadata.software || ''}
                onChange={(e) => setMeta('software', e.target.value)}
                placeholder="ImageJ, GraphPad…"
              />
            </Field>
          </>
        )}
        <TagListField
          label="File references"
          values={form.fileNames}
          onChange={(v) => set('fileNames', v)}
          placeholder="Filename or path (upload later)"
          hint="Names are stored as references - binary upload can be added later"
        />
        <TagListField
          label="Tags"
          values={form.tags}
          onChange={(v) => set('tags', v)}
          placeholder="Keyword"
        />
        <Field label="Visibility">
          <Select
            value={form.privacy_level}
            onChange={(e) =>
              set('privacy_level', e.target.value as DataResultFormValues['privacy_level'])
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

export default DataResultForm;
