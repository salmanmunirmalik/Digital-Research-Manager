import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  BookOpenIcon,
  BeakerIcon,
  ChartBarIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  PresentationChartLineIcon,
  UsersIcon,
  DatabaseIcon,
  PackageIcon,
  CogIcon,
  HeartIcon,
} from './icons';

interface SideNavProps {
  onMobileLinkClick?: () => void;
}

interface NavItem {
  name: string;
  to: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  description: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      {
        name: 'Dashboard',
        to: '/dashboard',
        icon: PresentationChartLineIcon,
        description: 'Overview of your research activities',
      },
      {
        name: 'Personal notebook',
        to: '/lab-notebook',
        icon: BookOpenIcon,
        description: 'Document experiments, ideas, and lab notes',
      },
      {
        name: 'Protocol library',
        to: '/protocols',
        icon: BeakerIcon,
        description: 'Reusable methods, SOPs, and step execution',
      },
      {
        name: 'My data & results',
        to: '/data-results',
        icon: ChartBarIcon,
        description: 'Your files, figures, and analysis artifacts',
      },
    ],
  },
  {
    label: 'Lab',
    items: [
      {
        name: 'Lab workspace',
        to: '/lab-workspace',
        icon: Squares2X2Icon,
        description: 'Tasks, projects, lab resources, team, and messaging',
      },
    ],
  },
  {
    label: 'Research network',
    items: [
      {
        name: 'Grants & funding',
        to: '/grants-fundings',
        icon: BriefcaseIcon,
        description: 'Discover grants, funding calls, and deadlines',
      },
      {
        name: 'Networking',
        to: '/collaboration-networking',
        icon: UsersIcon,
        description: 'Connect with researchers and collaborators',
      },
      {
        name: 'Data bank',
        to: '/research-databank',
        icon: DatabaseIcon,
        description: 'Cross-org ethical dataset exchange',
      },
      {
        name: 'Marketplace',
        to: '/marketplace',
        icon: PackageIcon,
        description: 'Research supplies and expertise directory',
      },
    ],
  },
];

const SideNav: React.FC<SideNavProps> = ({ onMobileLinkClick }) => {
  return (
    <div className="h-full flex flex-col bg-[#FAFBFC] border-r border-slate-200/80">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-200/80">
        <Link
          to="/dashboard"
          onClick={onMobileLinkClick}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-semibold tracking-wide">DR</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 leading-tight tracking-tight truncate group-hover:text-slate-700 transition-colors">
              Digital Research
            </p>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
              Manager
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" data-testid="side-nav">
        <div className="space-y-6">
          {navSections.map((section, sectionIndex) => (
            <div key={section.label ?? `primary-${sectionIndex}`}>
              {section.label && (
                <p className="px-3 mb-1.5 text-[11px] font-medium text-slate-400 tracking-wide">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onMobileLinkClick}
                      title={item.description}
                      data-testid={`nav-${item.to.replace(/^\//, '').replace(/\//g, '-')}`}
                      className={({ isActive }) =>
                        [
                          'group relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors duration-150',
                          isActive
                            ? 'bg-white text-slate-900 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80'
                            : 'text-slate-600 font-normal hover:bg-white/70 hover:text-slate-900',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-slate-900"
                              aria-hidden="true"
                            />
                          )}
                          <item.icon
                            className={[
                              'w-[15px] h-[15px] flex-shrink-0 transition-colors',
                              isActive
                                ? 'text-slate-800'
                                : 'text-slate-400 group-hover:text-slate-600',
                            ].join(' ')}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-200/80 flex-shrink-0 space-y-0.5">
        <Link
          to="/support"
          onClick={onMobileLinkClick}
          className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] text-slate-600 hover:bg-white/70 hover:text-slate-900 transition-colors"
        >
          <HeartIcon className="w-[15px] h-[15px] text-slate-400" aria-hidden="true" />
          Support us
        </Link>
        <Link
          to="/settings"
          onClick={onMobileLinkClick}
          className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] text-slate-600 hover:bg-white/70 hover:text-slate-900 transition-colors"
        >
          <CogIcon className="w-[15px] h-[15px] text-slate-400" aria-hidden="true" />
          Settings
        </Link>
      </div>
    </div>
  );
};

export default SideNav;
