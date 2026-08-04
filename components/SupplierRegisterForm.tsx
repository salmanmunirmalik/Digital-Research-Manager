import React, { useState } from 'react';
import Input from './ui/Input';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
  TagListField,
} from './notebook/NotebookFormPrimitives';

export type SupplierRegisterValues = {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  location: string;
  country: string;
  description: string;
  specializations: string[];
};

type Props = {
  initialData?: Partial<SupplierRegisterValues>;
  mode?: 'register' | 'edit';
  onSubmit: (data: SupplierRegisterValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaults: SupplierRegisterValues = {
  company_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  location: '',
  country: '',
  description: '',
  specializations: [],
};

const SupplierRegisterForm: React.FC<Props> = ({
  initialData,
  mode = 'register',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<SupplierRegisterValues>({ ...defaults, ...initialData });

  const set = <K extends keyof SupplierRegisterValues>(
    key: K,
    value: SupplierRegisterValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title={mode === 'edit' ? 'Edit supplier profile' : 'Register as supplier'}
      subtitle="List your company in the research supplies directory. Buyers will contact you by email - no deals are made on this platform."
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save profile' : 'Create profile'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Company">
        <Field label="Company name" required>
          <Input
            value={form.company_name}
            onChange={(e) => set('company_name', e.target.value)}
            placeholder="e.g. BioChem Supplies"
            required
          />
        </Field>
        <Field label="Contact email" required>
          <Input
            type="email"
            value={form.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            placeholder="sales@example.com"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <Input
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value)}
              placeholder="+1 555 0100"
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
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="City, region"
            />
          </Field>
          <Field label="Country">
            <Input
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              placeholder="Country"
            />
          </Field>
        </div>
        <Field label="Description">
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What you supply and who you serve"
            rows={4}
          />
        </Field>
        <TagListField
          label="Specializations"
          values={form.specializations}
          onChange={(specializations) => set('specializations', specializations)}
          placeholder="Add specialization and press Enter"
        />
      </FormSection>
    </NotebookFormModal>
  );
};

export default SupplierRegisterForm;
