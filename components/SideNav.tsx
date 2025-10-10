import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  BarChartIcon,
  SettingsIcon,
  RocketIcon,
  BrainCircuitIcon,
  DnaIcon,
  PackageIcon
} from './icons';
import { getUserDisplayName, getRoleDisplayName, getRolePermissions } from '../utils/roleAccess';

interface SideNavProps {
  onMobileLinkClick?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ onMobileLinkClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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
    return [
      { 
        name: 'Lab Notebook', 
        to: '/lab-notebook', 
        icon: BookOpenIcon, 
        description: 'Experiment workspace and detailed documentation',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      },
      { 
        name: 'Protocols', 
        to: '/protocols', 
        icon: BeakerIcon, 
        description: 'Research protocols and methods database',
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )
      },
      { 
        name: 'Data & Results', 
        to: '/data-results', 
        icon: ChartBarIcon, 
        description: 'Research data and analysis',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      { 
        name: 'Research Tools', 
        to: '/research-tools', 
        icon: CalculatorIcon, 
        description: 'Scientific calculators and unit conversion',
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      },
      { 
        name: 'Statistical Analysis Tools', 
        to: '/statistical-analysis-tools', 
        icon: BarChartIcon, 
        description: 'Advanced statistical analysis and data mining',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      { 
        name: 'Research Assistant', 
        to: '/research-assistant', 
        icon: LightbulbIcon, 
        description: 'AI-powered research help and literature search',
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      { 
        name: 'Supplier Marketplace', 
        to: '/supplier-marketplace', 
        icon: PackageIcon, 
        description: 'Find research suppliers and materials',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      },
      { 
        name: 'Lab Management', 
        to: '/lab-management', 
        icon: BuildingOfficeIcon, 
        description: 'Manage lab resources and operations',
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      },
      { 
        name: 'Profile', 
        to: '/profile', 
        icon: UserIcon, 
        description: 'User profile and preferences',
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600',
        iconBg: 'bg-gray-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      },
      { 
        name: 'Settings', 
        to: '/settings', 
        icon: SettingsIcon, 
        description: 'Application settings and configuration',
        color: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-700',
        iconColor: 'text-slate-600',
        iconBg: 'bg-slate-100',
        iconSvg: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Modern Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex flex-col items-center space-y-2">
          <Link to="/" className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-xl">
            <span className="text-white font-bold text-lg">DR</span>
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-900 transition-all duration-300 hover:text-blue-600">Research Manager</h1>
            <p className="text-xs text-gray-500 transition-all duration-300 hover:text-gray-700">Digital Lab Platform</p>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Items */}
      <nav className="flex-1 p-2 overflow-y-auto">
              <div className="space-y-1">
          {navItems.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.to}
                    onClick={onMobileLinkClick}
                    className={({ isActive }) =>
                `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md ${
                        isActive
                    ? `${item.bgColor} ${item.textColor} border border-gray-200 shadow-lg scale-105`
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                    title={item.description}
              style={{
                animationDelay: `${itemIndex * 50}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 ease-in-out ${
                item.iconBg || 'bg-gray-100'
              } group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`}>
                {item.iconSvg || <item.icon className={`w-4 h-4 transition-all duration-300 ${
                  item.iconColor || 'text-gray-600'
                } group-hover:scale-110`} />}
              </div>
              <span className="text-sm font-medium leading-tight transition-all duration-300 group-hover:translate-x-1">
                {item.name}
                    </span>
              <div className={`ml-auto w-2 h-2 rounded-full transition-all duration-300 ${
                item.iconColor ? item.iconColor.replace('text-', 'bg-') : 'bg-gray-300'
              } group-hover:scale-125 group-hover:opacity-80`}></div>
                      </NavLink>
                    ))}
                  </div>
      </nav>

      {/* Modern Bottom Section */}
      <div className="p-2 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
        <div className="space-y-1">
          {/* System Status */}
          <div className="flex items-center justify-between text-xs transition-all duration-300 hover:bg-white hover:rounded-lg hover:px-2 hover:py-1">
            <span className="text-gray-600 font-medium">Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse transition-all duration-300 hover:scale-125"></div>
              <span className="text-green-600 font-medium transition-all duration-300 hover:text-green-700">Online</span>
            </div>
          </div>
          
          {/* App Info */}
          <div className="flex items-center justify-between text-xs transition-all duration-300 hover:bg-white hover:rounded-lg hover:px-2 hover:py-1">
            <span className="text-gray-500 truncate">Version</span>
            <span className="flex-shrink-0 text-blue-600 font-semibold transition-all duration-300 hover:text-blue-700 hover:scale-110">v2.0</span>
          </div>
          
          {/* Quick Help */}
          <button className="w-full flex items-center justify-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md">
            <svg className="w-3 h-3 mr-1 transition-all duration-300 hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNav;