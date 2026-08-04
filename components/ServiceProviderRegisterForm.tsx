import React, { useState } from 'react';
import Input from './ui/Input';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
  TagListField,
} from './notebook/NotebookFormPrimitives';

export type ServiceProviderRegisterValues = {
  display_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  institution: string;
  location: string;
  bio: string;
  expertise_areas: string[];
  techniques: string[];
  pricing_note: string;
};

type Props = {
  initialData?: Partial<ServiceProviderRegisterValues>;
  mode?: 'register' | 'edit';
  onSubmit: (data: ServiceProviderRegisterValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaults: ServiceProviderRegisterValues = {
  display_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  institution: '',
  location: '',
  bio: '',
  expertise_areas: [],
  techniques: [],
  pricing_note: '',
};

const ServiceProviderRegisterForm: React.FC<Props> = ({
  initialData,
  mode = 'register',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<ServiceProviderRegisterValues>({
    ...defaults,
    ...initialData,
  });

  const set = <K extends keyof ServiceProviderRegisterValues>(
    key: K,
    value: ServiceProviderRegisterValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Edit service provider profile' : 'Register as service provider'}
      subtitle="Appear in the research services directory. Researchers will email you directly - no bookings or deals on this platform."
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save profile' : 'Create profile'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Profile">
        <Field label="Display name" required>
          <Input
            value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)}
            placeholder="e.g. Dr. Ana Ruiz - Bioinformatics"
            required
          />
        </Field>
        <Field label="Contact email" required>
          <Input
            type="email"
            value={form.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            placeholder="you@university.edu"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <Input
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value)}
            />
          </Field>
          <Field label="Website">
            <Input
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Institution">
            <Input
              value={form.institution}
              onChange={(e) => set('institution', e.target.value)}
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Bio">
          <TextArea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Expertise, experience, and how you work with labs"
            rows={4}
          />
        </Field>
        <Field label="Pricing note (optional)">
          <Input
            value={form.pricing_note}
            onChange={(e) => set('pricing_note', e.target.value)}
            placeholder='e.g. "Quote on request" or "From $150/hr"'
          />
        </Field>
        <TagListField
          label="Expertise areas"
          values={form.expertise_areas}
          onChange={(expertise_areas) => set('expertise_areas', expertise_areas)}
          placeholder="Add area and press Enter"
        />
        <TagListField
          label="Techniques"
          values={form.techniques}
          onChange={(techniques) => set('techniques', techniques)}
          placeholder="Add technique and press Enter"
        />
      </FormSection>
    </NotebookFormModal>
  );
};

export default ServiceProviderRegisterForm;
