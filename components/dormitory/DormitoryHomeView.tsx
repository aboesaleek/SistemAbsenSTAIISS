import React from 'react';
import { PermissionIcon } from '../icons/PermissionIcon';
import { DormitoryViewType } from '../../pages/DormitoryDashboard';
import { DocumentReportIcon } from '../icons/DocumentReportIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';

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
        <h3 className="text-3xl font-bold mb-2 drop-shadow-md">{title}</h3>
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
        <h2 className="text-4xl font-bold text-slate-800 mb-4 text-center">الوحدة الرئيسية</h2>
        <p className="text-xl text-slate-600 mb-8 text-center">
          ابدأ بتسجيل أذونات الطلاب للخروج أو العودة.
        </p>
        <div className="max-w-lg mx-auto">
            <MainModuleCard
                icon={<PermissionIcon className="w-10 h-10" />}
                title="تسجيل الأذونات"
                description="إدارة وتسجيل أذونات الطلاب سواء كانت للخروج من السكن أو العودة إلى المنزل."
                onClick={() => navigateTo('permissions')}
                gradient="from-purple-500 to-pink-600"
            />
        </div>
      </div>

       <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4 text-center">التقارير والملخصات</h2>
        <p className="text-lg text-slate-500 mb-8 text-center">
            استعرض وحلل بيانات الأذونات من خلال التقارير الشاملة التالية.
        </p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReportCard 
                icon={<DocumentReportIcon className="w-6 h-6" />}
                title="الملخص العام"
                onClick={() => navigateTo('recap')}
            />
            <ReportCard 
                icon={<ChartBarIcon className="w-6 h-6" />}
                title="ملخص المهجع"
                onClick={() => navigateTo('dormitoryRecap')}
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