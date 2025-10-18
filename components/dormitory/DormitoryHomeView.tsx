import React, { useMemo, useRef, useEffect } from 'react';
// FIX: DormitoryPermissionType is exported from types.ts, not DormitoryDashboard.tsx.
import { DormitoryViewType } from '../../pages/DormitoryDashboard';
import { DormitoryPermission, DormitoryPermissionType } from '../../types';
import { DocumentReportIcon } from '../icons/DocumentReportIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { ClipboardCheckIcon } from '../icons/ClipboardCheckIcon';
import { useDormitoryData } from '../../contexts/DormitoryDataContext';
import { ChartCard } from '../shared/ChartCard';

declare const Chart: any; // Mendeklarasikan Chart dari global scope untuk TypeScript

const MonthlyPermissionChart: React.FC<{ records: DormitoryPermission[] }> = ({ records }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const chartData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyRecords = records.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });

        const counts = {
            [DormitoryPermissionType.SICK_LEAVE]: 0,
            [DormitoryPermissionType.GROUP_LEAVE]: 0,
            [DormitoryPermissionType.GENERAL_LEAVE]: 0,
            [DormitoryPermissionType.OVERNIGHT_LEAVE]: 0,
        };

        monthlyRecords.forEach(r => {
            if (counts[r.type as DormitoryPermissionType] !== undefined) {
                counts[r.type as DormitoryPermissionType]++;
            }
        });

        return {
            labels: Object.values(DormitoryPermissionType),
            data: Object.values(counts),
        };
    }, [records]);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'عدد الأذونات',
                            data: chartData.data,
                            backgroundColor: [
                                'rgba(234, 179, 8, 0.7)',  // SICK_LEAVE
                                'rgba(59, 130, 246, 0.7)', // GROUP_LEAVE
                                'rgba(16, 185, 129, 0.7)',// GENERAL_LEAVE
                                'rgba(107, 114, 128, 0.7)'// OVERNIGHT_LEAVE
                            ],
                            borderColor: [
                                'rgba(234, 179, 8, 1)',
                                'rgba(59, 130, 246, 1)',
                                'rgba(16, 185, 129, 1)',
                                'rgba(107, 114, 128, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: { display: false },
                            legend: { position: 'top', labels: { font: { family: 'Cairo' } } },
                        },
                    }
                });
            }
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [chartData]);
    
    return <canvas ref={chartRef}></canvas>;
};


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

export const DormitoryHomeView: React.FC<DormitoryHomeViewProps> = ({ navigateTo }) => {
  const { permissionRecords, loading } = useDormitoryData();

  return (
    <div className="space-y-8">
      {!loading && (
        <ChartCard title={`رسم بياني لأذونات شهر ${new Date().toLocaleString('ar-SA', { month: 'long' })}`}>
            <MonthlyPermissionChart records={permissionRecords} />
        </ChartCard>
      )}

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
