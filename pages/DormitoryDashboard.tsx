import React, { useState } from 'react';
import { DashboardLayout, NavLinkItem } from '../components/layout/DashboardLayout';
import { HomeIcon } from '../components/icons/HomeIcon';
import { DormitoryHomeView } from '../components/dormitory/DormitoryHomeView';
import { SickLeaveView } from '../components/dormitory/SickLeaveView';
import { GroupLeaveView } from '../components/dormitory/GroupLeaveView';
import { IndividualLeaveView } from '../components/dormitory/IndividualLeaveView';
import { OvernightLeaveView } from '../components/dormitory/OvernightLeaveView';
import { MedicalIcon } from '../components/icons/MedicalIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { MoonIcon } from '../components/icons/MoonIcon';

export type DormitoryViewType = 
  'home' | 
  'sickLeave' | 
  'groupLeave' | 
  'individualLeave' | 
  'overnightLeave';

interface DormitoryDashboardProps {
  onLogout: () => void;
}

export const DormitoryDashboard: React.FC<DormitoryDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DormitoryViewType>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <DormitoryHomeView navigateTo={setCurrentView} />;
      case 'sickLeave':
        return <SickLeaveView />;
      case 'groupLeave':
        return <GroupLeaveView />;
      case 'individualLeave':
        return <IndividualLeaveView />;
      case 'overnightLeave':
        return <OvernightLeaveView />;
      default:
        return <DormitoryHomeView navigateTo={setCurrentView} />;
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
      id: 'sickLeave',
      label: 'إذن خروج للمريض',
      icon: <MedicalIcon className="w-6 h-6" />,
      isActive: currentView === 'sickLeave',
      onClick: () => setCurrentView('sickLeave'),
    },
    {
      id: 'groupLeave',
      label: 'إذن خروج جماعي',
      icon: <UsersIcon className="w-6 h-6" />,
      isActive: currentView === 'groupLeave',
      onClick: () => setCurrentView('groupLeave'),
    },
    {
      id: 'individualLeave',
      label: 'إذن خروج فردي',
      icon: <UserIcon className="w-6 h-6" />,
      isActive: currentView === 'individualLeave',
      onClick: () => setCurrentView('individualLeave'),
    },
    {
      id: 'overnightLeave',
      label: 'إذن مبيت',
      icon: <MoonIcon className="w-6 h-6" />,
      isActive: currentView === 'overnightLeave',
      onClick: () => setCurrentView('overnightLeave'),
    },
  ];

  return (
    <DashboardLayout
      navLinks={navLinks}
      onLogout={onLogout}
      dashboardTitle="بوابة المهجع"
    >
      {renderView()}
    </DashboardLayout>
  );
};
