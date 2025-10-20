import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { AdminViewType } from '../../pages/AdminDashboard';
import { AcademicIcon } from '../icons/AcademicIcon';
import { DormitoryIcon } from '../icons/DormitoryIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { PermissionIcon } from '../icons/PermissionIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { BellIcon } from '../icons/BellIcon';
import { useAcademicPeriod } from '../../contexts/AcademicPeriodContext';
import { SettingsIcon } from '../icons/SettingsIcon';

// Local interface for unified activity log
interface ActivityLog {
  id: string;
  timestamp: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}

interface HighAbsenceStudent {
    studentId: string;
    name: string;
    count: number;
}

// Helper to format relative time
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `قبل لحظات`;
  
  let interval = seconds / 31536000;
  if (interval > 1) return `قبل ${Math.floor(interval)} سنة`;
  interval = seconds / 2592000;
  if (interval > 1) return `قبل ${Math.floor(interval)} شهر`;
  interval = seconds / 86400;
  if (interval > 1) return `قبل ${Math.floor(interval)} يوم`;
  interval = seconds / 3600;
  if (interval > 1) return `قبل ${Math.floor(interval)} ساعة`;
  interval = seconds / 60;
  if (interval > 1) return `قبل ${Math.floor(interval)} دقيقة`;
  return `قبل ${Math.floor(seconds)} ثانية`;
};

// Main Component
interface AdminHomeViewProps {
    setCurrentView: (view: AdminViewType) => void;
}

const ModuleCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    color: string;
}> = ({ icon, title, onClick, color }) => (
    <button onClick={onClick} className={`w-full text-right bg-white p-6 rounded-2xl shadow-lg border-t-4 ${color} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full`}>
        <div className="flex items-center gap-4">
            <div className="bg-slate-100 rounded-lg p-3">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-teal-600 font-semibold mt-4 text-left">إدارة الآن &rarr;</p>
    </button>
);

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 flex items-center gap-4">
        <div className="flex-shrink-0 text-slate-500">
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-semibold">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export const AdminHomeView: React.FC<AdminHomeViewProps> = ({ setCurrentView }) => {
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [highAbsenceStudents, setHighAbsenceStudents] = useState<HighAbsenceStudent[]>([]);
    const [stats, setStats] = useState({ academicPermissions: 0, academicAbsences: 0, dormPermissions: 0, dormAbsences: 0 });
    const [loading, setLoading] = useState(true);
    const { academicYear, semester, isReady } = useAcademicPeriod();
    
    useEffect(() => {
        if (!isReady) return;

        const fetchAllData = async () => {
            setLoading(true);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            try {
                // Fetch stats and logs in parallel
                const [
                    // Stats
                    acPermCount, acAbsCount, dormPermCount,
                    dormPrayerAbsCount, dormCeremonyAbsCount,
                    // High Absence
                    absenceCounts,
                    // Logs
                    academicPermissionsLogs, academicAbsencesLogs, dormPermissionsLogs,
                ] = await Promise.all([
                    supabase.from('academic_permissions').select('*', { count: 'exact', head: true }).eq('academic_year', academicYear).eq('semester', semester),
                    supabase.from('academic_absences').select('*', { count: 'exact', head: true }).eq('academic_year', academicYear).eq('semester', semester),
                    supabase.from('dormitory_permissions').select('*', { count: 'exact', head: true }).eq('academic_year', academicYear).eq('semester', semester),
                    supabase.from('dormitory_prayer_absences').select('*', { count: 'exact', head: true }).eq('academic_year', academicYear).eq('semester', semester),
                    supabase.from('dormitory_ceremony_absences').select('*', { count: 'exact', head: true }).eq('academic_year', academicYear).eq('semester', semester),
                    supabase.from('academic_absences').select('student_id, students(name)').eq('academic_year', academicYear).eq('semester', semester),
                    supabase.from('academic_permissions').select('id, created_at, students(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('academic_absences').select('id, created_at, students(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('dormitory_permissions').select('id, created_at, students(name)').gte('created_at', twentyFourHoursAgo),
                ]);

                // Process Stats
                setStats({
                    academicPermissions: acPermCount.count || 0,
                    academicAbsences: acAbsCount.count || 0,
                    dormPermissions: dormPermCount.count || 0,
                    dormAbsences: (dormPrayerAbsCount.count || 0) + (dormCeremonyAbsCount.count || 0)
                });

                // Process High Absence Students
                const studentAbsenceMap = new Map<string, { studentId: string; name: string, count: number }>();
                (absenceCounts.data || []).forEach((record: any) => {
                    if (record.students) {
                        const existing = studentAbsenceMap.get(record.student_id);
                        if (existing) {
                            existing.count += 1;
                        } else {
                            studentAbsenceMap.set(record.student_id, { studentId: record.student_id, name: record.students.name, count: 1 });
                        }
                    }
                });
                const highAbsences = Array.from(studentAbsenceMap.values()).filter(s => s.count > 5).sort((a, b) => b.count - a.count);
                setHighAbsenceStudents(highAbsences);

                // Process Logs
                const combinedLogs: ActivityLog[] = [];
                academicPermissionsLogs.data?.forEach((item: any) => item.students && combinedLogs.push({ id: `ap-${item.id}`, timestamp: item.created_at, description: <>إذن أكاديمي لـ <b>{item.students.name}</b></>, icon: <CheckCircleIcon className="w-5 h-5 text-blue-500" /> }));
                academicAbsencesLogs.data?.forEach((item: any) => item.students && combinedLogs.push({ id: `aa-${item.id}`, timestamp: item.created_at, description: <>غياب أكاديمي لـ <b>{item.students.name}</b></>, icon: <ClipboardListIcon className="w-5 h-5 text-red-500" /> }));
                dormPermissionsLogs.data?.forEach((item: any) => item.students && combinedLogs.push({ id: `dp-${item.id}`, timestamp: item.created_at, description: <>إذن مهجع لـ <b>{item.students.name}</b></>, icon: <PermissionIcon className="w-5 h-5 text-purple-500" /> }));
                combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setActivityLogs(combinedLogs.slice(0, 10));

            } catch (error: any) {
                console.error("Gagal mengambil data dasbor:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [isReady, academicYear, semester]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الرئيسية</h2>
            
            {loading ? <div className="text-center py-4 text-slate-500">...جاري تحميل الإحصائيات</div> : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="إذن أكاديمي" value={stats.academicPermissions} icon={<CheckCircleIcon className="w-6 h-6" />} />
                    <StatCard title="غياب أكاديمي" value={stats.academicAbsences} icon={<ClipboardListIcon className="w-6 h-6" />} />
                    <StatCard title="إذن المهجع" value={stats.dormPermissions} icon={<PermissionIcon className="w-6 h-6" />} />
                    <StatCard title="غياب المهجع" value={stats.dormAbsences} icon={<ClipboardListIcon className="w-6 h-6" />} />
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ModuleCard 
                        icon={<AcademicIcon className="w-8 h-8 text-teal-600"/>}
                        title="الشؤون الأكاديمية"
                        onClick={() => setCurrentView('academic')}
                        color="border-teal-500"
                    />
                     <ModuleCard 
                        icon={<DormitoryIcon className="w-8 h-8 text-purple-600"/>}
                        title="شؤون المهجع"
                        onClick={() => setCurrentView('dormitory')}
                        color="border-purple-500"
                    />
                     <ModuleCard 
                        icon={<UsersIcon className="w-8 h-8 text-sky-600"/>}
                        title="إدارة المستخدمين"
                        onClick={() => setCurrentView('users')}
                        color="border-sky-500"
                    />
                    <ModuleCard 
                        icon={<SettingsIcon className="w-8 h-8 text-slate-600"/>}
                        title="الإعدادات"
                        onClick={() => setCurrentView('settings')}
                        color="border-slate-500"
                    />
                </div>
                
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 h-full">
                        <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-6 h-6 text-red-500"/> تنبيهات الغياب</h3>
                        {loading ? <div className="text-center py-8 text-slate-500">...</div> : highAbsenceStudents.length > 0 ? (
                            <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                               {highAbsenceStudents.map(student => (
                                   <li key={student.studentId} className="flex justify-between items-center text-sm">
                                       <span className="font-semibold text-slate-600">{student.name}</span>
                                       <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{student.count} غيابات</span>
                                   </li>
                               ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-slate-500">لا توجد تنبيهات.</div>
                        )}
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><BellIcon className="w-6 h-6 text-teal-500"/> الأنشطة الأخيرة</h3>
                        {loading ? <div className="text-center py-8 text-slate-500">...</div> : activityLogs.length > 0 ? (
                            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                               {activityLogs.map(log => (
                                   <div key={log.id} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 bg-slate-100 rounded-full p-2 mt-1">{log.icon}</div>
                                        <div>
                                            <p className="text-slate-700 text-sm">{log.description}</p>
                                            <p className="text-xs text-slate-400">{formatTimeAgo(log.timestamp)}</p>
                                        </div>
                                   </div>
                               ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">لا توجد أنشطة.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
