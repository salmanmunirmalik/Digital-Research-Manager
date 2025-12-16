import React from 'react';
import { ClockIcon } from './icons';

interface DueDateIndicatorProps {
  dueDate: string | null;
  size?: 'sm' | 'md';
}

const DueDateIndicator: React.FC<DueDateIndicatorProps> = ({ dueDate, size = 'md' }) => {
  if (!dueDate) {
    return null;
  }

  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays >= 0 && diffDays <= 3;
  const isDueToday = diffDays === 0;

  let colorClass = 'text-gray-600';
  let bgClass = 'bg-gray-100';
  let urgencyText = '';

  if (isOverdue) {
    colorClass = 'text-red-700';
    bgClass = 'bg-red-100';
    urgencyText = 'Overdue';
  } else if (isDueToday) {
    colorClass = 'text-orange-700';
    bgClass = 'bg-orange-100';
    urgencyText = 'Due today';
  } else if (isDueSoon) {
    colorClass = 'text-yellow-700';
    bgClass = 'bg-yellow-100';
    urgencyText = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    urgencyText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded ${bgClass} ${colorClass} ${sizeClasses[size]} font-medium`}>
      <ClockIcon className="w-3 h-3" />
      {urgencyText}
    </span>
  );
};

export default DueDateIndicator;


