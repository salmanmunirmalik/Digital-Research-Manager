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

export type EventFormValues = {
  title: string;
  type: 'research_exchange' | 'conference' | 'summer_school' | 'workshop' | 'symposium' | 'internship';
  description: string;
  organizer: string;
  institution: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  maxParticipants: number;
  cost: number;
  currency: string;
  funding: boolean;
  fundingAmount: number;
  requirements: string[];
  skillsRequired: string[];
  benefits: string[];
  website: string;
  contactEmail: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
};

type Props = {
  initialData?: Partial<EventFormValues>;
  onSubmit: (data: EventFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaults: EventFormValues = {
  title: '',
  type: 'conference',
  description: '',
  organizer: '',
  institution: '',
  location: '',
  country: '',
  startDate: '',
  endDate: '',
  applicationDeadline: '',
  maxParticipants: 0,
  cost: 0,
  currency: 'USD',
  funding: false,
  fundingAmount: 0,
  requirements: [],
  skillsRequired: [],
  benefits: [],
  website: '',
  contactEmail: '',
  status: 'upcoming',
};

const EventForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<EventFormValues>({ ...defaults, ...initialData });

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <NotebookFormModal
      title="Create event"
      subtitle="Publish a conference, workshop, exchange, or summer school"
      onCancel={onCancel}
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
      }}
      submitLabel={isSubmitting ? 'Publishing…' : 'Publish event'}
      maxWidth="max-w-2xl"
    >
      <FormSection title="Event">
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Event title"
            required
          />
        </Field>
        <Field label="Description" required>
          <TextArea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="Audience, themes, and what participants gain…"
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => set('type', e.target.value as EventFormValues['type'])}
              options={[
                { value: 'conference', label: 'Conference' },
                { value: 'workshop', label: 'Workshop' },
                { value: 'research_exchange', label: 'Research exchange' },
                { value: 'summer_school', label: 'Summer school' },
                { value: 'symposium', label: 'Symposium' },
                { value: 'internship', label: 'Internship' },
              ]}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value as EventFormValues['status'])}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Organizer & place">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Organizer">
            <Input value={form.organizer} onChange={(e) => set('organizer', e.target.value)} />
          </Field>
          <Field label="Institution">
            <Input value={form.institution} onChange={(e) => set('institution', e.target.value)} />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="City / venue"
            />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Dates & capacity">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Start date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </Field>
          <Field label="Application deadline">
            <Input
              type="date"
              value={form.applicationDeadline}
              onChange={(e) => set('applicationDeadline', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Max participants">
          <Input
            type="number"
            value={form.maxParticipants || ''}
            onChange={(e) => set('maxParticipants', Number(e.target.value) || 0)}
            placeholder="0 = unlimited"
          />
        </Field>
      </FormSection>

      <FormSection title="Cost & stipend" description="Stipends are event support - not research grants">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Cost">
            <Input
              type="number"
              value={form.cost}
              onChange={(e) => set('cost', Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Currency">
            <Input value={form.currency} onChange={(e) => set('currency', e.target.value)} />
          </Field>
          <Field label="Stipend amount">
            <Input
              type="number"
              value={form.fundingAmount || ''}
              onChange={(e) => set('fundingAmount', Number(e.target.value) || 0)}
              disabled={!form.funding}
            />
          </Field>
        </div>
        <SegmentedChoice
          label="Offers stipend / travel support"
          value={form.funding ? 'yes' : 'no'}
          onChange={(v) => set('funding', v === 'yes')}
          options={[
            { value: 'no', label: 'No' },
            { value: 'yes', label: 'Yes' },
          ]}
        />
      </FormSection>

      <FormSection title="Details">
        <TagListField
          label="Requirements"
          values={form.requirements}
          onChange={(v) => set('requirements', v)}
          placeholder="Eligibility requirement"
        />
        <TagListField
          label="Skills"
          values={form.skillsRequired}
          onChange={(v) => set('skillsRequired', v)}
          placeholder="Skill"
        />
        <TagListField
          label="Benefits"
          values={form.benefits}
          onChange={(v) => set('benefits', v)}
          placeholder="Benefit"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Website">
            <Input
              type="url"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Contact email">
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
            />
          </Field>
        </div>
      </FormSection>
    </NotebookFormModal>
  );
};

export default EventForm;
