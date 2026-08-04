import React, { useState } from 'react';
import { XMarkIcon } from './icons';
import { useEntityOptions } from '../hooks/useEntityOptions';
import EntityLinkSelect from './EntityLinkSelect';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    assignee_id?: string;
    protocol_id?: string;
    workspace_id?: string;
  }) => void;
  assignees?: Array<{ id: string; name: string; avatar_url?: string }>;
  defaultStatus?: string;
  workspaceId?: string;
  defaultAssigneeId?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assignees = [],
  defaultStatus = 'to_do',
  workspaceId,
  defaultAssigneeId = '',
}) => {
  const { protocols } = useEntityOptions(['protocols']);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'normal',
    due_date: '',
    assignee_id: defaultAssigneeId,
    protocol_id: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date || undefined,
      assignee_id: formData.assignee_id || undefined,
      protocol_id: formData.protocol_id || undefined,
      workspace_id: workspaceId,
    });

    setFormData({
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'normal',
      due_date: '',
      assignee_id: defaultAssigneeId,
      protocol_id: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Assign a task</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Capture work and put it on someone’s plate - no folders required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">
              What needs doing <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              placeholder="e.g. Restock PBS buffer, book confocal for Friday…"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">
              Assign to
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignee_id: '' })}
                className={`px-2.5 py-1 text-[12px] rounded-full border transition-colors ${
                  !formData.assignee_id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                Unassigned pool
              </button>
              {assignees.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, assignee_id: a.id })}
                  className={`px-2.5 py-1 text-[12px] rounded-full border transition-colors ${
                    formData.assignee_id === a.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {a.name.split(' ')[0] || a.name}
                </button>
              ))}
            </div>
            {assignees.length > 8 && (
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md"
              >
                <option value="">Unassigned pool</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Context, links, acceptance criteria…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Due</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md"
              >
                <option value="to_do">To do</option>
                <option value="in_progress">In progress</option>
                <option value="in_review">In review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">
                Linked protocol
              </label>
              <EntityLinkSelect
                value={formData.protocol_id}
                options={protocols}
                onChange={(id) => setFormData({ ...formData, protocol_id: id })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-[13px] font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              {formData.assignee_id ? 'Assign task' : 'Add to pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
