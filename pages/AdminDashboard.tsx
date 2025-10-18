import React, { useState } from 'react';
import { AcademicView } from '../components/admin/AcademicView';
import { DormitoryView } from '../components/admin/DormitoryView';
import { UsersView } from '../components/admin/UsersView';
import { DashboardLayout, NavLinkItem } from '../components/layout/DashboardLayout';
import { AcademicIcon } from '../components/icons/AcademicIcon';
import { DormitoryIcon } from '../components/icons/DormitoryIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { HomeIcon } from '../components/icons/HomeIcon';
import { AdminHomeView } from '../components/admin/AdminHomeView';
import { SettingsView } from '../components/admin/SettingsView';
import { SettingsIcon } from '../components/icons/SettingsIcon';

export type AdminViewType = 'home' | 'academic' | 'dormitory' | 'users' | 'settings';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<AdminViewType>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <AdminHomeView setCurrentView={setCurrentView} />;
      case 'academic':
        return <AcademicView />;
      case 'dormitory':
        return <DormitoryView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AdminHomeView setCurrentView={setCurrentView} />;
    }
  };
  
  const navLinks: NavLinkItem[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: <HomeIcon className="w-6 h-6" />,
      isActive: currentView === 'home',
      onClick: () => setCurrentView('home'),
    },
    {
      id: 'academic',
      label: 'الأكاديمية',
      icon: <AcademicIcon className="w-6 h-6" />,
      isActive: currentView === 'academic',
      onClick: () => setCurrentView('academic'),
    },
    {
      id: 'dormitory',
      label: 'المهجع',
      icon: <DormitoryIcon className="w-6 h-6" />,
      isActive: currentView === 'dormitory',
      onClick: () => setCurrentView('dormitory'),
    },
    {
      id: 'users',
      label: 'المستخدمون',
      icon: <UsersIcon className="w-6 h-6" />,
      isActive: currentView === 'users',
      onClick: () => setCurrentView('users'),
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <SettingsIcon className="w-6 h-6" />,
      isActive: currentView === 'settings',
      onClick: () => setCurrentView('settings'),
    },
  ];

  return (
    <DashboardLayout
      navLinks={navLinks}
      onLogout={onLogout}
      dashboardTitle="لوحة تحكم المسؤول"
    >
      {renderView()}
    </DashboardLayout>
  );
};