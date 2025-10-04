import React from 'react';
import { AppMode } from '../types';
import { AcademicIcon } from './icons/AcademicIcon';
import { DormitoryIcon } from './icons/DormitoryIcon';
import { AdminIcon } from './icons/AdminIcon';

interface ModeToggleProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeToggleButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ isActive, onClick, icon, label }) => {
  const baseClasses =
    'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-300 transform text-sm';
  const activeClasses = 'bg-teal-500 text-white border border-teal-500/50 shadow-lg scale-105';
  const inactiveClasses = 'bg-slate-200/60 text-slate-600 hover:bg-slate-300/70 hover:text-slate-800';

  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span className="font-bold">{label}</span>
    </button>
  );
};

export const ModeToggle: React.FC<ModeToggleProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="w-full flex gap-2 p-2 bg-black/5 rounded-xl border border-white/20">
      <ModeToggleButton
        isActive={currentMode === AppMode.ACADEMIC}
        onClick={() => onModeChange(AppMode.ACADEMIC)}
        icon={<AcademicIcon className="w-5 h-5" />}
        label="الأكاديمية"
      />
      <ModeToggleButton
        isActive={currentMode === AppMode.DORMITORY}
        onClick={() => onModeChange(AppMode.DORMITORY)}
        icon={<DormitoryIcon className="w-5 h-5" />}
        label="المهجع"
      />
      <ModeToggleButton
        isActive={currentMode === AppMode.ADMIN}
        onClick={() => onModeChange(AppMode.ADMIN)}
        icon={<AdminIcon className="w-5 h-5" />}
        label="المسؤول"
      />
    </div>
  );
};
