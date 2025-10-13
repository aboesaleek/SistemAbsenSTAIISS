import React, { useState } from 'react';
import { PrayerAbsenceView } from './PrayerAbsenceView';
import { CeremonyAbsenceView } from './CeremonyAbsenceView';

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`px-6 py-3 text-lg font-bold transition-colors duration-200 focus:outline-none ${isActive ? 'border-b-4 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-800'}`}>
        {children}
    </button>
);

interface AbsenceViewProps {
    onStudentSelect: (studentId: string) => void;
}

export const AbsenceView: React.FC<AbsenceViewProps> = ({ onStudentSelect }) => {
    const [activeTab, setActiveTab] = useState<'prayer' | 'ceremony'>('prayer');

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">تسجيل الغياب</h2>
            <div className="flex justify-center border-b mb-6">
                <TabButton isActive={activeTab === 'prayer'} onClick={() => setActiveTab('prayer')}>
                    غياب الصلاة
                </TabButton>
                <TabButton isActive={activeTab === 'ceremony'} onClick={() => setActiveTab('ceremony')}>
                    غياب المراسم
                </TabButton>
            </div>
            <div>
                {activeTab === 'prayer' && <PrayerAbsenceView onStudentSelect={onStudentSelect} />}
                {activeTab === 'ceremony' && <CeremonyAbsenceView onStudentSelect={onStudentSelect} />}
            </div>
        </div>
    );
};
