import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-100" dir="rtl">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        navLinks={navLinks}
        onLogout={onLogout}
        dashboardTitle={dashboardTitle}
      />
      <main className="flex-1 p-8 transition-all duration-300 relative overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
