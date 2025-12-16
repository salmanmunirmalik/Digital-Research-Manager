import React from 'react';
import TaskCard from './TaskCard';
import { PlusIcon } from './icons';
import StatusBadge from './StatusBadge';

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

const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  onTaskClick,
  onCreateTask,
  onTaskMove,
  loading = false
}) => {
  const columns = [
    { id: 'to_do', label: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
    { id: 'in_review', label: 'In Review', color: 'bg-yellow-100' },
    { id: 'done', label: 'Done', color: 'bg-green-100' }
  ];

  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id);
    return acc;
  }, {} as { [key: string]: Task[] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={column.id as any} />
                  <span className="text-sm text-gray-500">({columnTasks.length})</span>
                </div>
                <button
                  onClick={() => onCreateTask(column.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                  title="Add task"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-2 min-h-[200px]">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="mb-2">No tasks</p>
                    <button
                      onClick={() => onCreateTask(column.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      + Add task
                    </button>
                  </div>
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

