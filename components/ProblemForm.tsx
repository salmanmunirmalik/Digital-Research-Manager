import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

interface ProblemFormProps {
  onSubmit: (problem: ProblemData) => void;
  onCancel: () => void;
  initialData?: Partial<ProblemData>;
}

interface ProblemData {
  title: string;
  description: string;
  problem_type: 'equipment' | 'protocol' | 'data' | 'safety' | 'collaboration' | 'resource' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reported_by: string;
  assigned_to: string;
  affected_experiments: string[];
  affected_equipment: string[];
  symptoms: string[];
  possible_causes: string[];
  attempted_solutions: SolutionAttempt[];
  current_solution: string;
  resolution: string;
  prevention_measures: string[];
  lessons_learned: string;
  follow_up_date: string;
  tags: string[];
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  likely_cause: string;
}

interface SolutionAttempt {
  solution: string;
  attempted_by: string;
  date: string;
  result: 'successful' | 'failed' | 'partial';
  notes: string;
}

const ProblemForm: React.FC<ProblemFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProblemData>({
    title: '',
    description: '',
    problem_type: 'protocol',
    severity: 'medium',
    status: 'reported',
    priority: 'medium',
    reported_by: user?.username || '',
    assigned_to: '',
    affected_experiments: [],
    affected_equipment: [],
    symptoms: [],
    possible_causes: [],
    attempted_solutions: [],
    current_solution: '',
    resolution: '',
    prevention_measures: [],
    lessons_learned: '',
    follow_up_date: '',
    tags: [],
    lab_id: '',
    privacy_level: 'lab',
    likely_cause: '',
    ...initialData,
  });

  const set = <K extends keyof ProblemData>(field: K, value: ProblemData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cause = formData.likely_cause?.trim();
    onSubmit({
      ...formData,
      // Keep severity as the single urgency signal; mirror into priority for legacy mapping
      priority:
        formData.severity === 'critical'
          ? 'urgent'
          : formData.severity === 'high'
            ? 'high'
            : formData.severity === 'low'
              ? 'low'
              : 'medium',
      possible_causes: cause
        ? Array.from(new Set([...(formData.possible_causes || []), cause]))
        : formData.possible_causes,
      lessons_learned: formData.lessons_learned || formData.prevention_measures.join('; '),
    });
  };

  return (
    <NotebookFormModal
      title="Problem note"
      subtitle="Log what broke, what you tried, and what fixed it"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save problem note"
      maxWidth="max-w-xl"
    >
      <FormSection title="Problem" description="Enough detail that a colleague could reconstruct it">
        <Field label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Contaminated PCR master mix — batch 14"
            required
          />
        </Field>
        <Field label="What happened" required>
          <TextArea
            value={formData.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="When it appeared, symptoms, and impact on the work…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select
              value={formData.problem_type}
              onChange={(e) => set('problem_type', e.target.value as ProblemData['problem_type'])}
              options={[
                { value: 'protocol', label: 'Protocol / method' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'data', label: 'Data / analysis' },
                { value: 'safety', label: 'Safety' },
                { value: 'resource', label: 'Reagent / resource' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Status">
            <Select
              value={formData.status}
              onChange={(e) => set('status', e.target.value as ProblemData['status'])}
              options={[
                { value: 'reported', label: 'Open' },
                { value: 'investigating', label: 'Investigating' },
                { value: 'in_progress', label: 'Fix in progress' },
                { value: 'resolved', label: 'Resolved' },
              ]}
            />
          </Field>
        </div>
        <SegmentedChoice
          label="Severity"
          value={formData.severity}
          onChange={(v) => set('severity', v)}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Med' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
        />
        <TagListField
          label="Affected work"
          values={[...formData.affected_experiments, ...formData.affected_equipment].filter(Boolean)}
          onChange={(v) => {
            set('affected_experiments', v);
            set('affected_equipment', []);
          }}
          placeholder="Experiment, instrument, or batch"
        />
      </FormSection>

      <FormSection title="Troubleshooting" description="Diagnosis and fix">
        <Field label="Likely cause">
          <Input
            value={formData.likely_cause}
            onChange={(e) => set('likely_cause', e.target.value)}
            placeholder="Best current hypothesis"
          />
        </Field>
        <Field label="What you tried">
          <TextArea
            value={formData.current_solution}
            onChange={(e) => set('current_solution', e.target.value)}
            rows={3}
            placeholder="Attempts so far, in order…"
          />
        </Field>
        <Field label="Resolution" hint="Final fix — leave blank if still open">
          <TextArea
            value={formData.resolution}
            onChange={(e) => set('resolution', e.target.value)}
            rows={3}
            placeholder="What actually fixed it…"
          />
        </Field>
        <Field label="Prevention / lesson">
          <TextArea
            value={formData.lessons_learned}
            onChange={(e) => set('lessons_learned', e.target.value)}
            rows={2}
            placeholder="What you would tell a colleague to avoid this…"
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
            onChange={(e) => set('privacy_level', e.target.value as ProblemData['privacy_level'])}
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

export default ProblemForm;
