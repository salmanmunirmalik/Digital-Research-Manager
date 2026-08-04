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

export type DatabankOrgFormValues = {
  name: string;
  type: string;
  category: string;
  country: string;
  region: string;
  contactEmail: string;
  website: string;
  description: string;
  specializations: string[];
};

type OrgProps = {
  mode?: 'create' | 'edit';
  initialData?: Partial<DatabankOrgFormValues>;
  onSubmit: (data: DatabankOrgFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export const DatabankOrgForm: React.FC<OrgProps> = ({
  mode = 'create',
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<DatabankOrgFormValues>({
    name: '',
    type: 'university',
    category: 'clinical',
    country: '',
    region: '',
    contactEmail: '',
    website: '',
    description: '',
    specializations: [],
    ...initialData,
  });

  const set = <K extends keyof DatabankOrgFormValues>(
    key: K,
    value: DatabankOrgFormValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Edit organization' : 'Register organization'}
      subtitle={
        mode === 'edit'
          ? 'Update how this organization appears in the data bank'
          : 'List your lab or institution for ethical data collaboration'
      }
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={
        isSubmitting
          ? 'Saving…'
          : mode === 'edit'
            ? 'Save changes'
            : 'Submit registration'
      }
      maxWidth="max-w-2xl"
    >
      <FormSection title="Organization">
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            placeholder="Organization name"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              options={[
                { value: 'university', label: 'University' },
                { value: 'hospital', label: 'Hospital' },
                { value: 'research_institute', label: 'Research institute' },
                { value: 'ngo', label: 'NGO' },
                { value: 'government', label: 'Government' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={[
                { value: 'clinical', label: 'Clinical' },
                { value: 'genomics', label: 'Genomics' },
                { value: 'epidemiology', label: 'Epidemiology' },
                { value: 'environmental', label: 'Environmental' },
                { value: 'social', label: 'Social science' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
        </div>
        <Field label="Description" required>
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            required
            placeholder="What data or research capacity you bring…"
          />
        </Field>
      </FormSection>

      <FormSection title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country" required>
            <Input
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              required
            />
          </Field>
          <Field label="Region">
            <Input value={form.region} onChange={(e) => set('region', e.target.value)} />
          </Field>
          <Field label="Contact email" required>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              required
            />
          </Field>
          <Field label="Website">
            <Input
              type="url"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
        <TagListField
          label="Specializations"
          values={form.specializations}
          onChange={(v) => set('specializations', v)}
          placeholder="Specialty"
        />
      </FormSection>
    </NotebookFormModal>
  );
};

export type DatabankRequestFormValues = {
  requesterName: string;
  requesterInstitution: string;
  requesterEmail: string;
  purpose: string;
  methodology: string;
  timeline: string;
  collaborationProposed: string;
  additionalNotes: string;
};

type RequestProps = {
  offerTitle: string;
  onSubmit: (data: DatabankRequestFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export const DatabankRequestForm: React.FC<RequestProps> = ({
  offerTitle,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<DatabankRequestFormValues>({
    requesterName: '',
    requesterInstitution: '',
    requesterEmail: '',
    purpose: '',
    methodology: '',
    timeline: '',
    collaborationProposed: '',
    additionalNotes: '',
  });

  const set = <K extends keyof DatabankRequestFormValues>(
    key: K,
    value: DatabankRequestFormValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title="Request data access"
      subtitle={`Dataset: ${offerTitle}`}
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={isSubmitting ? 'Submitting…' : 'Submit request'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Requester">
        <Field label="Name" required>
          <Input
            value={form.requesterName}
            onChange={(e) => set('requesterName', e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Institution" required>
            <Input
              value={form.requesterInstitution}
              onChange={(e) => set('requesterInstitution', e.target.value)}
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.requesterEmail}
              onChange={(e) => set('requesterEmail', e.target.value)}
              required
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Research plan">
        <Field label="Purpose" required>
          <TextArea
            value={form.purpose}
            onChange={(e) => set('purpose', e.target.value)}
            rows={4}
            required
            placeholder="Research objectives for this dataset…"
          />
        </Field>
        <Field label="Methodology" required>
          <TextArea
            value={form.methodology}
            onChange={(e) => set('methodology', e.target.value)}
            rows={3}
            required
            placeholder="Analysis approach…"
          />
        </Field>
        <Field label="Timeline" required>
          <Input
            value={form.timeline}
            onChange={(e) => set('timeline', e.target.value)}
            placeholder="e.g. 6 months"
            required
          />
        </Field>
        <Field label="Collaboration proposal">
          <TextArea
            value={form.collaborationProposed}
            onChange={(e) => set('collaborationProposed', e.target.value)}
            rows={2}
            placeholder="Co-authorship or joint analysis plans…"
          />
        </Field>
        <Field label="Additional notes">
          <TextArea
            value={form.additionalNotes}
            onChange={(e) => set('additionalNotes', e.target.value)}
            rows={2}
          />
        </Field>
      </FormSection>
    </NotebookFormModal>
  );
};

export type DatabankOfferFormValues = {
  title: string;
  description: string;
  dataType: string;
  populationType: string;
  sampleSize: number;
  timePeriod: string;
  accessLevel: string;
  contactPerson: string;
  requirements: string[];
  diseaseFocus: string[];
  geographicCoverage: string[];
};

type OfferProps = {
  mode?: 'create' | 'edit';
  initialData?: Partial<DatabankOfferFormValues>;
  onSubmit: (data: DatabankOfferFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export const DatabankOfferForm: React.FC<OfferProps> = ({
  mode = 'create',
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<DatabankOfferFormValues>({
    title: '',
    description: '',
    dataType: 'clinical',
    populationType: 'general',
    sampleSize: 0,
    timePeriod: '',
    accessLevel: 'restricted',
    contactPerson: '',
    requirements: [],
    diseaseFocus: [],
    geographicCoverage: [],
    ...initialData,
  });

  const set = <K extends keyof DatabankOfferFormValues>(
    key: K,
    value: DatabankOfferFormValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Edit dataset offer' : 'Publish dataset offer'}
      subtitle="Describe the dataset others may request under your ethics terms"
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={
        isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save offer' : 'Publish offer'
      }
      maxWidth="max-w-2xl"
    >
      <FormSection title="Dataset">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            placeholder="e.g. Anonymized cohort - Type 2 diabetes 2018–2024"
          />
        </Field>
        <Field label="Description" required>
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            required
            placeholder="What is included, how it was collected, and key limitations…"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Data type">
            <Select
              value={form.dataType}
              onChange={(e) => set('dataType', e.target.value)}
              options={[
                { value: 'clinical', label: 'Clinical' },
                { value: 'epidemiological', label: 'Epidemiological' },
                { value: 'genomic', label: 'Genomic' },
                { value: 'environmental', label: 'Environmental' },
                { value: 'social', label: 'Social' },
                { value: 'demographic', label: 'Demographic' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Access level">
            <Select
              value={form.accessLevel}
              onChange={(e) => set('accessLevel', e.target.value)}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'restricted', label: 'Restricted' },
                { value: 'collaboration_required', label: 'Collaboration required' },
              ]}
            />
          </Field>
          <Field label="Population">
            <Select
              value={form.populationType}
              onChange={(e) => set('populationType', e.target.value)}
              options={[
                { value: 'general', label: 'General' },
                { value: 'pediatric', label: 'Pediatric' },
                { value: 'adult', label: 'Adult' },
                { value: 'elderly', label: 'Elderly' },
                { value: 'specific_condition', label: 'Specific condition' },
              ]}
            />
          </Field>
          <Field label="Sample size">
            <Input
              type="number"
              value={form.sampleSize || ''}
              onChange={(e) => set('sampleSize', Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <Field label="Time period">
          <Input
            value={form.timePeriod}
            onChange={(e) => set('timePeriod', e.target.value)}
            placeholder="e.g. 2018–2024"
          />
        </Field>
        <Field label="Contact person">
          <Input
            value={form.contactPerson}
            onChange={(e) => set('contactPerson', e.target.value)}
            placeholder="Name for access requests"
          />
        </Field>
      </FormSection>

      <FormSection title="Coverage & requirements">
        <TagListField
          label="Disease / focus areas"
          values={form.diseaseFocus}
          onChange={(v) => set('diseaseFocus', v)}
          placeholder="Focus area"
        />
        <TagListField
          label="Geographic coverage"
          values={form.geographicCoverage}
          onChange={(v) => set('geographicCoverage', v)}
          placeholder="Region or country"
        />
        <TagListField
          label="Access requirements"
          values={form.requirements}
          onChange={(v) => set('requirements', v)}
          placeholder="e.g. IRB approval, DUA"
        />
      </FormSection>
    </NotebookFormModal>
  );
};
