import React from 'react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import AssigneeAvatars from './AssigneeAvatars';
import DueDateIndicator from './DueDateIndicator';
import { CheckCircleIcon, ChatBubbleLeftRightIcon } from './icons';

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
  const assignees = task.assignee_id
    ? [
        {
          id: task.assignee_id,
          name: task.assignee_name || 'Assignee',
          avatar_url: task.assignee_avatar,
        },
      ]
    : [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-200/80 rounded-xl transition-all hover:border-sky-200 hover:shadow-sm hover:shadow-sky-100/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
        compact ? 'p-3' : 'p-3.5'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3
          className={`font-medium text-slate-900 leading-snug line-clamp-2 ${
            compact ? 'text-[13px]' : 'text-[14px]'
          }`}
        >
          {task.title}
        </h3>
        {task.status === 'done' && (
          <CheckCircleIcon className="w-4.5 h-4.5 w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        )}
      </div>

      {!compact && task.description && (
        <p className="text-[12px] text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-slate-50 text-slate-600 border border-slate-100"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[11px] text-slate-400">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {typeof task.progress_percentage === 'number' && task.progress_percentage > 0 && (
        <div className="mb-2.5">
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div
              className="bg-sky-600 h-1 rounded-full transition-all"
              style={{ width: `${task.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {typeof task.total_subtasks === 'number' && task.total_subtasks > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          <span>
            {(task.total_subtasks || 0) - (task.incomplete_subtasks || 0)}/{task.total_subtasks}{' '}
            subtasks
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={task.status} size="sm" />
          <PriorityBadge priority={task.priority} size="sm" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.due_date && <DueDateIndicator dueDate={task.due_date} size="sm" />}
          {assignees.length > 0 && (
            <AssigneeAvatars assignees={assignees} size="sm" maxVisible={1} />
          )}
          {typeof task.comment_count === 'number' && task.comment_count > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              {task.comment_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default TaskCard;
