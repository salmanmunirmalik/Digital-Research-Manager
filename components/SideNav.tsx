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
  BrainCircuitIcon,
  DnaIcon
} from './icons';
import { getUserDisplayName, getRoleDisplayName, getRolePermissions } from '../utils/roleAccess';

interface SideNavProps {
  onMobileLinkClick?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ onMobileLinkClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Research Workflow']));
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

    // Research Workflow - Core research activities
    baseItems.push({
      title: 'Research Workflow',
      items: [
        { 
          name: 'Lab Notebook', 
          to: '/lab-notebook', 
          icon: BookOpenIcon, 
          description: 'Experiment workspace and detailed documentation',
          color: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-600'
        },
        { 
          name: 'Protocols', 
          to: '/protocols', 
          icon: BeakerIcon, 
          description: 'Research protocols and methods database',
          color: 'from-green-500 to-green-600',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          iconColor: 'text-green-600'
        },
        { 
          name: 'Data & Results', 
          to: '/data-results', 
          icon: ChartBarIcon, 
          description: 'Research data and analysis',
          color: 'from-purple-500 to-purple-600',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          iconColor: 'text-purple-600'
        }
      ]
    });

    // Lab Management - Lab operations and resources
    baseItems.push({
      title: 'Lab Management',
      items: [
        { 
          name: 'Lab Management', 
          to: '/lab-management', 
          icon: BuildingOfficeIcon, 
          description: 'Manage lab resources and operations',
          color: 'from-orange-500 to-orange-600',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          iconColor: 'text-orange-600'
        }
      ]
    });

    // Tools & Calculators - Scientific tools and utilities
    baseItems.push({
      title: 'Tools & Calculators',
      items: [
        { 
          name: 'Calculator Hub', 
          to: '/calculator-hub', 
          icon: CalculatorIcon, 
          description: 'Scientific calculators and unit conversion',
          color: 'from-indigo-500 to-indigo-600',
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-700',
          iconColor: 'text-indigo-600'
        },
        { 
          name: 'Research Assistant', 
          to: '/research-assistant', 
          icon: LightbulbIcon, 
          description: 'AI-powered research help and literature search',
          color: 'from-yellow-500 to-yellow-600',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-600'
        },
        { 
          name: 'Automated Presentations', 
          to: '/presentations', 
          icon: PresentationChartLineIcon, 
          description: 'AI-generated research presentations',
          color: 'from-pink-500 to-pink-600',
          bgColor: 'bg-pink-50',
          textColor: 'text-pink-700',
          iconColor: 'text-pink-600'
        }
      ]
    });

    // System - User settings and automation
    baseItems.push({
      title: 'System',
      items: [
        { 
          name: 'Profile', 
          to: '/profile', 
          icon: UserIcon, 
          description: 'User profile and preferences',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          iconColor: 'text-gray-600'
        },
        { 
          name: 'Settings', 
          to: '/settings', 
          icon: SettingsIcon, 
          description: 'Application settings and configuration',
          color: 'from-slate-500 to-slate-600',
          bgColor: 'bg-slate-50',
          textColor: 'text-slate-700',
          iconColor: 'text-slate-600'
        }
      ]
    });

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100">
      {/* Modern Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">DR</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Research Manager</h1>
            <p className="text-xs text-gray-500">Digital Lab Platform</p>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Items */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="group">
            {/* Section Header - Modern Design */}
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group-hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  expandedSections.has(section.title) ? 'rotate-180 text-gray-600' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Section Items - Modern Dropdown */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedSections.has(section.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-2 mt-3 ml-6 pl-4 border-l-2 border-gray-100">
                {section.items.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.to}
                    onClick={onMobileLinkClick}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? `${item.bgColor} ${item.textColor} border border-gray-200 shadow-sm transform scale-105`
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:transform hover:scale-105'
                      }`
                    }
                    title={item.description}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                      'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <item.icon className={`w-4 h-4 transition-colors duration-200 ${
                        'text-gray-600'
                      }`} />
                    </div>
                    <span className="flex-1 min-w-0 truncate font-medium">{item.name}</span>
                    
                    {/* Modern Hover indicator */}
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                      'bg-gray-300 group-hover:bg-gray-400'
                    }`}></div>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        ))}
      </nav>

      {/* Modern Bottom Section */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
        <div className="space-y-3">
          {/* System Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">System Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
          </div>
          
          {/* App Info */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 truncate">Version</span>
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