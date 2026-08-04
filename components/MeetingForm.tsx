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

interface MeetingFormProps {
  onSubmit: (meeting: MeetingData) => void;
  onCancel: () => void;
  initialData?: Partial<MeetingData>;
}

interface MeetingData {
  title: string;
  description: string;
  meeting_type: 'lab_meeting' | 'project_review' | 'collaboration' | 'seminar' | 'committee' | 'other';
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  attendees: string[];
  agenda_items: AgendaItem[];
  action_items: ActionItem[];
  decisions: string[];
  next_meeting: string;
  notes: string;
  tags: string[];
  lab_id: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
}

interface AgendaItem {
  title: string;
  description: string;
  duration_minutes: number;
  presenter?: string;
}

interface ActionItem {
  task: string;
  assignee: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
}

const MeetingForm: React.FC<MeetingFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<MeetingData>({
    title: '',
    description: '',
    meeting_type: 'lab_meeting',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    attendees: [],
    agenda_items: [],
    action_items: [],
    decisions: [],
    next_meeting: '',
    notes: '',
    tags: [],
    lab_id: '',
    privacy_level: 'lab',
    ...initialData,
  });

  const [agendaTitle, setAgendaTitle] = useState('');
  const [actionTask, setActionTask] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');

  const set = <K extends keyof MeetingData>(key: K, value: MeetingData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <NotebookFormModal
      title="Meeting note"
      subtitle="Document agenda, decisions, and follow-ups"
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      submitLabel="Save meeting note"
      maxWidth="max-w-2xl"
    >
      <FormSection title="Meeting">
        <Field label="Title" required>
          <Input
            value={formData.title}
            onChange={(e) => set('title', e.target.value)}
            required
            placeholder="e.g. Weekly lab meeting - Mar 12"
          />
        </Field>
        <Field label="Summary">
          <TextArea
            value={formData.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Purpose and context…"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type">
            <Select
              value={formData.meeting_type}
              onChange={(e) => set('meeting_type', e.target.value as MeetingData['meeting_type'])}
              options={[
                { value: 'lab_meeting', label: 'Lab meeting' },
                { value: 'project_review', label: 'Project review' },
                { value: 'collaboration', label: 'Collaboration' },
                { value: 'seminar', label: 'Seminar' },
                { value: 'committee', label: 'Committee' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Location">
            <Input
              value={formData.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Room or video link"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date">
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Start">
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => set('start_time', e.target.value)}
            />
          </Field>
          <Field label="End">
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => set('end_time', e.target.value)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="People & agenda">
        <TagListField
          label="Attendees"
          values={formData.attendees}
          onChange={(v) => set('attendees', v)}
          placeholder="Name"
        />
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Agenda items</label>
          {formData.agenda_items.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {formData.agenda_items.map((item, i) => (
                <li
                  key={`${item.title}-${i}`}
                  className="flex items-center justify-between gap-2 text-[13px] text-slate-700 border border-slate-200 rounded-md px-3 py-2"
                >
                  <span>{item.title}</span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 text-[12px]"
                    onClick={() =>
                      set(
                        'agenda_items',
                        formData.agenda_items.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              value={agendaTitle}
              onChange={(e) => setAgendaTitle(e.target.value)}
              placeholder="Agenda topic"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!agendaTitle.trim()) return;
                  set('agenda_items', [
                    ...formData.agenda_items,
                    { title: agendaTitle.trim(), description: '', duration_minutes: 10 },
                  ]);
                  setAgendaTitle('');
                }
              }}
            />
            <button
              type="button"
              className="shrink-0 px-3 py-2 text-[13px] font-medium border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              onClick={() => {
                if (!agendaTitle.trim()) return;
                set('agenda_items', [
                  ...formData.agenda_items,
                  { title: agendaTitle.trim(), description: '', duration_minutes: 10 },
                ]);
                setAgendaTitle('');
              }}
            >
              Add
            </button>
          </div>
        </div>
      </FormSection>

      <FormSection title="Outcomes">
        <TagListField
          label="Decisions"
          values={formData.decisions}
          onChange={(v) => set('decisions', v)}
          placeholder="Decision"
        />
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Action items</label>
          {formData.action_items.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {formData.action_items.map((item, i) => (
                <li
                  key={`${item.task}-${i}`}
                  className="flex items-center justify-between gap-2 text-[13px] text-slate-700 border border-slate-200 rounded-md px-3 py-2"
                >
                  <span>
                    {item.task}
                    {item.assignee ? ` · ${item.assignee}` : ''}
                  </span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 text-[12px]"
                    onClick={() =>
                      set(
                        'action_items',
                        formData.action_items.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              value={actionTask}
              onChange={(e) => setActionTask(e.target.value)}
              placeholder="Task"
            />
            <Input
              value={actionAssignee}
              onChange={(e) => setActionAssignee(e.target.value)}
              placeholder="Assignee"
            />
            <button
              type="button"
              className="px-3 py-2 text-[13px] font-medium border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              onClick={() => {
                if (!actionTask.trim()) return;
                set('action_items', [
                  ...formData.action_items,
                  {
                    task: actionTask.trim(),
                    assignee: actionAssignee.trim(),
                    due_date: '',
                    priority: 'medium',
                  },
                ]);
                setActionTask('');
                setActionAssignee('');
              }}
            >
              Add action
            </button>
          </div>
        </div>
        <Field label="Notes">
          <TextArea
            value={formData.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Discussion notes…"
          />
        </Field>
        <Field label="Next meeting">
          <Input
            type="date"
            value={formData.next_meeting}
            onChange={(e) => set('next_meeting', e.target.value)}
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
            onChange={(e) =>
              set('privacy_level', e.target.value as MeetingData['privacy_level'])
            }
            options={[
              { value: 'personal', label: 'Only me' },
              { value: 'team', label: 'My team' },
              { value: 'lab', label: 'My lab' },
              { value: 'institution', label: 'Institution' },
              { value: 'global', label: 'Public' },
            ]}
          />
        </Field>
      </FormSection>
    </NotebookFormModal>
  );
};

export default MeetingForm;
