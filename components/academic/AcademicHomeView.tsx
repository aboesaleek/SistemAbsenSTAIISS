import React, { useMemo } from 'react';
import { DocumentReportIcon } from '../icons/DocumentReportIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { PermissionIcon } from '../icons/PermissionIcon';
import { AttendanceIcon } from '../icons/AttendanceIcon';
// FIX: AcademicViewType is exported from AcademicDashboard, not types.ts.
import { AcademicViewType } from '../../pages/AcademicDashboard';
import { RecapStatus } from '../../types';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { MedicalIcon } from '../icons/MedicalIcon';


interface AcademicHomeViewProps {
  navigateTo: (view: AcademicViewType) => void;
}

const MainModuleCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}> = ({ icon, title, description, onClick, gradient }) => (
  <div className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
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
      className="relative z-10 w-full text-right p-4 sm:p-8 text-white flex sm:flex-col items-center sm:items-start h-full min-h-[140px] sm:min-h-[260px]"
    >
      <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-0 sm:mb-6 shrink-0 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
        {icon}
      </div>
      <div className="mr-4 sm:mr-0 flex-grow">
        <h3 className="text-xl sm:text-3xl font-bold drop-shadow-md">{title}</h3>
        <p className="hidden sm:block leading-relaxed opacity-90 drop-shadow-sm mt-1">{description}</p>
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
        <div className="bg-teal-100 text-teal-600 rounded-lg p-3">
            {icon}
        </div>
        <span className="font-semibold text-slate-700">{title}</span>
    </button>
)

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-slate-200 flex items-center gap-3 sm:gap-4">
        <div className="flex-shrink-0 bg-slate-100 rounded-full p-2 sm:p-3">
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);


export const AcademicHomeView: React.FC<AcademicHomeViewProps> = ({ navigateTo }) => {
  const { records, loading } = useAcademicData();

  const todayStats = useMemo(() => {
    if (loading) return { permissions: 0, sick: 0, absences: 0 };

    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === today);

    return {
      permissions: todayRecords.filter(r => r.status === RecapStatus.PERMISSION).length,
      sick: todayRecords.filter(r => r.status === RecapStatus.SICK).length,
      absences: todayRecords.filter(r => r.status === RecapStatus.ABSENT).length,
    };
  }, [records, loading]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
              <TrendingUpIcon className="w-6 h-6 text-slate-600" />
              <h3 className="text-xl font-bold text-slate-700">إحصائيات اليوم</h3>
          </div>
          {loading ? <div className="text-center py-4 text-slate-500">...جاري تحميل الإحصائيات</div> : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard title="إذن" value={todayStats.permissions} icon={<CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />} />
              <StatCard title="مرض" value={todayStats.sick} icon={<MedicalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />} />
              <StatCard title="غائب" value={todayStats.absences} icon={<ClipboardListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />} />
          </div>
          )}
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 text-center">الوحدات الرئيسية</h2>
        <p className="text-base sm:text-lg text-slate-600 mb-6 text-center">
            ابدأ بتسجيل حضور الطلاب أو إدارة الأذونات اليومية.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MainModuleCard
                icon={<PermissionIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="تسجيل الأذونات"
                description="إدارة وتسجيل أذونات الطلاب سواء كانت بسبب مرض أو أسباب أخرى."
                onClick={() => navigateTo('permissions')}
                gradient="from-sky-500 to-indigo-600"
            />
            <MainModuleCard
                icon={<AttendanceIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="تسجيل الغياب"
                description="تسجيل حالات غياب الطلاب عن الفصول الدراسية اليومية."
                onClick={() => navigateTo('attendance')}
                gradient="from-emerald-500 to-teal-600"
            />
        </div>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 text-center">التقارير والملخصات</h2>
        <p className="text-base sm:text-lg text-slate-500 mb-6 text-center">
            استعرض وحلل بيانات الحضور والغياب من خلال التقارير الشاملة التالية.
        </p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <ReportCard 
                icon={<DocumentReportIcon className="w-6 h-6" />}
                title="الملخص العام"
                onClick={() => navigateTo('recap')}
            />
            <ReportCard 
                icon={<ChartBarIcon className="w-6 h-6" />}
                title="ملخص الفصل"
                onClick={() => navigateTo('classRecap')}
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