import React from 'react';
import TaskCard from './TaskCard';
import { PlusIcon } from './icons';

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

interface TaskBoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreateTask: (status: string) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
  loading?: boolean;
}

const columns = [
  { id: 'to_do', label: 'To do', accent: 'bg-slate-400' },
  { id: 'in_progress', label: 'In progress', accent: 'bg-sky-500' },
  { id: 'in_review', label: 'In review', accent: 'bg-amber-500' },
  { id: 'done', label: 'Done', accent: 'bg-emerald-500' },
] as const;

const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
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

  return (
    <div className="flex-1 overflow-x-auto px-4 sm:px-6 py-4">
      <div className="flex gap-3 min-w-max h-full">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-[17.5rem] flex flex-col rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${column.accent}`} />
                  <span className="text-[13px] font-semibold text-slate-800">{column.label}</span>
                  <span className="text-[11px] tabular-nums text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateTask(column.id)}
                  className="p-1 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                  title="Add task"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[14rem] max-h-[calc(100vh-16rem)]">
                {columnTasks.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onCreateTask(column.id)}
                    className="w-full py-8 text-center rounded-lg border border-dashed border-slate-200 text-[12px] text-slate-400 hover:border-sky-200 hover:text-sky-700 hover:bg-sky-50/50 transition-colors"
                  >
                    Add task
                  </button>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      compact
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoardView;
