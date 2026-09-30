import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'to_do' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string | null;
  start_date?: string | null;
  assignee_id?: string | null;
  assignee_name?: string;
  assignee_avatar?: string;
  incomplete_subtasks?: number;
  total_subtasks?: number;
  comment_count?: number;
  progress_percentage?: number;
  tags?: string[];
}

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreateTask: (date?: string) => void;
  loading?: boolean;
}

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onTaskClick,
  loading = false,
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(year, month + (direction === 'next' ? 1 : -1), 1));
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => {
      const dueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null;
      const startDate = task.start_date
        ? new Date(task.start_date).toISOString().split('T')[0]
        : null;
      return dueDate === dateStr || startDate === dateStr;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-[15px] font-semibold text-slate-900">
            {monthNames[month]} {year}
          </h2>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm shadow-slate-100/50">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50/80"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-[6.5rem] border-r border-b border-slate-100 bg-slate-50/40"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const isToday = date.toDateString() === new Date().toDateString();
              const dayTasks = getTasksForDate(date);

              return (
                <div
                  key={day}
                  className={`min-h-[6.5rem] border-r border-b border-slate-100 p-1.5 transition-colors ${
                    isToday ? 'bg-sky-50/60' : 'bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <span
                      className={`text-[12px] font-medium tabular-nums ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] tabular-nums text-slate-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onTaskClick(task)}
                        className="w-full text-left text-[11px] px-1.5 py-0.5 bg-sky-50 text-sky-900 border border-sky-100 rounded-md hover:bg-sky-100 truncate"
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400 px-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCalendarView;
