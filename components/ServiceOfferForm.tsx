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

export type ServiceOfferFormValues = {
  service_title: string;
  service_description: string;
  service_type: string;
  pricing_model: string;
  base_price: number;
  currency: string;
  typical_turnaround_days: number;
  requirements_description: string;
  deliverables_description: string;
  expertise_areas: string[];
  techniques_offered: string[];
  tags: string[];
};

type Props = {
  initialData?: Partial<ServiceOfferFormValues>;
  onSubmit: (data: ServiceOfferFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaults: ServiceOfferFormValues = {
  service_title: '',
  service_description: '',
  service_type: 'data_analysis',
  pricing_model: 'project_based',
  base_price: 0,
  currency: 'USD',
  typical_turnaround_days: 7,
  requirements_description: '',
  deliverables_description: '',
  expertise_areas: [],
  techniques_offered: [],
  tags: [],
};

const ServiceOfferForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<ServiceOfferFormValues>({ ...defaults, ...initialData });

  const set = <K extends keyof ServiceOfferFormValues>(
    key: K,
    value: ServiceOfferFormValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title="Offer a service"
      subtitle="List research expertise others can hire"
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={isSubmitting ? 'Publishing…' : 'Publish offer'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Service">
        <Field label="Title" required>
          <Input
            value={form.service_title}
            onChange={(e) => set('service_title', e.target.value)}
            placeholder="e.g. Statistical analysis for biology datasets"
            required
          />
        </Field>
        <Field label="Description" required>
          <TextArea
            value={form.service_description}
            onChange={(e) => set('service_description', e.target.value)}
            rows={4}
            placeholder="Scope, approach, and who this is for…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Service type">
            <Select
              value={form.service_type}
              onChange={(e) => set('service_type', e.target.value)}
              options={[
                { value: 'data_analysis', label: 'Data analysis' },
                { value: 'statistical_consulting', label: 'Statistical consulting' },
                { value: 'protocol_development', label: 'Protocol development' },
                { value: 'training', label: 'Training & workshops' },
                { value: 'troubleshooting', label: 'Troubleshooting' },
                { value: 'peer_review', label: 'Peer review' },
                { value: 'manuscript_editing', label: 'Manuscript editing' },
              ]}
            />
          </Field>
          <Field label="Pricing model">
            <Select
              value={form.pricing_model}
              onChange={(e) => set('pricing_model', e.target.value)}
              options={[
                { value: 'hourly', label: 'Hourly' },
                { value: 'project_based', label: 'Project-based' },
                { value: 'per_sample', label: 'Per sample' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pricing & turnaround">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Base price" required>
            <Input
              type="number"
              value={form.base_price}
              onChange={(e) => set('base_price', Number(e.target.value) || 0)}
              required
            />
          </Field>
          <Field label="Currency">
            <Input value={form.currency} onChange={(e) => set('currency', e.target.value)} />
          </Field>
          <Field label="Typical days">
            <Input
              type="number"
              value={form.typical_turnaround_days}
              onChange={(e) => set('typical_turnaround_days', Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Scope">
        <Field label="What you need from the client">
          <TextArea
            value={form.requirements_description}
            onChange={(e) => set('requirements_description', e.target.value)}
            rows={2}
            placeholder="Data formats, access, background materials…"
          />
        </Field>
        <Field label="Deliverables">
          <TextArea
            value={form.deliverables_description}
            onChange={(e) => set('deliverables_description', e.target.value)}
            rows={2}
            placeholder="Report, figures, code, consultation hours…"
          />
        </Field>
        <TagListField
          label="Expertise areas"
          values={form.expertise_areas}
          onChange={(v) => set('expertise_areas', v)}
          placeholder="Area"
        />
        <TagListField
          label="Techniques"
          values={form.techniques_offered}
          onChange={(v) => set('techniques_offered', v)}
          placeholder="Technique"
        />
        <TagListField
          label="Tags"
          values={form.tags}
          onChange={(v) => set('tags', v)}
          placeholder="Keyword"
        />
      </FormSection>
    </NotebookFormModal>
  );
};

export default ServiceOfferForm;
