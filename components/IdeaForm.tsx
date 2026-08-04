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

interface IdeaFormProps {
  onSubmit: (idea: IdeaData) => void;
  onCancel: () => void;
  initialData?: Partial<IdeaData>;
}

interface IdeaData {
  title: string;
  description: string;
  category: 'research' | 'methodology' | 'collaboration' | 'equipment' | 'process' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  feasibility: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  resources_needed: string[];
  potential_collaborators: string[];
  related_projects: string[];
  tags: string[];
  notes: string;
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

const categories = [
  { value: 'research', label: 'Research direction' },
  { value: 'methodology', label: 'Methodology' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'equipment', label: 'Equipment / tech' },
  { value: 'process', label: 'Process' },
  { value: 'other', label: 'Other' },
];

const IdeaForm: React.FC<IdeaFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<IdeaData>({
    title: '',
    description: '',
    category: 'research',
    priority: 'medium',
    feasibility: 'medium',
    impact: 'medium',
    effort: 'medium',
    timeline: '',
    resources_needed: [],
    potential_collaborators: [],
    related_projects: [],
    tags: [],
    notes: '',
    lab_id: '',
    privacy_level: 'lab',
    ...initialData,
  });

  const set = <K extends keyof IdeaData>(field: K, value: IdeaData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <NotebookFormModal
      title="Research idea"
      subtitle="Capture a concept you may pursue later"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save idea"
      maxWidth="max-w-2xl"
    >
      <FormSection title="Idea" description="Keep it concrete enough to revisit">
        <Field label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Short, searchable title"
            required
          />
        </Field>
        <Field label="Description" required>
          <TextArea
            value={formData.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
            placeholder="Hypothesis, motivation, or concept in your own words…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category">
            <Select
              value={formData.category}
              onChange={(e) => set('category', e.target.value as IdeaData['category'])}
              options={categories}
            />
          </Field>
          <Field label="Rough timeline">
            <Input
              value={formData.timeline}
              onChange={(e) => set('timeline', e.target.value)}
              placeholder="e.g. 3–6 months, Q3"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Assessment" description="Quick judgment - revise anytime">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SegmentedChoice
            label="Priority"
            value={formData.priority}
            onChange={(v) => set('priority', v)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />
          <SegmentedChoice
            label="Feasibility"
            value={formData.feasibility}
            onChange={(v) => set('feasibility', v)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <SegmentedChoice
            label="Impact"
            value={formData.impact}
            onChange={(v) => set('impact', v)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <SegmentedChoice
            label="Effort"
            value={formData.effort}
            onChange={(v) => set('effort', v)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
      </FormSection>

      <FormSection title="Context">
        <TagListField
          label="Resources needed"
          values={formData.resources_needed}
          onChange={(v) => set('resources_needed', v)}
          placeholder="Reagent, instrument, dataset…"
        />
        <TagListField
          label="Potential collaborators"
          values={formData.potential_collaborators}
          onChange={(v) => set('potential_collaborators', v)}
          placeholder="Name or email"
        />
        <TagListField
          label="Tags"
          values={formData.tags}
          onChange={(v) => set('tags', v)}
          placeholder="Keyword"
        />
        <Field label="Notes">
          <TextArea
            value={formData.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Open questions, risks, next checks…"
          />
        </Field>
        <Field label="Visibility">
          <Select
            value={formData.privacy_level}
            onChange={(e) =>
              set('privacy_level', e.target.value as IdeaData['privacy_level'])
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

export default IdeaForm;
