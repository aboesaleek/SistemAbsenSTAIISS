import React from 'react';
import { NavLinkItem } from './DashboardLayout';
import { Logo } from '../icons/Logo';
import { LogoutIcon } from '../icons/LogoutIcon';
import { ChevronDoubleLeftIcon } from '../icons/ChevronDoubleLeftIcon';

interface SidebarProps {
  isDesktopCollapsed: boolean;
  onDesktopToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  navLinks: NavLinkItem[];
  onLogout: () => void;
  dashboardTitle: string;
}

const SidebarLink: React.FC<{
  link: NavLinkItem;
  isCollapsed: boolean;
  onClick?: () => void;
}> = ({ link, isCollapsed, onClick }) => (
  <button
    onClick={() => {
      link.onClick();
      if (onClick) onClick();
    }}
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

export const Sidebar: React.FC<SidebarProps> = ({
  isDesktopCollapsed,
  onDesktopToggle,
  isMobileOpen,
  onMobileClose,
  navLinks,
  onLogout,
  dashboardTitle,
}) => {
  const sidebarContent = (isMobileView: boolean) => (
    <div className="flex flex-col h-full bg-white shadow-lg">
      {/* Header for Desktop Sidebar */}
      <div className={`hidden md:flex items-center p-4 h-[77px] border-b border-slate-200 ${isDesktopCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isDesktopCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo className="h-10 w-10 text-teal-500 shrink-0" />
            <span className="text-lg font-bold text-slate-700 whitespace-nowrap">{dashboardTitle}</span>
          </div>
        )}
        <button onClick={onDesktopToggle} className="p-2 rounded-md hover:bg-slate-100">
          <ChevronDoubleLeftIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 p-4 flex-grow">
        {navLinks.map((link) => (
          <SidebarLink
            key={link.id}
            link={link}
            isCollapsed={isMobileView ? false : isDesktopCollapsed}
            onClick={isMobileView ? onMobileClose : undefined}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <SidebarLink
          isCollapsed={isMobileView ? false : isDesktopCollapsed}
          onClick={isMobileView ? onMobileClose : undefined}
          link={{
            id: 'logout',
            label: 'تسجيل الخروج',
            icon: <LogoutIcon className="w-6 h-6" />,
            isActive: false,
            onClick: onLogout,
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar with Backdrop */}
      {isMobileOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onMobileClose}></div>}
      <aside
        className={`md:hidden fixed top-0 bottom-0 right-0 w-64 transform transition-transform duration-300 ease-in-out z-50 no-print ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block sticky top-0 h-screen transition-all duration-300 z-30 no-print ${
          isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
};