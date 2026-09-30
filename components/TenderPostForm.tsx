import React, { useState } from 'react';
import Input from './ui/Input';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
  TagListField,
} from './notebook/NotebookFormPrimitives';

export type TenderPostValues = {
  title: string;
  organization: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  country: string;
  description: string;
  category: string;
  budget_note: string;
  deadline: string;
  requirements: string[];
};

type Props = {
  initialData?: Partial<TenderPostValues>;
  mode?: 'create' | 'edit';
  onSubmit: (data: TenderPostValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaults: TenderPostValues = {
  title: '',
  organization: '',
  contact_email: '',
  contact_phone: '',
  location: '',
  country: '',
  description: '',
  category: '',
  budget_note: '',
  deadline: '',
  requirements: [],
};

const TenderPostForm: React.FC<Props> = ({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<TenderPostValues>({ ...defaults, ...initialData });

  const set = <K extends keyof TenderPostValues>(key: K, value: TenderPostValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Edit tender' : 'Post a tender'}
      subtitle="Publish a research procurement notice or RFP. Suppliers and providers will contact you by email — no bids are placed on this platform."
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save tender' : 'Post tender'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Tender">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Supply of PCR reagents for Q3"
            required
          />
        </Field>
        <Field label="Organization">
          <Input
            value={form.organization}
            onChange={(e) => set('organization', e.target.value)}
            placeholder="Lab or institution name"
          />
        </Field>
        <Field label="Category">
          <Input
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="e.g. reagents, equipment, services"
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Scope, quantities, delivery expectations…"
            rows={4}
          />
        </Field>
        <TagListField
          label="Requirements"
          values={form.requirements}
          onChange={(requirements) => set('requirements', requirements)}
          placeholder="Add requirement and press Enter"
        />
      </FormSection>

      <FormSection title="Logistics">
        <Field label="Budget note">
          <Input
            value={form.budget_note}
            onChange={(e) => set('budget_note', e.target.value)}
            placeholder="e.g. Up to €5,000 / quote on request"
          />
        </Field>
        <Field label="Deadline">
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => set('deadline', e.target.value)}
          />
        </Field>
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="City or campus"
          />
        </Field>
        <Field label="Country">
          <Input
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="Country"
          />
        </Field>
      </FormSection>

      <FormSection title="Contact">
        <Field label="Contact email" required>
          <Input
            type="email"
            value={form.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            required
          />
        </Field>
        <Field label="Contact phone">
          <Input
            value={form.contact_phone}
            onChange={(e) => set('contact_phone', e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </FormSection>
    </NotebookFormModal>
  );
};

export default TenderPostForm;
