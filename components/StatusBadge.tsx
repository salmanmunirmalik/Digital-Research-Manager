import React from 'react';

interface StatusBadgeProps {
  status: 'to_do' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    to_do: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'To Do' },
    in_progress: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'In Progress' },
    in_review: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'In Review' },
    done: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Done' },
    cancelled: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Cancelled' }
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


