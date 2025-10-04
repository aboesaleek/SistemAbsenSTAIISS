import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionRecord, DormitoryRecapStatus } from '../../types';
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
    let accumulatedPercent = 0;

    return (
        <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الأذونات</h4>
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
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allRecords, setAllRecords] = useState<any[]>([]);
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
                
                setAllRecords(permissionsData || []);

            } catch (error: any) {
                console.error(`فشل في جلب البيانات: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const studentData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = allRecords.filter(r => r.student_id === selectedStudentId);
        const izinKeluarRecords = records.filter(r => r.type === DormitoryRecapStatus.IZIN_KELUAR);
        const izinPulangRecords = records.filter(r => r.type === DormitoryRecapStatus.IZIN_PULANG);
        const uniqueDays = new Set(records.map(r => r.date)).size;
        return { izinKeluarRecords, izinPulangRecords, uniqueDays, allRecords: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [selectedStudentId, allRecords]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return students.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, students]);
    
    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedDormitoryId(student.dormitory_id || '');
        // Allow state to update before setting the student
        setTimeout(() => {
            setSelectedStudentId(student.id);
        }, 0);
        setShowSearchResults(false);
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الطالب (المهجع)</h2>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                         <input
                            type="text"
                            placeholder="بحث باسم الطالب..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setShowSearchResults(true);
                                setSelectedStudentId('');
                            }}
                            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                            className="w-full p-2 border border-slate-300 rounded-lg"
                        />
                        {showSearchResults && searchedStudents.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {searchedStudents.map(student => (
                                    <li
                                        key={student.id}
                                        className="p-3 hover:bg-purple-100 cursor-pointer"
                                        onClick={() => handleStudentSearchSelect(student)}
                                    >
                                        {student.name} - <span className="text-sm text-slate-500">{dormitories.find(d => d.id === student.dormitory_id)?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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
                        disabled={!selectedDormitoryId}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                    >
                        <option value="">-- اختر الطالب --</option>
                        {students.filter(s => s.dormitory_id === selectedDormitoryId).map(s => (
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
                                <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-xl">
                                    <p className="text-lg font-semibold">مجموع أيام الإذن</p>
                                    <p className="text-7xl font-extrabold tracking-tighter">{studentData.uniqueDays}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard label="إذن خروج" value={studentData.izinKeluarRecords.length} gradient="from-blue-500 to-sky-500" />
                                    <StatCard label="إذن عودة" value={studentData.izinPulangRecords.length} gradient="from-green-500 to-emerald-500" />
                                </div>
                            </div>
                             <DonutChart data={[
                                {label: 'خروج', value: studentData.izinKeluarRecords.length, color: 'text-blue-500', bgColor: 'bg-blue-500'},
                                {label: 'عودة', value: studentData.izinPulangRecords.length, color: 'text-green-500', bgColor: 'bg-green-500'},
                            ]} />
                        </div>
                    </div>
                
                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل سجل الأذونات</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right text-slate-600">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3">التاريخ</th>
                                        <th className="px-4 py-3">النوع</th>
                                        <th className="px-4 py-3">الأيام</th>
                                        <th className="px-4 py-3">البيان</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentData.allRecords.length > 0 ? studentData.allRecords.map(r => (
                                        <tr key={r.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-4 py-3">{r.date}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.type === DormitoryRecapStatus.IZIN_KELUAR ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{r.number_of_days}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.reason || '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center text-slate-500 py-8">لا توجد سجلات أذونات لهذا الطالب.</td>
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