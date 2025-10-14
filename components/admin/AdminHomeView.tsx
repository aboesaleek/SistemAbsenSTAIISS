import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { AdminViewType } from '../../pages/AdminDashboard';
import { AcademicIcon } from '../icons/AcademicIcon';
import { DormitoryIcon } from '../icons/DormitoryIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { UserIcon } from '../icons/UserIcon';
import { PermissionIcon } from '../icons/PermissionIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';

// Local interface for unified activity log
interface ActivityLog {
  id: string;
  timestamp: string;
  description: React.ReactNode;
  icon: React.ReactNode;
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
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="w-full text-right bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg hover:border-teal-400 transition-all duration-300 transform hover:-translate-y-1 flex items-start gap-4">
        <div className="bg-teal-100 text-teal-600 rounded-lg p-4">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <p className="text-slate-500 mt-1">{description}</p>
        </div>
    </button>
);

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

export const AdminHomeView: React.FC<AdminHomeViewProps> = ({ setCurrentView }) => {
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState({
        academicPermissions: 0,
        academicAbsences: 0,
        dormPermissions: 0,
        dormAbsences: 0,
    });
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    
    useEffect(() => {
        const fetchRecentActivity = async () => {
            setLoading(true);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            try {
                const [
                    academicPermissions,
                    academicAbsences,
                    dormPermissions,
                    dormPrayerAbsences,
                    dormCeremonyAbsences,
                    newUsers
                ] = await Promise.all([
                    supabase.from('academic_permissions').select('id, created_at, students(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('academic_absences').select('id, created_at, students(name), courses(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('dormitory_permissions').select('id, created_at, type, students(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('dormitory_prayer_absences').select('id, created_at, prayer, students(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('dormitory_ceremony_absences').select('id, created_at, students(name)').gte('created_at', twentyFourHoursAgo),
                    supabase.from('profiles').select('id, created_at, username, role').gte('created_at', twentyFourHoursAgo)
                ]);

                const combinedLogs: ActivityLog[] = [];

                academicPermissions.data?.forEach((item: any) => item.students && combinedLogs.push({
                    id: `ap-${item.id}`, timestamp: item.created_at,
                    description: <>إذن أكاديمي جديد للطالب: <b>{item.students.name}</b></>,
                    icon: <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                }));

                academicAbsences.data?.forEach((item: any) => item.students && item.courses && combinedLogs.push({
                    id: `aa-${item.id}`, timestamp: item.created_at,
                    description: <>غياب أكاديمي جديد للطالب: <b>{item.students.name}</b> في مادة {item.courses.name}</>,
                    icon: <ClipboardListIcon className="w-5 h-5 text-red-500" />
                }));
                
                dormPermissions.data?.forEach((item: any) => item.students && combinedLogs.push({
                    id: `dp-${item.id}`, timestamp: item.created_at,
                    description: <>إذن مهجع جديد ({item.type}) للطالب: <b>{item.students.name}</b></>,
                    icon: <PermissionIcon className="w-5 h-5 text-purple-500" />
                }));
                
                dormPrayerAbsences.data?.forEach((item: any) => item.students && combinedLogs.push({
                    id: `dpa-${item.id}`, timestamp: item.created_at,
                    description: <>غياب صلاة ({item.prayer}) للطالب: <b>{item.students.name}</b></>,
                    icon: <ClipboardListIcon className="w-5 h-5 text-orange-500" />
                }));

                dormCeremonyAbsences.data?.forEach((item: any) => item.students && combinedLogs.push({
                    id: `dca-${item.id}`, timestamp: item.created_at,
                    description: <>غياب مراسم للطالب: <b>{item.students.name}</b></>,
                    icon: <ClipboardListIcon className="w-5 h-5 text-yellow-500" />
                }));

                newUsers.data?.forEach((item: any) => combinedLogs.push({
                    id: `nu-${item.id}`, timestamp: item.created_at,
                    description: <>مستخدم جديد تمت إضافته: <b>{item.username}</b> بدور {item.role}</>,
                    icon: <UserIcon className="w-5 h-5 text-green-500" />
                }));

                combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setActivityLogs(combinedLogs);

            } catch (error: any) {
                console.error("Gagal mengambil aktivitas terbaru:", error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
            setLoadingStats(true);
            const today = new Date().toISOString().split('T')[0];
            try {
                const { count: acPermCount } = await supabase.from('academic_permissions').select('*', { count: 'exact', head: true }).eq('date', today);
                const { count: acAbsCount } = await supabase.from('academic_absences').select('*', { count: 'exact', head: true }).eq('date', today);
                const { count: dormPermCount } = await supabase.from('dormitory_permissions').select('*', { count: 'exact', head: true }).eq('date', today);
                const { count: dormPrayerAbsCount } = await supabase.from('dormitory_prayer_absences').select('*', { count: 'exact', head: true }).eq('date', today);
                const { count: dormCeremonyAbsCount } = await supabase.from('dormitory_ceremony_absences').select('*', { count: 'exact', head: true }).eq('date', today);
                
                setStats({
                    academicPermissions: acPermCount || 0,
                    academicAbsences: acAbsCount || 0,
                    dormPermissions: dormPermCount || 0,
                    dormAbsences: (dormPrayerAbsCount || 0) + (dormCeremonyAbsCount || 0)
                });
            } catch (error: any) {
                 console.error("Gagal mengambil statistik:", error.message);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchRecentActivity();
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الرئيسية</h2>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUpIcon className="w-6 h-6 text-slate-600" />
                    <h3 className="text-xl font-bold text-slate-700">إحصائيات اليوم</h3>
                </div>
                {loadingStats ? <div className="text-center py-4 text-slate-500">...جاري تحميل الإحصائيات</div> : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard title="إذن أكاديمي" value={stats.academicPermissions} icon={<CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />} />
                    <StatCard title="غياب أكاديمي" value={stats.academicAbsences} icon={<ClipboardListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />} />
                    <StatCard title="إذن المهجع" value={stats.dormPermissions} icon={<PermissionIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />} />
                    <StatCard title="غياب المهجع" value={stats.dormAbsences} icon={<ClipboardListIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />} />
                </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ModuleCard 
                    icon={<AcademicIcon className="w-8 h-8"/>}
                    title="إدارة الشؤون الأكاديمية"
                    description="إدارة الفصول والطلاب والمواد الدراسية."
                    onClick={() => setCurrentView('academic')}
                />
                 <ModuleCard 
                    icon={<DormitoryIcon className="w-8 h-8"/>}
                    title="إدارة شؤون المهجع"
                    description="إدارة المهاجع والطلاب المقيمين فيها."
                    onClick={() => setCurrentView('dormitory')}
                />
                 <ModuleCard 
                    icon={<UsersIcon className="w-8 h-8"/>}
                    title="إدارة المستخدمين"
                    description="إضافة وتعديل حسابات المستخدمين."
                    onClick={() => setCurrentView('users')}
                />
            </div>
            
             <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-xl font-bold text-slate-700 mb-4">الأنشطة الأخيرة (آخر 24 ساعة)</h3>
                {loading ? (
                    <div className="text-center py-8 text-slate-500">...جاري تحميل الأنشطة</div>
                ) : activityLogs.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 sm:pr-4">
                       {activityLogs.map(log => (
                           <div key={log.id} className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-slate-100 rounded-full p-2 mt-1">
                                    {log.icon}
                                </div>
                                <div className="flex-grow">
                                    <p className="text-slate-700 text-sm">{log.description}</p>
                                    <p className="text-xs text-slate-400">{formatTimeAgo(log.timestamp)}</p>
                                </div>
                           </div>
                       ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        لا توجد أنشطة في آخر 24 ساعة.
                    </div>
                )}
            </div>
        </div>
    );
};