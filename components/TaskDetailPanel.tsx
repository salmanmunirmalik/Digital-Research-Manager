import React, { useState } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  PaperclipIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PlusIcon
} from './icons';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import AssigneeAvatars from './AssigneeAvatars';
import DueDateIndicator from './DueDateIndicator';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'to_do' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string | null;
  assignee_id?: string | null;
  assignee_name?: string;
  assignee_avatar?: string;
  incomplete_subtasks?: number;
  total_subtasks?: number;
  comment_count?: number;
  progress_percentage?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
}

interface Comment {
  id: string;
  content: string;
  user_name?: string;
  user_avatar?: string;
  created_at: string;
}

interface TaskDetailPanelProps {
  task: Task | null;
  subtasks?: Subtask[];
  comments?: Comment[];
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  assignees?: Array<{ id: string; name: string; avatar_url?: string }>;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  subtasks = [],
  comments = [],
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onAddComment,
  assignees = []
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  React.useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
    }
  }, [task]);

  if (!task) {
    return null;
  }

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, {
        title: editTitle,
        description: editDescription
      });
      setIsEditing(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const totalSubtasks = subtasks.length;

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Task title"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(task.title);
                  setEditDescription(task.description || '');
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 flex-1">{task.title}</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
            {task.description && (
              <p className="text-gray-600 text-sm mt-2">{task.description}</p>
            )}
          </div>
        )}

        {/* Status and Priority */}
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value as any })}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value as any })}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="datetime-local"
            value={task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          {task.due_date && <DueDateIndicator dueDate={task.due_date} />}
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
          <select
            value={task.assignee_id || ''}
            onChange={(e) => onUpdate(task.id, { assignee_id: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </label>
          </div>
          <div className="space-y-2 mb-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <button
                  onClick={() => onToggleSubtask(subtask.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    subtask.is_completed
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-300'
                  }`}
                >
                  {subtask.is_completed && <CheckCircleIcon className="w-4 h-4 text-white" />}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    subtask.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Add subtask"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAddSubtask}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              Comments ({comments.length})
            </label>
          </div>
          <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {comment.user_avatar ? (
                    <img
                      src={comment.user_avatar}
                      alt={comment.user_name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                      {comment.user_name?.[0] || '?'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Post
            </button>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => onDelete(task.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Delete Task
        </button>
      </div>
    </div>
  );
};

export default TaskDetailPanel;

