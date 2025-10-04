import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student, AttendanceRecord, RecapStatus } from '../../types';
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
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الغياب</h4>
            <p className="text-slate-500">لا توجد بيانات لعرضها.</p>
        </div>
       )
    }
    const radius = 15.9155;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    return (
        <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الغياب</h4>
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r={radius} className="stroke-current text-slate-200" strokeWidth="3" fill="transparent" />
                    {data.map((item, index) => {
                        if (item.value === 0) return null;
                        const percent = (item.value / total) * 100;
                        const strokeDashoffset = circumference - (accumulatedPercent / 100) * circumference;
                        accumulatedPercent += percent;
                        return (
                            <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r={radius}
                                className={`stroke-current ${item.color}`}
                                strokeWidth="3.2"
                                fill="transparent"
                                strokeDasharray={`${circumference} ${circumference}`}
                                style={{ strokeDashoffset }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-700">{total}</span>
                    <span className="text-sm text-slate-500">مجموع</span>
                </div>
            </div>
            <div className="mt-6 w-full flex justify-center gap-4 text-sm">
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


export const StudentRecapView: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
                if (classesError) throw classesError;
                setClasses(classesData || []);

                const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('classId', 'is', null);
                if (studentsError) throw studentsError;
                setStudents(studentsData || []);
                
                const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
                if (coursesError) throw coursesError;
                const coursesMap = new Map((coursesData || []).map(c => [c.id, c.name]));

                const { data: permissionsData, error: permissionsError } = await supabase.from('academic_permissions').select('*');
                if (permissionsError) throw permissionsError;

                const { data: absencesData, error: absencesError } = await supabase.from('academic_absences').select('*');
                if (absencesError) throw absencesError;
                
                const combined: AttendanceRecord[] = [];

                (permissionsData || []).forEach(p => {
                    combined.push({
                        id: `p-${p.id}`,
                        studentId: p.studentId,
                        studentName: '', className: '', classId: '',
                        date: p.date,
                        status: p.type === 'sakit' ? RecapStatus.SICK : RecapStatus.PERMISSION,
                    });
                });

                (absencesData || []).forEach(a => {
                    combined.push({
                        id: `a-${a.id}`,
                        studentId: a.studentId,
                        studentName: '', className: '', classId: '',
                        date: a.date,
                        status: RecapStatus.ABSENT,
                        courseName: coursesMap.get(a.courseId) || 'غير معروف',
                    });
                });
                
                setAllRecords(combined);
            } catch (error: any) {
                alert(`فشل في جلب البيانات: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const studentData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = allRecords.filter(r => r.studentId === selectedStudentId);
        const absentRecords = records.filter(r => r.status === RecapStatus.ABSENT);
        const permissionRecords = records.filter(r => r.status === RecapStatus.PERMISSION);
        const sickRecords = records.filter(r => r.status === RecapStatus.SICK);
        const uniqueDays = new Set(records.map(r => r.date)).size;
        return { absentRecords, permissionRecords, sickRecords, uniqueDays };
    }, [selectedStudentId, allRecords]);

    const filteredStudents = useMemo(() => {
        let result = students;
        if (selectedClassId) {
            result = result.filter(s => s.classId === selectedClassId);
        }
        if (searchQuery) {
            result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return result;
    }, [students, selectedClassId, searchQuery]);

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الطالب</h2>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setSelectedStudentId(''); }}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <select
                        value={selectedClassId}
                        onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">-- اختر الفصل --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    <div className="p-6 bg-white rounded-2xl shadow-lg border">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">{students.find(s=>s.id === selectedStudentId)?.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col justify-between space-y-4">
                                <div className="text-center p-6 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-xl shadow-xl">
                                    <p className="text-lg font-semibold">مجموع أيام الغياب</p>
                                    <p className="text-7xl font-extrabold tracking-tighter">{studentData.uniqueDays}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <StatCard label="غائب" value={studentData.absentRecords.length} gradient="from-red-500 to-orange-500" />
                                    <StatCard label="إذن" value={studentData.permissionRecords.length} gradient="from-blue-500 to-sky-500" />
                                    <StatCard label="مرض" value={studentData.sickRecords.length} gradient="from-amber-500 to-yellow-500" />
                                </div>
                            </div>
                            <DonutChart data={[
                                {label: 'غائب', value: studentData.absentRecords.length, color: 'text-red-500', bgColor: 'bg-red-500'},
                                {label: 'إذن', value: studentData.permissionRecords.length, color: 'text-blue-500', bgColor: 'bg-blue-500'},
                                {label: 'مرض', value: studentData.sickRecords.length, color: 'text-amber-500', bgColor: 'bg-amber-500'},
                            ]} />
                        </div>
                    </div>
                
                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل السجل</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-red-50/70 p-4 rounded-lg border border-red-200/80">
                                <h4 className="font-bold text-red-800 mb-2 border-b-2 border-red-200 pb-2">سجل الغياب</h4>
                                <ul className="space-y-2 text-sm text-red-900">
                                    {studentData.absentRecords.length > 0 ? studentData.absentRecords.map(r => (
                                        <li key={r.id}><strong>{r.date}:</strong> {r.courseName}</li>
                                    )) : <li className="text-slate-500">لا يوجد</li>}
                                </ul>
                            </div>
                            <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200/80">
                                <h4 className="font-bold text-blue-800 mb-2 border-b-2 border-blue-200 pb-2">سجل الإذن</h4>
                                <ul className="space-y-2 text-sm text-blue-900">
                                    {studentData.permissionRecords.length > 0 ? studentData.permissionRecords.map(r => (
                                        <li key={r.id}><strong>{r.date}</strong></li>
                                    )) : <li className="text-slate-500">لا يوجد</li>}
                                </ul>
                            </div>
                            <div className="bg-yellow-50/70 p-4 rounded-lg border border-yellow-200/80">
                                <h4 className="font-bold text-yellow-800 mb-2 border-b-2 border-yellow-200 pb-2">سجل المرض</h4>
                                <ul className="space-y-2 text-sm text-yellow-900">
                                    {studentData.sickRecords.length > 0 ? studentData.sickRecords.map(r => (
                                        <li key={r.id}><strong>{r.date}</strong></li>
                                    )) : <li className="text-slate-500">لا يوجد</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};