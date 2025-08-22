import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
import { getUserDisplayName, getRoleDisplayName, getRolePermissions } from '../utils/roleAccess';

const SideNav: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Dashboard']));
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Get user permissions
  const userPermissions = user ? getRolePermissions(user.role) : null;

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
    const baseItems = [];

    // Dashboard - Available to all
    baseItems.push({
      title: 'Dashboard',
      items: [
        { name: 'Dashboard', to: '/dashboard', icon: HomeIcon, description: 'Personal dashboard and overview' },
        { name: 'My Notebook', to: '/lab-notebook', icon: BookOpenIcon, description: 'Personal experiment records and notes' }
      ]
    });

    // Data & Results - Available to all
    baseItems.push({
      title: 'Data & Results',
      items: [
        { name: 'Data & Results', to: '/data-results', icon: ChartBarIcon, description: 'Research data and analysis' },
        { name: 'Research Assistant', to: '/research-assistant', icon: LightbulbIcon, description: 'AI-powered research helper' },
        { name: 'Data Sharing', to: '/data-sharing', icon: DatabaseIcon, description: 'Global data sharing platform' }
      ]
    });

    // Tools & Resources - Available to all
    baseItems.push({
      title: 'Tools & Resources',
      items: [
        { name: 'Calculators', to: '/calculator-hub', icon: CalculatorIcon, description: 'Scientific calculators and unit conversion' },
        { name: 'Global Protocol Directory', to: '/protocols', icon: BeakerIcon, description: 'Research protocols and methods database' },
        { name: 'Conferences', to: '/conferences', icon: NewspaperIcon, description: 'Upcoming events and workshops' }
      ]
    });

    // Lab Management - Available to all
    baseItems.push({
      title: 'Lab Management',
      items: [
        { name: 'Lab Management', to: '/lab-management', icon: BeakerIcon, description: 'Manage lab resources, inventory, and protocols' }
      ]
    });

    // Collaboration - Available to all
    baseItems.push({
      title: 'Collaboration',
      items: [
        { name: 'Resource Exchange', to: '/resource-exchange', icon: UsersIcon, description: 'Share supplies and find shared instruments across labs' },
        { name: 'Help Forum', to: '/help-forum', icon: QuestionMarkCircleIcon, description: 'Community help and support' }
      ]
    });

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="h-full flex flex-col">
      {/* App Branding */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">DR</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900">Research Lab</h2>
            <p className="text-xs text-blue-600 font-medium">Digital Research Manager</p>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Items */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="group">
            {/* Section Header - Enhanced Design */}
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group-hover:bg-blue-50 border border-transparent hover:border-blue-200"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  expandedSections.has(section.title) ? 'rotate-180 text-blue-500' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Section Items - Enhanced Dropdown */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedSections.has(section.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-1 mt-3 ml-4 pl-4 border-l-2 border-gray-100">
                {section.items.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm transform scale-105'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:transform hover:scale-105'
                      }`
                    }
                    title={item.description}
                  >
                    <item.icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors duration-200 ${
                      'text-blue-600'
                    }`} />
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                    
                    {/* Enhanced Hover indicator */}
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                      'bg-blue-600'
                    }`}></div>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        ))}
      </nav>

      {/* Enhanced Bottom Section */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
        <div className="space-y-3">
          {/* System Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">System Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
          </div>
          
          {/* App Info */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 truncate">Digital Research Manager</span>
            <span className="flex-shrink-0 text-blue-600 font-semibold">v2.0</span>
          </div>
          
          {/* Quick Help */}
          <button className="w-full flex items-center justify-center px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need Help?
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNav;