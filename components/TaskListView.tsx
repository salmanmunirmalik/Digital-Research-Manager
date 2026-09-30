import React from 'react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import DueDateIndicator from './DueDateIndicator';
import { ClipboardListIcon, PlusIcon } from './icons';

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

interface TaskListViewProps {
  tasks: Task[];
  groupBy?: 'status' | 'priority' | 'assignee' | null;
  onTaskClick: (task: Task) => void;
  onCreateTask: () => void;
  loading?: boolean;
}

const groupLabels: Record<string, string> = {
  to_do: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
  cancelled: 'Cancelled',
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
  unassigned: 'Unassigned',
  all: 'All tasks',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  groupBy,
  onTaskClick,
  onCreateTask,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  let groupedTasks: Record<string, Task[]> = {};
  if (groupBy) {
    tasks.forEach((task) => {
      let key: string;
      if (groupBy === 'assignee') {
        key = task.assignee_name || task.assignee_id || 'unassigned';
      } else {
        key = String((task as unknown as Record<string, unknown>)[groupBy] || 'unassigned');
      }
      if (!groupedTasks[key]) groupedTasks[key] = [];
      groupedTasks[key].push(task);
    });
  } else {
    groupedTasks = { all: tasks };
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[20rem] text-center px-6 py-12">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/60 flex items-center justify-center mb-4">
          <ClipboardListIcon className="w-6 h-6" />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No tasks yet</h3>
        <p className="text-[13px] text-slate-500 max-w-sm mb-5">
          Track experiments, reviews, and lab chores in one list. Create a task to get started.
        </p>
        <button
          type="button"
          onClick={onCreateTask}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New task
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      <div className="space-y-6 max-w-5xl mx-auto">
        {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
          <section key={groupKey}>
            {groupBy && (
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  {groupLabels[groupKey] || groupKey}
                </h3>
                <span className="text-[11px] text-slate-400 tabular-nums">{groupTasks.length}</span>
              </div>
            )}
            <ul className="bg-white border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
              {groupTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-sky-50/40 transition-colors group"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        task.status === 'done'
                          ? 'bg-emerald-500'
                          : task.status === 'in_progress'
                            ? 'bg-sky-500'
                            : task.status === 'in_review'
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-slate-900 group-hover:text-sky-900 truncate">
                          {task.title}
                        </span>
                        <StatusBadge status={task.status} size="sm" />
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>
                      {task.description && (
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      {task.due_date && <DueDateIndicator dueDate={task.due_date} size="sm" />}
                      {task.assignee_name ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-center">
                            {getInitials(task.assignee_name)}
                          </span>
                          <span className="max-w-[7rem] truncate">{task.assignee_name}</span>
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-400">Unassigned</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default TaskListView;
