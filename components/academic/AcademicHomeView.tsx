import React, { useMemo } from 'react';
import { DocumentReportIcon } from '../icons/DocumentReportIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { PermissionIcon } from '../icons/PermissionIcon';
import { AttendanceIcon } from '../icons/AttendanceIcon';
import { AcademicViewType } from '../../pages/AcademicDashboard';
import { RecapStatus } from '../../types';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface AcademicHomeViewProps {
  navigateTo: (view: AcademicViewType) => void;
  onStudentSelect: (studentId: string) => void;
}

const MainModuleCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}> = ({ icon, title, description, onClick, gradient }) => (
  <button
    onClick={onClick}
    className={`relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-6 text-white text-right ${gradient}`}
  >
    <div className="relative z-10">
      <div className="bg-white/20 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-2xl font-bold drop-shadow-md">{title}</h3>
      <p className="leading-relaxed opacity-90 drop-shadow-sm mt-1">{description}</p>
    </div>
  </button>
);

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 text-right">
        <div className="flex justify-between items-start">
            <p className="text-slate-500 font-semibold">{title}</p>
            <div className="bg-slate-100 rounded-full p-2 -mt-1 -mr-1">
                {icon}
            </div>
        </div>
        <p className="text-4xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

export const AcademicHomeView: React.FC<AcademicHomeViewProps> = ({ navigateTo, onStudentSelect }) => {
  const { records, loading } = useAcademicData();

  const { highAbsenceStudents, todayStats } = useMemo(() => {
    if (loading) return { highAbsenceStudents: [], todayStats: { absent: 0, permission: 0, sick: 0 }};

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayRecords = records.filter(r => r.date === today);
    const recentRecords = records.filter(r => r.date >= sevenDaysAgo);

    const stats = {
        absent: todayRecords.filter(r => r.status === RecapStatus.ABSENT).length,
        permission: todayRecords.filter(r => r.status === RecapStatus.PERMISSION).length,
        sick: todayRecords.filter(r => r.status === RecapStatus.SICK).length,
    };

    const absenceMap = new Map<string, { studentName: string, count: number }>();
    recentRecords.forEach(record => {
        if (record.status === RecapStatus.ABSENT) {
            const existing = absenceMap.get(record.studentId);
            if (existing) {
                existing.count++;
            } else {
                absenceMap.set(record.studentId, { studentName: record.studentName, count: 1 });
            }
        }
    });
    
    const highAbsences = Array.from(absenceMap.entries())
        .filter(([, data]) => data.count >= 3) // Threshold 3 absences in last 7 days
        .map(([studentId, data]) => ({ studentId, ...data }))
        .sort((a,b) => b.count - a.count);

    return { highAbsenceStudents: highAbsences, todayStats: stats };
  }, [records, loading]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="غياب اليوم" value={todayStats.absent} icon={<ClipboardListIcon className="w-5 h-5 text-red-500"/>} />
        <StatCard title="إذن اليوم" value={todayStats.permission} icon={<PermissionIcon className="w-5 h-5 text-blue-500"/>} />
        <StatCard title="مرض اليوم" value={todayStats.sick} icon={<CheckCircleIcon className="w-5 h-5 text-yellow-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">الوحدات الرئيسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MainModuleCard
                    icon={<PermissionIcon className="w-10 h-10" />}
                    title="تسجيل الأذونات"
                    description="إدارة وتسجيل أذونات الطلاب."
                    onClick={() => navigateTo('permissions')}
                    gradient="bg-gradient-to-br from-sky-500 to-indigo-600"
                />
                <MainModuleCard
                    icon={<AttendanceIcon className="w-10 h-10" />}
                    title="تسجيل الغياب"
                    description="تسجيل حالات غياب الطلاب."
                    onClick={() => navigateTo('attendance')}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                />
            </div>
          </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">التقارير والملخصات</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => navigateTo('recap')} className="p-4 bg-white rounded-xl shadow-md border hover:border-slate-300 hover:shadow-lg transition-all flex items-center gap-4"><DocumentReportIcon className="w-6 h-6 text-slate-500"/> <span className="font-semibold text-slate-700">الملخص العام</span></button>
                  <button onClick={() => navigateTo('classRecap')} className="p-4 bg-white rounded-xl shadow-md border hover:border-slate-300 hover:shadow-lg transition-all flex items-center gap-4"><ChartBarIcon className="w-6 h-6 text-slate-500"/> <span className="font-semibold text-slate-700">ملخص الفصل</span></button>
                  <button onClick={() => navigateTo('studentRecap')} className="p-4 bg-white rounded-xl shadow-md border hover:border-slate-300 hover:shadow-lg transition-all flex items-center gap-4"><UserCircleIcon className="w-6 h-6 text-slate-500"/> <span className="font-semibold text-slate-700">ملخص الطالب</span></button>
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-6 h-6 text-red-500"/> تحتاج إلى اهتمام</h3>
            <p className="text-sm text-slate-500 mb-4">الطلاب الذين لديهم 3 غيابات أو أكثر في الأسبوع الماضي.</p>
            {loading ? <div className="text-center py-8 text-slate-500">...</div> : highAbsenceStudents.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                   {highAbsenceStudents.map(student => (
                       <li key={student.studentId}>
                           <button onClick={() => onStudentSelect(student.studentId)} className="w-full text-right flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-100">
                               <span className="font-semibold text-slate-700">{student.studentName}</span>
                               <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{student.count} غيابات</span>
                           </button>
                       </li>
                   ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">لا توجد تنبيهات حاليًا.</div>
            )}
        </div>
      </div>
    </div>
  );
};
