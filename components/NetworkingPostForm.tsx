import React, { useState } from 'react';
import {
  NotebookFormModal,
  Field,
  TextArea,
} from './notebook/NotebookFormPrimitives';
import Input from './ui/Input';
import Select from './ui/Select';

export type NetworkingPostFormValues = {
  title: string;
  body: string;
  postType: string;
  tags: string;
  institution: string;
  location: string;
};

const empty: NetworkingPostFormValues = {
  title: '',
  body: '',
  postType: 'looking_for_collaborator',
  tags: '',
  institution: '',
  location: '',
};

type Props = {
  onCancel: () => void;
  onSubmit: (values: NetworkingPostFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const NetworkingPostForm: React.FC<Props> = ({ onCancel, onSubmit, submitting }) => {
  const [form, setForm] = useState<NetworkingPostFormValues>(empty);
  const set = (key: keyof NetworkingPostFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <NotebookFormModal
      title="Share a networking post"
      subtitle="Looking for collaborators, announcing openings, or sharing updates. Your name appears on the post."
      submitLabel={submitting ? 'Posting…' : 'Publish post'}
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        void onSubmit(form);
      }}
    >
      <Field label="Post type">
        <Select
          value={form.postType}
          onChange={(e) => set('postType', e.target.value)}
          options={[
            { value: 'looking_for_collaborator', label: 'Looking for collaborator' },
            { value: 'open_position', label: 'Open position' },
            { value: 'lab_announcement', label: 'Lab announcement' },
            { value: 'expertise_offer', label: 'Offering expertise' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Field>
      <Field label="Title" required>
        <Input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Short headline"
          required
        />
      </Field>
      <Field label="Details">
        <TextArea
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="What are you looking for or sharing?"
          rows={5}
        />
      </Field>
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
      <Field label="Tags (comma-separated)">
        <Input
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="CRISPR, clinical trials"
        />
      </Field>
    </NotebookFormModal>
  );
};

export default NetworkingPostForm;
