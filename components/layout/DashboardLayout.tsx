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

// A curated list of high-quality, Islamic-themed backgrounds from Pexels.
const ISLAMIC_BACKGROUNDS = [
  "https://images.pexels.com/photos/4139818/pexels-photo-4139818.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Nabawi Mosque
  "https://images.pexels.com/photos/8643936/pexels-photo-8643936.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Interior Blue Mosque
  "https://images.pexels.com/photos/4038863/pexels-photo-4038863.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Sheikh Zayed Grand Mosque
  "https://images.pexels.com/photos/1359325/pexels-photo-1359325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Person praying in mosque
  "https://images.pexels.com/photos/5095753/pexels-photo-5095753.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Mosque silhouette sunset
  "https://images.pexels.com/photos/8038520/pexels-photo-8038520.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Ornate mosque interior
  "https://images.pexels.com/photos/7437593/pexels-photo-7437593.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Kaaba
  "https://images.pexels.com/photos/4607198/pexels-photo-4607198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Person reading Quran
  "https://images.pexels.com/photos/1317712/pexels-photo-1317712.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Mosque exterior at night
  "https://images.pexels.com/photos/7281983/pexels-photo-7281983.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Islamic architecture detail
];

// Select a new background image deterministically based on the day of the year.
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 0);
const diff = now.getTime() - startOfYear.getTime();
const oneDay = 1000 * 60 * 60 * 24;
const dayOfYear = Math.floor(diff / oneDay);
const backgroundUrl = ISLAMIC_BACKGROUNDS[dayOfYear % ISLAMIC_BACKGROUNDS.length];


export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, navLinks, onLogout, dashboardTitle }) => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('${backgroundUrl}')` }}
      dir="rtl"
    >
      <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-sm z-0" />
      <div className="relative min-h-screen md:flex">
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
        <div className="relative flex-1 flex flex-col w-full md:w-auto">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center no-print">
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
    </div>
  );
};