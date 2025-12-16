import React from 'react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import AssigneeAvatars from './AssigneeAvatars';
import DueDateIndicator from './DueDateIndicator';
import { CheckCircleIcon } from './icons';

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
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, compact = false }) => {
  const assignees = task.assignee_id ? [{
    id: task.assignee_id,
    name: task.assignee_name || 'Assignee',
    avatar_url: task.assignee_avatar
  }] : [];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${
        compact ? 'p-2' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'} line-clamp-2`}>
            {task.title}
          </h3>
        </div>
        {task.status === 'done' && (
          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      {!compact && task.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {task.progress_percentage !== undefined && task.progress_percentage > 0 && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${task.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks Progress */}
      {task.total_subtasks !== undefined && task.total_subtasks > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
          <CheckCircleIcon className="w-4 h-4" />
          <span>
            {task.total_subtasks - (task.incomplete_subtasks || 0)}/{task.total_subtasks} subtasks
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} size="sm" />
          <PriorityBadge priority={task.priority} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <DueDateIndicator dueDate={task.due_date} size="sm" />
          )}
          {assignees.length > 0 && (
            <AssigneeAvatars assignees={assignees} size="sm" maxVisible={1} />
          )}
          {task.comment_count !== undefined && task.comment_count > 0 && (
            <span className="text-xs text-gray-500">
              💬 {task.comment_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;


