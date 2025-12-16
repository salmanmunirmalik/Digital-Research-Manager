import React from 'react';

interface PriorityBadgeProps {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config = {
    low: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Low' },
    normal: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Normal' },
    high: { color: 'bg-orange-100 text-orange-700 border-orange-300', label: 'High' },
    urgent: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Urgent' }
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


