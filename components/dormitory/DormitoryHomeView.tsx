import React from 'react';
import { DormitoryViewType } from '../../pages/DormitoryDashboard';
import { DocumentReportIcon } from '../icons/DocumentReportIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { ClipboardCheckIcon } from '../icons/ClipboardCheckIcon';

interface DormitoryHomeViewProps {
  navigateTo: (view: DormitoryViewType) => void;
}

const MainModuleCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}> = ({ icon, title, description, onClick, gradient }) => (
  <div className="relative group rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} z-0`}></div>
    <div
      className="absolute inset-0 opacity-10 z-0"
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M50 0 L100 50 L50 100 L0 50 Z\'/%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '20px',
      }}
    ></div>
    <button
      onClick={onClick}
      className="relative z-10 w-full text-right p-8 text-white flex flex-col items-start min-h-[280px]"
    >
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-20 h-20 flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className="text-2xl font-bold mb-2 drop-shadow-md">{title}</h3>
        <p className="leading-relaxed opacity-90 drop-shadow-sm">{description}</p>
      </div>
    </button>
  </div>
);

const ReportCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}> = ({ icon, title, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-sm hover:bg-white hover:shadow-lg hover:border-slate-300 transition-all duration-300 transform hover:scale-105">
        <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
            {icon}
        </div>
        <span className="font-semibold text-slate-700">{title}</span>
    </button>
)

export const DormitoryHomeView: React.FC<DormitoryHomeViewProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-16">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">الوحدات الرئيسية</h2>
        <p className="text-lg md:text-xl text-slate-600 mb-8 text-center">
          ابدأ بتسجيل أذونات الطلاب أو غياباتهم اليومية.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <MainModuleCard
                icon={<CheckCircleIcon className="w-10 h-10" />}
                title="تسجيل الأذونات"
                description="تسجيل جميع أنواع الأذونات للطلاب، سواء كانت فردية، جماعية، للمرض، أو للمبيت."
                onClick={() => navigateTo('permissions')}
                gradient="from-purple-500 to-indigo-600"
            />
            <MainModuleCard
                icon={<ClipboardListIcon className="w-10 h-10" />}
                title="تسجيل الغياب"
                description="تسجيل غياب الطلاب عن الصلوات والمراسم اليومية."
                onClick={() => navigateTo('absence')}
                gradient="from-emerald-500 to-teal-600"
            />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4 text-center">التقارير والملخصات</h2>
        <p className="text-lg text-slate-500 mb-8 text-center">
            استعرض وحلل بيانات الأذونات والغيابات من خلال التقارير الشاملة التالية.
        </p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ReportCard 
                icon={<ClipboardCheckIcon className="w-6 h-6" />}
                title="ملخص الغياب"
                onClick={() => navigateTo('absenceRecap')}
            />
            <ReportCard 
                icon={<DocumentReportIcon className="w-6 h-6" />}
                title="ملخص الأذونات"
                onClick={() => navigateTo('generalRecap')}
            />
            <ReportCard 
                icon={<UserCircleIcon className="w-6 h-6" />}
                title="ملخص الطالب"
                onClick={() => navigateTo('studentRecap')}
            />
        </div>
      </div>
    </div>
  );
};
