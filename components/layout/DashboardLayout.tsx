import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MenuIcon } from '../icons/MenuIcon';
import { Logo } from '../icons/Logo';

export interface NavLinkItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navLinks: NavLinkItem[];
  onLogout: () => void;
  dashboardTitle: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, navLinks, onLogout, dashboardTitle }) => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen md:flex bg-slate-100" dir="rtl">
      {/* Sidebar - handles both mobile and desktop states */}
      <Sidebar
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onDesktopToggle={() => setDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        navLinks={navLinks}
        onLogout={onLogout}
        dashboardTitle={dashboardTitle}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 bg-white shadow-sm p-4 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-teal-500" />
            <span className="text-lg font-bold text-slate-700">{dashboardTitle}</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2">
            <MenuIcon className="w-6 h-6 text-slate-600" />
          </button>
        </header>
        
        <main className="flex-1 p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};