import React, { useState } from 'react';
import { DashboardLayout, NavLinkItem } from '../components/layout/DashboardLayout';
import { HomeIcon } from '../components/icons/HomeIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { DormitoryHomeView } from '../components/dormitory/DormitoryHomeView';
import { PermissionsView } from '../components/dormitory/PermissionsView';
import { RecapView } from '../components/dormitory/RecapView';
import { DormitoryRecapView } from '../components/dormitory/DormitoryRecapView';
import { StudentRecapView } from '../components/dormitory/StudentRecapView';
import { DocumentReportIcon } from '../components/icons/DocumentReportIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';

export type DormitoryViewType = 'home' | 'permissions' | 'recap' | 'dormitoryRecap' | 'studentRecap';

interface DormitoryDashboardProps {
  onLogout: () => void;
}

export const DormitoryDashboard: React.FC<DormitoryDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DormitoryViewType>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <DormitoryHomeView navigateTo={setCurrentView} />;
      case 'permissions':
        return <PermissionsView />;
      case 'recap':
        return <RecapView />;
      case 'dormitoryRecap':
        return <DormitoryRecapView />;
      case 'studentRecap':
        return <StudentRecapView />;
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
      id: 'permissions',
      label: 'الأذونات',
      icon: <CheckCircleIcon className="w-6 h-6" />,
      isActive: currentView === 'permissions',
      onClick: () => setCurrentView('permissions'),
    },
    {
      id: 'recap',
      label: 'الملخص العام',
      icon: <DocumentReportIcon className="w-6 h-6" />,
      isActive: currentView === 'recap',
      onClick: () => setCurrentView('recap'),
    },
    {
      id: 'dormitoryRecap',
      label: 'ملخص المهجع',
      icon: <ChartBarIcon className="w-6 h-6" />,
      isActive: currentView === 'dormitoryRecap',
      onClick: () => setCurrentView('dormitoryRecap'),
    },
     {
      id: 'studentRecap',
      label: 'ملخص الطالب',
      icon: <UserCircleIcon className="w-6 h-6" />,
      isActive: currentView === 'studentRecap',
      onClick: () => setCurrentView('studentRecap'),
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