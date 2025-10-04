import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceRecord, RecapStatus, Class, StudentRecapData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';
import { supabase } from '../../supabaseClient';

export const ClassRecapView: React.FC = () => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [classes, setClasses] = useState<Class[]>([]);
    const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
            if (classesError) throw classesError;
            setClasses(classesData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
            if (studentsError) throw studentsError;

            const { data: permissionsData, error: permissionsError } = await supabase.from('academic_permissions').select('*');
            if (permissionsError) throw permissionsError;

            const { data: absencesData, error: absencesError } = await supabase.from('academic_absences').select('*');
            if (absencesError) throw absencesError;
            
            const studentsMap = new Map(studentsData.map(s => [s.id, s]));
            
            const combined: AttendanceRecord[] = [];

            (permissionsData || []).forEach(p => {
                const student = studentsMap.get(p.studentId);
                if (!student) return;
                combined.push({
                    id: `p-${p.id}`,
                    studentId: p.studentId,
                    studentName: student.name,
                    classId: student.classId || '',
                    className: '', // not needed for this calculation
                    date: p.date,
                    status: p.type === 'sakit' ? RecapStatus.SICK : RecapStatus.PERMISSION,
                });
            });

            (absencesData || []).forEach(a => {
                const student = studentsMap.get(a.studentId);
                if (!student) return;
                combined.push({
                    id: `a-${a.id}`,
                    studentId: a.studentId,
                    studentName: student.name,
                    classId: student.classId || '',
                    className: '', // not needed for this calculation
                    date: a.date,
                    status: RecapStatus.ABSENT,
                });
            });
            
            setAllRecords(combined);
        } catch (error: any) {
             alert(`فشل في جلب البيانات: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const classRecapData = useMemo((): StudentRecapData[] => {
        if (!selectedClassId) return [];

        const classRecords = allRecords.filter(r => r.classId === selectedClassId);
        const studentDataMap = new Map<string, StudentRecapData>();

        for (const record of classRecords) {
            if (!studentDataMap.has(record.studentId)) {
                studentDataMap.set(record.studentId, {
                    studentId: record.studentId,
                    studentName: record.studentName,
                    absentCount: 0,
                    permissionCount: 0,
                    sickCount: 0,
                    total: 0,
                    uniqueDays: 0,
                });
            }
            const studentData = studentDataMap.get(record.studentId)!;
            studentData.total++;
            if (record.status === RecapStatus.ABSENT) studentData.absentCount++;
            if (record.status === RecapStatus.PERMISSION) studentData.permissionCount++;
            if (record.status === RecapStatus.SICK) studentData.sickCount++;
        }

        // Calculate unique days
        studentDataMap.forEach(data => {
            const studentRecords = classRecords.filter(r => r.studentId === data.studentId);
            const uniqueDates = new Set(studentRecords.map(r => r.date));
            data.uniqueDays = uniqueDates.size;
        });

        return Array.from(studentDataMap.values()).sort((a,b) => a.studentName.localeCompare(b.studentName));
    }, [selectedClassId, allRecords]);
    
    if (loading && !selectedClassId) {
       return (
         <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الفصل</h2>
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="text-center p-8">...جاري تحميل البيانات</div>
             </div>
        </div>
       )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الفصل</h2>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                     <div>
                        <label htmlFor="class-select-recap" className="block text-lg font-semibold text-slate-700 mb-2">اختر الفصل الدراسي</label>
                        <select
                            id="class-select-recap"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-full md:w-80 p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">-- اختر لعرض البيانات --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {selectedClassId && (
                         <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <PrinterIcon className="w-5 h-5" />
                            <span>تصدير إلى PDF</span>
                        </button>
                    )}
                </div>
            </div>

            {selectedClassId && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">
                        ملخص {classes.find(c => c.id === selectedClassId)?.name}
                    </h3>
                    {loading ? <div className="text-center p-8">...جاري تحديث البيانات</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-6 py-3">اسم الطالب</th>
                                    <th className="px-6 py-3">غائب</th>
                                    <th className="px-6 py-3">إذن</th>
                                    <th className="px-6 py-3">مرض</th>
                                    <th className="px-6 py-3">المجموع</th>
                                    <th className="px-6 py-3">مجموع الأيام</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classRecapData.map(data => (
                                    <tr key={data.studentId} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold">{data.studentName}</td>
                                        <td className="px-6 py-4">{data.absentCount}</td>
                                        <td className="px-6 py-4">{data.permissionCount}</td>
                                        <td className="px-6 py-4">{data.sickCount}</td>
                                        <td className="px-6 py-4 font-bold">{data.total}</td>
                                        <td className="px-6 py-4 font-bold text-teal-600">{data.uniqueDays}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {classRecapData.length === 0 && (
                            <p className="text-center text-slate-500 py-8">لا توجد سجلات غياب لهذا الفصل.</p>
                        )}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
};