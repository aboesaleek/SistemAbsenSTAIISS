import React, { useState } from 'react';
import { PermissionsView } from '../components/academic/PermissionsView';
import { AttendanceView } from '../components/academic/AttendanceView';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { HomeIcon } from '../components/icons/HomeIcon';
import { AcademicHomeView } from '../components/academic/AcademicHomeView';
import { DashboardLayout, NavLinkItem } from '../components/layout/DashboardLayout';
import { RecapView } from '../components/academic/RecapView';
import { ClassRecapView } from '../components/academic/ClassRecapView';
import { DocumentReportIcon } from '../components/icons/DocumentReportIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { StudentRecapView } from '../components/academic/StudentRecapView';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { FollowUpView } from '../components/academic/FollowUpView';
import { CallingIcon } from '../components/icons/CallingIcon';

export type AcademicViewType = 'home' | 'permissions' | 'attendance' | 'followUp' | 'recap' | 'classRecap' | 'studentRecap';

interface AcademicDashboardProps {
  onLogout: () => void;
}

export const AcademicDashboard: React.FC<AcademicDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<AcademicViewType>('home');
  const [selectedStudentIdForRecap, setSelectedStudentIdForRecap] = useState<string | null>(null);

  const handleStudentSelectForRecap = (studentId: string) => {
    setSelectedStudentIdForRecap(studentId);
    setCurrentView('studentRecap');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <AcademicHomeView navigateTo={setCurrentView} />;
      case 'permissions':
        return <PermissionsView />;
      case 'attendance':
        return <AttendanceView onStudentSelect={handleStudentSelectForRecap} />;
      case 'followUp':
        return <FollowUpView />;
      case 'recap':
        return <RecapView onStudentSelect={handleStudentSelectForRecap} />;
      case 'classRecap':
        return <ClassRecapView onStudentSelect={handleStudentSelectForRecap} />;
      case 'studentRecap':
        return <StudentRecapView preselectedStudentId={selectedStudentIdForRecap} />;
      default:
        return <AcademicHomeView navigateTo={setCurrentView} />;
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
      id: 'attendance',
      label: 'الحاضر والغياب',
      icon: <ClipboardListIcon className="w-6 h-6" />,
      isActive: currentView === 'attendance',
      onClick: () => setCurrentView('attendance'),
    },
    {
      id: 'followUp',
      label: 'متابعة الغياب',
      icon: <CallingIcon className="w-6 h-6" />,
      isActive: currentView === 'followUp',
      onClick: () => setCurrentView('followUp'),
    },
    {
      id: 'recap',
      label: 'الملخص العام',
      icon: <DocumentReportIcon className="w-6 h-6" />,
      isActive: currentView === 'recap',
      onClick: () => setCurrentView('recap'),
    },
    {
      id: 'classRecap',
      label: 'ملخص الفصل',
      icon: <ChartBarIcon className="w-6 h-6" />,
      isActive: currentView === 'classRecap',
      onClick: () => setCurrentView('classRecap'),
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
      dashboardTitle="البوابة الأكاديمية"
    >
      {renderView()}
    </DashboardLayout>
  );
};