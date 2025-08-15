import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  BookOpenIcon, 
  BeakerIcon, 
  ClipboardListIcon, 
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  SparklesIcon,
  DatabaseIcon,
  PresentationChartLineIcon,
  CalendarDaysIcon,
  NewspaperIcon,
  BuildingOfficeIcon,
  CalculatorIcon,
  SearchIcon,
  LightbulbIcon,
  BarChart3Icon,
  SettingsIcon
} from './icons';

const SideNav: React.FC = () => {
  // Demo mode - use mock role for full access
  const userRole = 'Principal Investigator';

  const getNavItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        items: [
          { name: 'Overview', to: '/dashboard', icon: HomeIcon, description: 'Personal dashboard and overview' }
        ]
      },
      {
        title: 'Lab Management',
        items: [
          { name: 'Lab Management', to: '/lab-management', icon: BuildingOfficeIcon, description: 'Manage labs and team members' },
          { name: 'Protocols', to: '/protocols', icon: BeakerIcon, description: 'Research protocols and methods' },
          { name: 'Lab Notebook', to: '/lab-notebook', icon: BookOpenIcon, description: 'Experiment records and notes' },
          { name: 'Inventory', to: '/inventory', icon: ClipboardListIcon, description: 'Lab supplies and materials' },
          { name: 'Instruments', to: '/instruments', icon: ClockIcon, description: 'Equipment booking and management' }
        ]
      },
      {
        title: 'Research Intelligence',
        items: [
          { name: 'Data & Results', to: '/research-intelligence', icon: ChartBarIcon, description: 'Research data and analysis' },
          { name: 'Research Assistant', to: '/research-assistant', icon: LightbulbIcon, description: 'AI-powered research helper' }
        ]
      },
      {
        title: 'Tools & Resources',
        items: [
          { name: 'Calculator Hub', to: '/calculator-hub', icon: CalculatorIcon, description: 'Scientific calculators for lab work' },
          { name: 'Unit Converter', to: '/unit-converter', icon: SettingsIcon, description: 'Convert between measurement units' }
        ]
      },
      {
        title: 'Collaboration',
        items: [
          { name: 'Data Sharing', to: '/data-sharing', icon: DatabaseIcon, description: 'Global data sharing platform' },
          { name: 'Help Forum', to: '/help-forum', icon: QuestionMarkCircleIcon, description: 'Community help and support' },
          { name: 'Conferences', to: '/conferences', icon: NewspaperIcon, description: 'Upcoming events and workshops' }
        ]
      }
    ];



    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="h-full flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              Demo User
            </p>
            <p className="text-xs text-gray-500 truncate">
              Principal Investigator
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 md:mb-3 px-2 md:px-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <NavLink
                  key={itemIndex}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 md:px-3 py-2 md:py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  title={item.description}
                >
                  <item.icon className={`w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3 flex-shrink-0 ${
                    'text-blue-600' // Active state color
                  }`} />
                  <span className="flex-1 min-w-0 truncate">{item.name}</span>
                  
                  {/* Hover indicator */}
                  <div className={`w-1 h-1 rounded-full transition-all duration-200 flex-shrink-0 ${
                    'bg-blue-600' // Active state
                  }`}></div>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 md:p-4 border-t border-gray-200 bg-white/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">Digital Research Manager</span>
          <span className="flex-shrink-0">v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default SideNav;