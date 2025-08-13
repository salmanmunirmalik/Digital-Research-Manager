import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, CalculatorIcon, FlaskConicalIcon, JournalIcon, MessageSquareQuestionIcon, BoxesIcon, BarChartIcon, CalendarClockIcon, UsersIcon } from './icons';

const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const baseClasses = "flex items-center px-4 py-3 text-gray-200 hover:bg-slate-700 hover:text-white transition-colors duration-200 rounded-md";
    const activeClasses = "bg-slate-700 text-white font-semibold";

    return (
        <NavLink
            to={to}
            className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ''}`}
        >
            {children}
        </NavLink>
    );
};


const SideNav: React.FC = () => {
  return (
    <div className="flex h-full w-64 flex-col bg-slate-800 text-white shadow-lg">
        <div className="flex items-center justify-center h-20 border-b border-slate-700">
             <FlaskConicalIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="ml-3 text-2xl font-bold tracking-wider">ResearchLabSync</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <NavItem to="/">
                <HomeIcon className="h-5 w-5 mr-3" />
                Dashboard
            </NavItem>
            <NavItem to="/protocols">
                <BookOpenIcon className="h-5 w-5 mr-3" />
                Protocol Library
            </NavItem>
             <NavItem to="/notebook">
                <JournalIcon className="h-5 w-5 mr-3" />
                Lab Notebook
            </NavItem>
            <NavItem to="/inventory">
                <BoxesIcon className="h-5 w-5 mr-3" />
                Inventory
            </NavItem>
            <NavItem to="/instruments">
                <CalendarClockIcon className="h-5 w-5 mr-3" />
                Instruments
            </NavItem>
            <NavItem to="/team">
                <UsersIcon className="h-5 w-5 mr-3" />
                Team & Collaborators
            </NavItem>
            <NavItem to="/data">
                <BarChartIcon className="h-5 w-5 mr-3" />
                Data & Results
            </NavItem>
            <NavItem to="/calculators">
                <CalculatorIcon className="h-5 w-5 mr-3" />
                Calculators
            </NavItem>
            <NavItem to="/help">
                <MessageSquareQuestionIcon className="h-5 w-5 mr-3" />
                Help Forum
            </NavItem>
        </nav>
        <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-400">&copy; 2024 ResearchLabSync</p>
            <p className="text-xs text-slate-400">The Digital Lab Companion</p>
        </div>
    </div>
  );
};

export default SideNav;