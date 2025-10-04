import React from 'react';
import { NavLinkItem } from './DashboardLayout';
import { Logo } from '../icons/Logo';
import { LogoutIcon } from '../icons/LogoutIcon';
import { ChevronDoubleLeftIcon } from '../icons/ChevronDoubleLeftIcon';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  navLinks: NavLinkItem[];
  onLogout: () => void;
  dashboardTitle: string;
}

const SidebarLink: React.FC<{
  link: NavLinkItem;
  isCollapsed: boolean;
}> = ({ link, isCollapsed }) => (
  <button
    onClick={link.onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
      isCollapsed ? 'justify-center' : ''
    } ${
      link.isActive
        ? 'bg-teal-500 text-white shadow-md'
        : 'text-slate-600 hover:bg-teal-100 hover:text-teal-700'
    }`}
    title={isCollapsed ? link.label : undefined}
  >
    {link.icon}
    {!isCollapsed && <span className="font-semibold whitespace-nowrap">{link.label}</span>}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, navLinks, onLogout, dashboardTitle }) => {
  return (
    <aside
      className={`bg-white shadow-lg flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 no-print ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex items-center p-4 h-[77px] border-b border-slate-200 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo className="h-10 w-10 text-teal-500 shrink-0" />
            <span className="text-lg font-bold text-slate-700 whitespace-nowrap">{dashboardTitle}</span>
          </div>
        )}
        <button onClick={onToggle} className="p-2 rounded-md hover:bg-slate-100">
          <ChevronDoubleLeftIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 p-4 flex-grow">
        {navLinks.map((link) => (
          <SidebarLink key={link.id} link={link} isCollapsed={isCollapsed} />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <SidebarLink
          isCollapsed={isCollapsed}
          link={{
            id: 'logout',
            label: 'تسجيل الخروج',
            icon: <LogoutIcon className="w-6 h-6" />,
            isActive: false,
            onClick: onLogout,
          }}
        />
      </div>
    </aside>
  );
};