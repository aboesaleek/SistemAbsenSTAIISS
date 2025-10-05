import React, { useState } from 'react';
import { DashboardLayout, NavLinkItem } from '../components/layout/DashboardLayout';
import { HomeIcon } from '../components/icons/HomeIcon';
import { DormitoryHomeView } from '../components/dormitory/DormitoryHomeView';
import { PermissionsView } from '../components/dormitory/PermissionsView';
import { DocumentReportIcon } from '../components/icons/DocumentReportIcon';
import { GeneralRecapView } from '../components/dormitory/GeneralRecapView';
import { StudentRecapView } from '../components/dormitory/StudentRecapView';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';

export type DormitoryViewType = 
  'home' | 
  'permissions' |
  'generalRecap' |
  'studentRecap';

interface DormitoryDashboardProps {
  onLogout: () => void;
}

export const DormitoryDashboard: React.FC<DormitoryDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<DormitoryViewType>('home');
  const [selectedStudentIdForRecap, setSelectedStudentIdForRecap] = useState<string | null>(null);

  const handleStudentSelectForRecap = (studentId: string) => {
    setSelectedStudentIdForRecap(studentId);
    setCurrentView('studentRecap');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <DormitoryHomeView navigateTo={setCurrentView} />;
      case 'permissions':
        return <PermissionsView />;
      case 'generalRecap':
        return <GeneralRecapView onStudentSelect={handleStudentSelectForRecap} />;
      case 'studentRecap':
        return <StudentRecapView preselectedStudentId={selectedStudentIdForRecap} />;
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
      label: 'تسجيل الأذونات',
      icon: <CheckCircleIcon className="w-6 h-6" />,
      isActive: currentView === 'permissions',
      onClick: () => setCurrentView('permissions'),
    },
    {
      id: 'generalRecap',
      label: 'الخلاصة العامة',
      icon: <DocumentReportIcon className="w-6 h-6" />,
      isActive: currentView === 'generalRecap',
      onClick: () => setCurrentView('generalRecap'),
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