import React from 'react';

interface StatusBadgeProps {
  status: 'to_do' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    to_do: { color: 'bg-slate-50 text-slate-700 border-slate-200', label: 'To do' },
    in_progress: { color: 'bg-sky-50 text-sky-800 border-sky-100', label: 'In progress' },
    in_review: { color: 'bg-amber-50 text-amber-800 border-amber-100', label: 'In review' },
    done: { color: 'bg-emerald-50 text-emerald-800 border-emerald-100', label: 'Done' },
    cancelled: { color: 'bg-rose-50 text-rose-800 border-rose-100', label: 'Cancelled' }
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5'
  };

  const current = config[status];

  return (
    <span className={`inline-flex items-center rounded border font-medium ${current.color} ${sizeClasses[size]}`}>
      {current.label}
    </span>
  );
};

export default StatusBadge;


