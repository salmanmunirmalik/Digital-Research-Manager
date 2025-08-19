import React, { useState } from 'react';
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
  BarChartIcon,
  SettingsIcon,
  RocketIcon,
  BrainCircuitIcon
} from './icons';

const SideNav: React.FC = () => {
  // Demo mode - use mock role for full access
  const userRole = 'Principal Investigator';

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Dashboard']));

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const getNavItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        items: [
          { name: 'Dashboard', to: '/dashboard', icon: HomeIcon, description: 'Personal dashboard and overview' }
        ]
      },
      {
        title: 'Lab Management',
        items: [
          { name: 'Lab Management', to: '/lab-management', icon: BuildingOfficeIcon, description: 'Manage labs and team members' }
        ]
      },
      {
        title: 'Data & Results',
        items: [
          { name: 'Data & Results', to: '/data-results', icon: ChartBarIcon, description: 'Research data and analysis' },
          { name: 'My Notebook', to: '/lab-notebook', icon: BookOpenIcon, description: 'Personal experiment records and notes' },
          { name: 'Research Assistant', to: '/research-assistant', icon: LightbulbIcon, description: 'AI-powered research helper' }
        ]
      },
      {
        title: 'Tools & Resources',
        items: [
          { name: 'Calculators', to: '/calculator-hub', icon: CalculatorIcon, description: 'Scientific calculators and unit conversion' },
          { name: 'Global Protocol Directory', to: '/protocols', icon: BeakerIcon, description: 'Research protocols and methods database' }
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
      <nav className="flex-1 p-3 md:p-4 space-y-2 md:space-y-3 overflow-y-auto">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="group">
            {/* Section Header - Clickable for dropdown */}
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-2 md:px-3 py-2 md:py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group-hover:bg-gray-50"
            >
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  expandedSections.has(section.title) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Section Items - Animated Dropdown */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedSections.has(section.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-1 mt-2 ml-2">
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