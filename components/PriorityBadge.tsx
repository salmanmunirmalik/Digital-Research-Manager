import React from 'react';

interface PriorityBadgeProps {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config = {
    low: { color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Low' },
    normal: { color: 'bg-sky-50 text-sky-800 border-sky-100', label: 'Normal' },
    high: { color: 'bg-orange-50 text-orange-800 border-orange-100', label: 'High' },
    urgent: { color: 'bg-rose-50 text-rose-800 border-rose-100', label: 'Urgent' }
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5'
  };

  const current = config[priority];

  return (
    <span className={`inline-flex items-center rounded border font-medium ${current.color} ${sizeClasses[size]}`}>
      {current.label}
    </span>
  );
};

export default PriorityBadge;


