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
  priority: 'low' | 'medium' | 'high';
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
  rationale: string;
  next_check: string;
}

const categories = [
  { value: 'research', label: 'Research question' },
  { value: 'methodology', label: 'Method / assay' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'equipment', label: 'Equipment / tech' },
  { value: 'process', label: 'Lab process' },
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
    rationale: '',
    next_check: '',
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
      subtitle="Capture a hypothesis or concept worth revisiting"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save idea"
      maxWidth="max-w-xl"
    >
      <FormSection title="Idea" description="Be specific enough that future-you understands the bet">
        <Field label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Short, searchable title"
            required
          />
        </Field>
        <Field label="Hypothesis / concept" required>
          <TextArea
            value={formData.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
            placeholder="What do you want to test or explore, and why it might work…"
            required
          />
        </Field>
        <Field label="Why it matters" hint="Gap, opportunity, or practical need">
          <TextArea
            value={formData.rationale}
            onChange={(e) => set('rationale', e.target.value)}
            rows={2}
            placeholder="e.g. Current assay is too slow for screening; literature lacks X"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select
              value={formData.category}
              onChange={(e) => set('category', e.target.value as IdeaData['category'])}
              options={categories}
            />
          </Field>
          <SegmentedChoice
            label="Priority"
            value={formData.priority}
            onChange={(v) => set('priority', v)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Med' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
      </FormSection>

      <FormSection title="Follow-up" description="Optional — keep the backlog lightweight">
        <Field label="Next check" hint="What would make you pursue or drop this">
          <Input
            value={formData.next_check || formData.timeline}
            onChange={(e) => {
              set('next_check', e.target.value);
              set('timeline', e.target.value);
            }}
            placeholder="e.g. Read Smith 2024; ask PI in next meeting"
          />
        </Field>
        <TagListField
          label="Tags"
          values={formData.tags}
          onChange={(v) => set('tags', v)}
          placeholder="Keyword"
        />
        <Field label="Visibility">
          <Select
            value={formData.privacy_level}
            onChange={(e) => set('privacy_level', e.target.value as IdeaData['privacy_level'])}
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

export default IdeaForm;
