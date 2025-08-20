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
    const baseItems = [
      {
        title: 'Dashboard',
        items: [
          { name: 'Dashboard', to: '/dashboard', icon: HomeIcon, description: 'Personal dashboard and overview' }
        ]
      }
    ];

    // Lab Management - Only for PI and Admin
    if (userPermissions?.canManageLabs) {
      baseItems.push({
        title: 'Lab Management',
        items: [
          { name: 'Lab Management', to: '/lab-management', icon: BuildingOfficeIcon, description: 'Manage labs and team members' }
        ]
      });
    }

    // Data & Results - Available to all
    baseItems.push({
      title: 'Data & Results',
      items: [
        { name: 'Data & Results', to: '/data-results', icon: ChartBarIcon, description: 'Research data and analysis' },
        { name: 'My Notebook', to: '/lab-notebook', icon: BookOpenIcon, description: 'Personal experiment records and notes' }
      ]
    });

    // Tools & Resources - Available to all
    baseItems.push({
      title: 'Tools & Resources',
      items: [
        { name: 'Calculators', to: '/calculator-hub', icon: CalculatorIcon, description: 'Scientific calculators and unit conversion' },
        { name: 'Global Protocol Directory', to: '/protocols', icon: BeakerIcon, description: 'Research protocols and methods database' },
        { name: 'Research Assistant', to: '/research-assistant', icon: LightbulbIcon, description: 'AI-powered research helper' }
      ]
    });

    // Collaboration - Available to all
    baseItems.push({
      title: 'Collaboration',
      items: [
        { name: 'Data Sharing', to: '/data-sharing', icon: DatabaseIcon, description: 'Global data sharing platform' },
        { name: 'Help Forum', to: '/help-forum', icon: QuestionMarkCircleIcon, description: 'Community help and support' },
        { name: 'Conferences', to: '/conferences', icon: NewspaperIcon, description: 'Upcoming events and workshops' }
      ]
    });

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced User Profile Section */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="relative">
          <button
            onClick={() => setShowUserProfile(!showUserProfile)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/60 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
              <span className="text-white text-lg font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {getUserDisplayName(user)}
              </p>
              <p className="text-xs text-blue-600 font-medium truncate">
                {getRoleDisplayName(user?.role)}
              </p>
              <p className="text-xs text-gray-500 truncate mt-1">
                {user?.email}
              </p>
            </div>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserProfile ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Profile Dropdown */}
          {showUserProfile && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              {/* Quick Stats */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-600">12</p>
                    <p className="text-xs text-blue-600">Protocols</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-600">8</p>
                    <p className="text-xs text-green-600">Experiments</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-2 py-2">
                <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </button>
                <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-2"></div>

              {/* Logout */}
              <div className="px-2">
                <button className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
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