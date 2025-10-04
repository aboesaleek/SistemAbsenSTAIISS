import React, { useState } from 'react';
import { AcademicView } from '../components/admin/AcademicView';
import { DormitoryView } from '../components/admin/DormitoryView';
import { UsersView } from '../components/admin/UsersView';
import { DashboardLayout, NavLinkItem } from '../components/layout/DashboardLayout';
import { AcademicIcon } from '../components/icons/AcademicIcon';
import { DormitoryIcon } from '../components/icons/DormitoryIcon';
import { UsersIcon } from '../components/icons/UsersIcon';

export type AdminViewType = 'academic' | 'dormitory' | 'users';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<AdminViewType>('academic');

  const renderView = () => {
    switch (currentView) {
      case 'academic':
        return <AcademicView />;
      case 'dormitory':
        return <DormitoryView />;
      case 'users':
        return <UsersView />;
      default:
        return <AcademicView />;
    }
  };
  
  const navLinks: NavLinkItem[] = [
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