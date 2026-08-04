import React, { useState } from 'react';
import {
  NotebookFormModal,
  Field,
  TextArea,
} from './notebook/NotebookFormPrimitives';
import Input from './ui/Input';
import Select from './ui/Select';

export type GrantPostFormValues = {
  title: string;
  summary: string;
  sponsor: string;
  fundingType: string;
  fundingMin: string;
  fundingMax: string;
  fundingCurrency: string;
  deadlineDate: string;
  url: string;
  region: string;
  country: string;
  disciplines: string;
};

const empty: GrantPostFormValues = {
  title: '',
  summary: '',
  sponsor: '',
  fundingType: 'research_grant',
  fundingMin: '',
  fundingMax: '',
  fundingCurrency: 'USD',
  deadlineDate: '',
  url: '',
  region: '',
  country: '',
  disciplines: '',
};

type Props = {
  onCancel: () => void;
  onSubmit: (values: GrantPostFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const GrantPostForm: React.FC<Props> = ({ onCancel, onSubmit, submitting }) => {
  const [form, setForm] = useState<GrantPostFormValues>(empty);

  const set = (key: keyof GrantPostFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title="Post a funding opportunity"
      subtitle="Share a grant or call with the research community. Your name will appear as the poster."
      submitLabel={submitting ? 'Posting…' : 'Post opportunity'}
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        void onSubmit(form);
      }}
    >
      <Field label="Title" required>
        <Input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Early-career infectious disease seed grant"
          required
        />
      </Field>
      <Field label="Summary">
        <TextArea
          value={form.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder="Eligibility, scope, and what applicants should know"
          rows={4}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Sponsor / funder">
          <Input
            value={form.sponsor}
            onChange={(e) => set('sponsor', e.target.value)}
            placeholder="Agency or foundation"
          />
        </Field>
        <Field label="Funding type">
          <Select
            value={form.fundingType}
            onChange={(e) => set('fundingType', e.target.value)}
            options={[
              { value: 'research_grant', label: 'Research grant' },
              { value: 'fellowship', label: 'Fellowship' },
              { value: 'seed', label: 'Seed / pilot' },
              { value: 'travel', label: 'Travel / mobility' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Field>
        <Field label="Min amount">
          <Input
            type="number"
            value={form.fundingMin}
            onChange={(e) => set('fundingMin', e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Max amount">
          <Input
            type="number"
            value={form.fundingMax}
            onChange={(e) => set('fundingMax', e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Currency">
          <Input
            value={form.fundingCurrency}
            onChange={(e) => set('fundingCurrency', e.target.value)}
          />
        </Field>
        <Field label="Deadline">
          <Input
            type="date"
            value={form.deadlineDate}
            onChange={(e) => set('deadlineDate', e.target.value)}
          />
        </Field>
        <Field label="Region">
          <Input
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
            placeholder="e.g. Global, EU, Sub-Saharan Africa"
          />
        </Field>
        <Field label="Country">
          <Input
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Disciplines (comma-separated)">
        <Input
          value={form.disciplines}
          onChange={(e) => set('disciplines', e.target.value)}
          placeholder="Immunology, Epidemiology"
        />
      </Field>
      <Field label="Application URL">
        <Input
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          placeholder="https://"
        />
      </Field>
    </NotebookFormModal>
  );
};

export default GrantPostForm;
