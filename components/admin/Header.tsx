import React from 'react';
import { AdminViewType } from '../../pages/AdminDashboard';
import { Logo } from '../icons/Logo';
import { LogoutIcon } from '../icons/LogoutIcon';

interface HeaderProps {
  currentView: AdminViewType;
  setCurrentView: (view: AdminViewType) => void;
  onLogout: () => void;
}

const HeaderLink: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
      isActive
        ? 'bg-teal-500 text-white'
        : 'text-slate-600 hover:bg-teal-100 hover:text-teal-700'
    }`}
  >
    {label}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onLogout }) => {
  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10 w-full" dir="rtl">
      <div className="flex items-center gap-4">
        <Logo className="h-10 w-10 text-teal-500" />
        <h1 className="text-xl font-bold text-slate-700">لوحة التحكم</h1>
      </div>
      
      <nav className="flex items-center gap-2">
        <HeaderLink
          label="الأكاديمية"
          isActive={currentView === 'academic'}
          onClick={() => setCurrentView('academic')}
        />
        <HeaderLink
          label="المهجع"
          isActive={currentView === 'dormitory'}
          onClick={() => setCurrentView('dormitory')}
        />
        <HeaderLink
          label="المستخدمون"
          isActive={currentView === 'users'}
          onClick={() => setCurrentView('users')}
        />
      </nav>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-slate-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
      >
        <LogoutIcon className="w-5 h-5" />
        <span>تسجيل الخروج</span>
      </button>
    </header>
  );
};