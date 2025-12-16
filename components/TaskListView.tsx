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

interface TaskListViewProps {
  tasks: Task[];
  groupBy?: 'status' | 'priority' | 'assignee' | null;
  onTaskClick: (task: Task) => void;
  onCreateTask: () => void;
  loading?: boolean;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  groupBy,
  onTaskClick,
  onCreateTask,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group tasks if groupBy is specified
  let groupedTasks: { [key: string]: Task[] } = {};
  if (groupBy) {
    tasks.forEach((task) => {
      const key = task[groupBy] || 'unassigned';
      if (!groupedTasks[key]) {
        groupedTasks[key] = [];
      }
      groupedTasks[key].push(task);
    });
  } else {
    groupedTasks = { all: tasks };
  }

  const groupLabels: { [key: string]: string } = {
    status: 'Status',
    priority: 'Priority',
    assignee: 'Assignee',
    to_do: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    unassigned: 'Unassigned',
    all: 'All Tasks'
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first task</p>
          <button
            onClick={onCreateTask}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-6 p-4">
          {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
            <div key={groupKey}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {groupLabels[groupKey] || groupKey} ({groupTasks.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListView;

