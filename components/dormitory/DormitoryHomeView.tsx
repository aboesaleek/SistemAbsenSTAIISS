import React, { useMemo } from 'react';
// FIX: DormitoryPermissionType is exported from types.ts, not DormitoryDashboard.tsx.
import { DormitoryViewType } from '../../pages/DormitoryDashboard';
import { DormitoryPermissionType } from '../../types';
import { DocumentReportIcon } from '../icons/DocumentReportIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { ClipboardCheckIcon } from '../icons/ClipboardCheckIcon';
import { useDormitoryData } from '../../contexts/DormitoryDataContext';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { MoonIcon } from '../icons/MoonIcon';
import { MedicalIcon } from '../icons/MedicalIcon';
import { PermissionIcon } from '../icons/PermissionIcon';

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
        <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
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

export const DormitoryHomeView: React.FC<DormitoryHomeViewProps> = ({ navigateTo }) => {
  const { permissionRecords, prayerAbsences, ceremonyAbsences, loading } = useDormitoryData();

  const todayStats = useMemo(() => {
    if (loading) return { permissions: 0, sick: 0, overnight: 0, absences: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    
    const todayPermissions = permissionRecords.filter(r => r.date === today);
    const todayPrayerAbsences = prayerAbsences.filter(r => r.date === today);
    const todayCeremonyAbsences = ceremonyAbsences.filter(r => r.date === today);

    return {
      permissions: todayPermissions.filter(r => r.type === DormitoryPermissionType.GENERAL_LEAVE || r.type === DormitoryPermissionType.GROUP_LEAVE).length,
      sick: todayPermissions.filter(r => r.type === DormitoryPermissionType.SICK_LEAVE).length,
      overnight: todayPermissions.filter(r => r.type === DormitoryPermissionType.OVERNIGHT_LEAVE).length,
      absences: todayPrayerAbsences.length + todayCeremonyAbsences.length
    };
  }, [permissionRecords, prayerAbsences, ceremonyAbsences, loading]);

  return (
    <div className="space-y-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
              <TrendingUpIcon className="w-6 h-6 text-slate-600" />
              <h3 className="text-xl font-bold text-slate-700">إحصائيات اليوم</h3>
          </div>
          {loading ? <div className="text-center py-4 text-slate-500">...جاري تحميل الإحصائيات</div> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard title="إذن خروج" value={todayStats.permissions} icon={<PermissionIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />} />
              <StatCard title="إذن مرض" value={todayStats.sick} icon={<MedicalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />} />
              <StatCard title="إذن مبيت" value={todayStats.overnight} icon={<MoonIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />} />
              <StatCard title="مجموع الغياب" value={todayStats.absences} icon={<ClipboardListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />} />
          </div>
          )}
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 text-center">الوحدات الرئيسية</h2>
        <p className="text-base sm:text-lg text-slate-600 mb-6 text-center">
          ابدأ بتسجيل أذونات الطلاب أو غياباتهم اليومية.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
             <MainModuleCard
                icon={<CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="تسجيل الأذونات"
                description="تسجيل جميع أنواع الأذونات للطلاب، سواء كانت فردية، جماعية، للمرض، أو للمبيت."
                onClick={() => navigateTo('permissions')}
                gradient="from-purple-500 to-indigo-600"
            />
            <MainModuleCard
                icon={<ClipboardListIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="تسجيل الغياب"
                description="تسجيل غياب الطلاب عن الصلوات والمراسم اليومية."
                onClick={() => navigateTo('absence')}
                gradient="from-emerald-500 to-teal-600"
            />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 text-center">التقارير والملخصات</h2>
        <p className="text-base sm:text-lg text-slate-500 mb-6 text-center">
            استعرض وحلل بيانات الأذونات والغيابات من خلال التقارير الشاملة التالية.
        </p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
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