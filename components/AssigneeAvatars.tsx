import React from 'react';

interface Assignee {
  id: string;
  name?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
}

interface AssigneeAvatarsProps {
  assignees: Assignee[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

const AssigneeAvatars: React.FC<AssigneeAvatarsProps> = ({ 
  assignees, 
  maxVisible = 3,
  size = 'md'
}) => {
  if (!assignees || assignees.length === 0) {
    return null;
  }

  const visible = assignees.slice(0, maxVisible);
  const remaining = assignees.length - maxVisible;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getInitials = (assignee: Assignee) => {
    if (assignee.name) {
      return assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (assignee.first_name && assignee.last_name) {
      return `${assignee.first_name[0]}${assignee.last_name[0]}`.toUpperCase();
    }
    return '?';
  };

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((assignee, index) => (
        <div
          key={assignee.id || index}
          className={`${sizeClasses[size]} rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm`}
          title={assignee.name || `${assignee.first_name} ${assignee.last_name}`}
        >
          {assignee.avatar_url ? (
            <img
              src={assignee.avatar_url}
              alt={assignee.name || 'Assignee'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(assignee)
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white font-medium shadow-sm`}
          title={`${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default AssigneeAvatars;


