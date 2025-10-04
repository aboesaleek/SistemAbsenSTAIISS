import React from 'react';
import { AdminViewType } from '../../pages/AdminDashboard';
import { Logo } from '../icons/Logo';
import { AcademicIcon } from '../icons/AcademicIcon';
import { DormitoryIcon } from '../icons/DormitoryIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { LogoutIcon } from '../icons/LogoutIcon';

interface SidebarProps {
  currentView: AdminViewType;
  setCurrentView: (view: AdminViewType) => void;
  onLogout: () => void;
}

const SidebarButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-right transition-colors duration-200 ${
      isActive
        ? 'bg-teal-500 text-white shadow-md'
        : 'text-slate-600 hover:bg-teal-100 hover:text-teal-700'
    }`}
  >
    {icon}
    <span className="font-semibold">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
  return (
    <aside className="w-64 bg-white shadow-lg p-4 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 p-4 mb-6">
        <Logo className="h-10 w-10 text-teal-500" />
        <h1 className="text-xl font-bold text-slate-700">لوحة التحكم</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-grow">
        <SidebarButton
          label="الأكاديمية"
          icon={<AcademicIcon className="w-6 h-6" />}
          isActive={currentView === 'academic'}
          onClick={() => setCurrentView('academic')}
        />
        <SidebarButton
          label="المهجع"
          icon={<DormitoryIcon className="w-6 h-6" />}
          isActive={currentView === 'dormitory'}
          onClick={() => setCurrentView('dormitory')}
        />
        <SidebarButton
          label="المستخدمون"
          icon={<UsersIcon className="w-6 h-6" />}
          isActive={currentView === 'users'}
          onClick={() => setCurrentView('users')}
        />
      </nav>
      <div className="mt-auto">
        <SidebarButton
          label="تسجيل الخروج"
          icon={<LogoutIcon className="w-6 h-6" />}
          isActive={false}
          onClick={onLogout}
        />
      </div>
    </aside>
  );
};
