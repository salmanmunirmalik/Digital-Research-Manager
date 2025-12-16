import React from 'react';
import { 
  ListBulletIcon, 
  Squares2X2Icon, 
  CalendarIcon,
  TableCellsIcon
} from './icons';

export type ViewType = 'list' | 'board' | 'calendar' | 'table';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const views: { type: ViewType; icon: React.ComponentType<any>; label: string }[] = [
    { type: 'list', icon: ListBulletIcon, label: 'List' },
    { type: 'board', icon: Squares2X2Icon, label: 'Board' },
    { type: 'calendar', icon: CalendarIcon, label: 'Calendar' },
    { type: 'table', icon: TableCellsIcon, label: 'Table' }
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.type;
        
        return (
          <button
            key={view.type}
            onClick={() => onViewChange(view.type)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={view.label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewSwitcher;


