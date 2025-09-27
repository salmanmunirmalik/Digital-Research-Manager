import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TagIcon
} from '../components/icons';

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
  status: 'pending' | 'in_progress' | 'completed';
}

const MeetingForm: React.FC<MeetingFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MeetingData>({
    title: '',
    description: '',
    meeting_type: 'lab_meeting',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    attendees: [''],
    agenda_items: [],
    action_items: [],
    decisions: [''],
    next_meeting: '',
    notes: '',
    tags: [''],
    lab_id: '',
    privacy_level: 'lab',
    ...initialData
  });

  const [newItem, setNewItem] = useState({
    attendee: '',
    decision: '',
    tag: ''
  });

  const meetingTypes = [
    { value: 'lab_meeting', label: 'Lab Meeting' },
    { value: 'project_review', label: 'Project Review' },
    { value: 'collaboration', label: 'Collaboration Meeting' },
    { value: 'seminar', label: 'Seminar/Presentation' },
    { value: 'committee', label: 'Committee Meeting' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: keyof MeetingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemAdd = (field: keyof MeetingData, item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), item.trim()]
      }));
    }
  };

  const handleArrayItemRemove = (field: keyof MeetingData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleAgendaItemAdd = () => {
    setFormData(prev => ({
      ...prev,
      agenda_items: [...prev.agenda_items, {
        title: '',
        description: '',
        duration_minutes: 15,
        presenter: ''
      }]
    }));
  };

  const handleAgendaItemUpdate = (index: number, field: keyof AgendaItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      agenda_items: prev.agenda_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAgendaItemRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda_items: prev.agenda_items.filter((_, i) => i !== index)
    }));
  };

  const handleActionItemAdd = () => {
    setFormData(prev => ({
      ...prev,
      action_items: [...prev.action_items, {
        task: '',
        assignee: '',
        due_date: '',
        priority: 'medium',
        status: 'pending'
      }]
    }));
  };

  const handleActionItemUpdate = (index: number, field: keyof ActionItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleActionItemRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="w-6 h-6 mr-2 text-blue-500" />
              New Meeting Entry
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Meeting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Weekly Lab Meeting, Project Review"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the meeting purpose..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type *</label>
                    <Select
                      value={formData.meeting_type}
                      onChange={(e) => handleInputChange('meeting_type', e.target.value)}
                      options={meetingTypes}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Conference Room A, Zoom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card>
              <CardHeader>
                <CardTitle>Attendees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.attendees.map((attendee, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={attendee}
                      onChange={(e) => {
                        const newAttendees = [...formData.attendees];
                        newAttendees[index] = e.target.value;
                        handleInputChange('attendees', newAttendees);
                      }}
                      placeholder="Attendee name or email"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleArrayItemRemove('attendees', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={newItem.attendee}
                    onChange={(e) => setNewItem(prev => ({ ...prev, attendee: e.target.value }))}
                    placeholder="Add attendee"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleArrayItemAdd('attendees', newItem.attendee);
                      setNewItem(prev => ({ ...prev, attendee: '' }));
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agenda */}
            <Card>
              <CardHeader>
                <CardTitle>Meeting Agenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.agenda_items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <Input
                        value={item.title}
                        onChange={(e) => handleAgendaItemUpdate(index, 'title', e.target.value)}
                        placeholder="Agenda item title"
                      />
                      <Input
                        type="number"
                        value={item.duration_minutes}
                        onChange={(e) => handleAgendaItemUpdate(index, 'duration_minutes', parseInt(e.target.value))}
                        placeholder="Duration (min)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAgendaItemRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <textarea
                        value={item.description}
                        onChange={(e) => handleAgendaItemUpdate(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Description"
                      />
                      <Input
                        value={item.presenter || ''}
                        onChange={(e) => handleAgendaItemUpdate(index, 'presenter', e.target.value)}
                        placeholder="Presenter (optional)"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAgendaItemAdd}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Agenda Item
                </Button>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.action_items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <Input
                        value={item.task}
                        onChange={(e) => handleActionItemUpdate(index, 'task', e.target.value)}
                        placeholder="Task description"
                      />
                      <Input
                        value={item.assignee}
                        onChange={(e) => handleActionItemUpdate(index, 'assignee', e.target.value)}
                        placeholder="Assignee"
                      />
                      <Input
                        type="date"
                        value={item.due_date}
                        onChange={(e) => handleActionItemUpdate(index, 'due_date', e.target.value)}
                        placeholder="Due date"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleActionItemRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Select
                        value={item.priority}
                        onChange={(e) => handleActionItemUpdate(index, 'priority', e.target.value)}
                        options={[
                          { value: 'low', label: 'Low Priority' },
                          { value: 'medium', label: 'Medium Priority' },
                          { value: 'high', label: 'High Priority' }
                        ]}
                      />
                      <Select
                        value={item.status}
                        onChange={(e) => handleActionItemUpdate(index, 'status', e.target.value)}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'in_progress', label: 'In Progress' },
                          { value: 'completed', label: 'Completed' }
                        ]}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleActionItemAdd}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Action Item
                </Button>
              </CardContent>
            </Card>

            {/* Decisions and Follow-up */}
            <Card>
              <CardHeader>
                <CardTitle>Decisions & Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Decisions</label>
                  {formData.decisions.map((decision, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <Input
                        value={decision}
                        onChange={(e) => {
                          const newDecisions = [...formData.decisions];
                          newDecisions[index] = e.target.value;
                          handleInputChange('decisions', newDecisions);
                        }}
                        placeholder="Decision made"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleArrayItemRemove('decisions', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.decision}
                      onChange={(e) => setNewItem(prev => ({ ...prev, decision: e.target.value }))}
                      placeholder="Add decision"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('decisions', newItem.decision);
                        setNewItem(prev => ({ ...prev, decision: '' }));
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Meeting</label>
                  <Input
                    type="date"
                    value={formData.next_meeting}
                    onChange={(e) => handleInputChange('next_meeting', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Additional notes, observations, or important points discussed..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags and Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleArrayItemRemove('tags', index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newItem.tag}
                      onChange={(e) => setNewItem(prev => ({ ...prev, tag: e.target.value }))}
                      placeholder="Add tag"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleArrayItemAdd('tags', newItem.tag);
                        setNewItem(prev => ({ ...prev, tag: '' }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
                  <Select
                    value={formData.privacy_level}
                    onChange={(e) => handleInputChange('privacy_level', e.target.value)}
                    options={[
                      { value: 'personal', label: 'Only Me' },
                      { value: 'team', label: 'My Team' },
                      { value: 'lab', label: 'My Lab' },
                      { value: 'institution', label: 'My Institution' },
                      { value: 'global', label: 'Global (Public)' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Save Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingForm;
