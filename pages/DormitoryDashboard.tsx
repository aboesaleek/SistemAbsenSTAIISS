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
import { AbsenceView } from '../components/dormitory/AbsenceView';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { AbsenceRecapView } from '../components/dormitory/AbsenceRecapView';
import { ClipboardCheckIcon } from '../components/icons/ClipboardCheckIcon';
import { DormitoryDataProvider } from '../contexts/DormitoryDataContext';

export type DormitoryViewType = 
  'home' | 
  'permissions' |
  'absence' |
  'absenceRecap' |
  'generalRecap' |
  'studentRecap';

interface DormitoryDashboardProps {
  onLogout: () => void;
}

const DormitoryDashboardContent: React.FC<DormitoryDashboardProps> = ({ onLogout }) => {
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
      case 'absence':
        return <AbsenceView onStudentSelect={handleStudentSelectForRecap} />;
      case 'absenceRecap':
        return <AbsenceRecapView onStudentSelect={handleStudentSelectForRecap} />;
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
      id: 'absence',
      label: 'تسجيل الغياب',
      icon: <ClipboardListIcon className="w-6 h-6" />,
      isActive: currentView === 'absence',
      onClick: () => setCurrentView('absence'),
    },
    {
      id: 'absenceRecap',
      label: 'ملخص الغياب',
      icon: <ClipboardCheckIcon className="w-6 h-6" />,
      isActive: currentView === 'absenceRecap',
      onClick: () => setCurrentView('absenceRecap'),
    },
    {
      id: 'generalRecap',
      label: 'ملخص الأذونات',
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

export const DormitoryDashboard: React.FC<DormitoryDashboardProps> = (props) => (
  <DormitoryDataProvider>
    <DormitoryDashboardContent {...props} />
  </DormitoryDataProvider>
);
