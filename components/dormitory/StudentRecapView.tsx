import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermission, DormitoryPermissionType } from '../../types';
import { supabase } from '../../supabaseClient';

const StatCard: React.FC<{ label: string; value: number; gradient: string }> = ({ label, value, gradient }) => (
    <div className={`text-white p-4 rounded-xl shadow-lg bg-gradient-to-br ${gradient}`}>
        <p className="text-sm font-semibold opacity-90">{label}</p>
        <span className="text-4xl font-bold">{value}</span>
    </div>
);

const DonutChart: React.FC<{ data: { label: string; value: number; color: string; bgColor: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) {
       return (
         <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الأذونات</h4>
            <p className="text-slate-500">لا توجد بيانات لعرضها.</p>
        </div>
       )
    }
    const radius = 15.9155;
    const circumference = 2 * Math.PI * radius;
    let accumulatedLength = 0;

    return (
        <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الأذونات</h4>
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r={radius} className="stroke-current text-slate-200" strokeWidth="3" fill="transparent" />
                    {data.map((item, index) => {
                        if (item.value === 0) return null;
                        const segmentLength = (item.value / total) * circumference;
                        const strokeDashoffset = accumulatedLength;
                        accumulatedLength += segmentLength;

                        return (
                            <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r={radius}
                                className={`stroke-current ${item.color}`}
                                strokeWidth="3.2"
                                fill="transparent"
                                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                strokeDashoffset={-strokeDashoffset}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-700">{total}</span>
                    <span className="text-sm text-slate-500">مجموع</span>
                </div>
            </div>
            <div className="mt-6 w-full flex justify-center gap-x-4 gap-y-2 flex-wrap text-sm">
                {data.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${item.bgColor}`}></span>
                        <span className="font-semibold text-slate-600">{item.label}:</span>
                        <span className="font-bold text-slate-800">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface StudentRecapViewProps {
  preselectedStudentId?: string | null;
}

export const StudentRecapView: React.FC<StudentRecapViewProps> = ({ preselectedStudentId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allRecords, setAllRecords] = useState<DormitoryPermission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
                if (dormsError) throw dormsError;
                setDormitories(dormsData || []);

                const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('dormitory_id', 'is', null);
                if (studentsError) throw studentsError;
                setStudents(studentsData || []);
                
                const { data: permissionsData, error: permissionsError } = await supabase.from('dormitory_permissions').select('*');
                if (permissionsError) throw permissionsError;

                const mappedRecords = (permissionsData || []).map((p: any): DormitoryPermission => ({
                    id: p.id,
                    studentId: p.student_id, // Map snake_case to camelCase
                    date: p.date,
                    type: p.type as DormitoryPermissionType,
                    numberOfDays: p.number_of_days, // Map snake_case to camelCase
                    reason: p.reason
                }));
                setAllRecords(mappedRecords);

            } catch (error: any) {
                console.error(`فشل في جلب البيانات: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
      if (preselectedStudentId && students.length > 0) {
        const student = students.find(s => s.id === preselectedStudentId);
        if (student) {
          setSelectedDormitoryId(student.dormitory_id || '');
          setSelectedStudentId(student.id);
        }
      }
    }, [preselectedStudentId, students]);

    const studentData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = allRecords.filter(r => r.studentId === selectedStudentId);
        const sickRecords = records.filter(r => r.type === DormitoryPermissionType.SICK_LEAVE);
        const groupRecords = records.filter(r => r.type === DormitoryPermissionType.GROUP_LEAVE);
        const generalRecords = records.filter(r => r.type === DormitoryPermissionType.GENERAL_LEAVE);
        const overnightRecords = records.filter(r => r.type === DormitoryPermissionType.OVERNIGHT_LEAVE);

        return {
            records: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            sickCount: sickRecords.length,
            groupCount: groupRecords.length,
            generalCount: generalRecords.length,
            overnightCount: overnightRecords.length,
            total: records.length
        };
    }, [selectedStudentId, allRecords]);

    const filteredStudents = useMemo(() => {
        let result = students;
        if (selectedDormitoryId) {
            result = result.filter(s => s.dormitory_id === selectedDormitoryId);
        }
        if (searchQuery) {
            result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return result;
    }, [students, selectedDormitoryId, searchQuery]);

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الطالب</h2>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setSelectedStudentId(''); }}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <select
                        value={selectedDormitoryId}
                        onChange={e => { setSelectedDormitoryId(e.target.value); setSelectedStudentId(''); }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">-- اختر المهجع --</option>
                        {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        disabled={filteredStudents.length === 0}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                    >
                        <option value="">-- اختر الطالب --</option>
                        {filteredStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {studentData && (
                <div className="space-y-6">
                    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg border">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">{students.find(s=>s.id === selectedStudentId)?.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col justify-between space-y-4">
                               <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-xl">
                                    <p className="text-lg font-semibold">مجموع الأذونات</p>
                                    <p className="text-7xl font-extrabold tracking-tighter">{studentData.total}</p>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <StatCard label="مرض" value={studentData.sickCount} gradient="from-red-500 to-orange-500" />
                                    <StatCard label="جماعي" value={studentData.groupCount} gradient="from-sky-500 to-indigo-600" />
                                    <StatCard label="فردي" value={studentData.generalCount} gradient="from-emerald-500 to-teal-600" />
                                    <StatCard label="مبيت" value={studentData.overnightCount} gradient="from-slate-700 to-gray-800" />
                                </div>
                            </div>
                            <DonutChart data={[
                                {label: 'مرض', value: studentData.sickCount, color: 'text-red-500', bgColor: 'bg-red-500'},
                                {label: 'جماعي', value: studentData.groupCount, color: 'text-sky-500', bgColor: 'bg-sky-500'},
                                {label: 'فردي', value: studentData.generalCount, color: 'text-emerald-500', bgColor: 'bg-emerald-500'},
                                {label: 'مبيت', value: studentData.overnightCount, color: 'text-slate-700', bgColor: 'bg-slate-700'},
                            ]} />
                        </div>
                    </div>
                
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل سجل الإذن</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right text-slate-600 responsive-table">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 whitespace-nowrap">#</th>
                                        <th className="px-6 py-3 whitespace-nowrap">التاريخ</th>
                                        <th className="px-6 py-3 whitespace-nowrap">النوع</th>
                                        <th className="px-6 py-3 whitespace-nowrap">عدد الأيام</th>
                                        <th className="px-6 py-3 whitespace-nowrap">البيان</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentData.records.length > 0 ? (
                                        studentData.records.map((record, index) => (
                                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                                <td data-label="#" className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                                <td data-label="التاريخ" className="px-6 py-4 font-semibold whitespace-nowrap">{record.date}</td>
                                                <td data-label="النوع" className="px-6 py-4 whitespace-nowrap">{record.type}</td>
                                                <td data-label="عدد الأيام" className="px-6 py-4 whitespace-nowrap">{record.numberOfDays}</td>
                                                <td data-label="البيان" className="px-6 py-4 text-slate-500 whitespace-nowrap">{record.reason || '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-slate-500">لا يوجد سجل إذن لهذا الطالب.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};