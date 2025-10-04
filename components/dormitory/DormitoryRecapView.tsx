import React, { useState, useMemo, useEffect } from 'react';
import { DormitoryPermissionRecord, DormitoryRecapStatus, Dormitory, DormitoryStudentRecapData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';
import { supabase } from '../../supabaseClient';

export const DormitoryRecapView: React.FC = () => {
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [allRecords, setAllRecords] = useState<DormitoryPermissionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name, dormitoryId');
            if (studentsError) throw studentsError;
            const studentsMap = new Map((studentsData || []).map(s => [s.id, s]));

            const { data: permissionsData, error: permissionsError } = await supabase.from('dormitory_permissions').select('*');
            if (permissionsError) throw permissionsError;

            const fetchedRecords = (permissionsData || []).map(p => {
                const student = studentsMap.get(p.studentId);
                return {
                    id: p.id,
                    studentId: p.studentId,
                    studentName: student?.name || 'طالب محذوف',
                    dormitoryId: student?.dormitoryId || '',
                    dormitoryName: '',
                    date: p.date,
                    status: p.type as DormitoryRecapStatus,
                    numberOfDays: p.numberOfDays
                };
            });
            
            setAllRecords(fetchedRecords);
        } catch (error: any) {
            console.error(`فشل في جلب البيانات: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const dormitoryRecapData = useMemo((): DormitoryStudentRecapData[] => {
        if (!selectedDormitoryId) return [];

        const dormitoryRecords = allRecords.filter(r => r.dormitoryId === selectedDormitoryId);
        const studentDataMap = new Map<string, DormitoryStudentRecapData>();

        for (const record of dormitoryRecords) {
            if (!studentDataMap.has(record.studentId)) {
                studentDataMap.set(record.studentId, {
                    studentId: record.studentId,
                    studentName: record.studentName,
                    izinKeluarCount: 0,
                    izinPulangCount: 0,
                    total: 0,
                    uniqueDays: 0,
                });
            }
            const studentData = studentDataMap.get(record.studentId)!;
            studentData.total++;
            if (record.status === DormitoryRecapStatus.IZIN_KELUAR) studentData.izinKeluarCount++;
            if (record.status === DormitoryRecapStatus.IZIN_PULANG) studentData.izinPulangCount++;
        }

        studentDataMap.forEach(data => {
            const studentRecords = dormitoryRecords.filter(r => r.studentId === data.studentId);
            const uniqueDates = new Set(studentRecords.map(r => r.date));
            data.uniqueDays = uniqueDates.size;
        });

        return Array.from(studentDataMap.values()).sort((a,b) => a.studentName.localeCompare(b.studentName));
    }, [selectedDormitoryId, allRecords]);
    
    if (loading && !selectedDormitoryId) {
        return (
         <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص المهجع</h2>
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="text-center p-8">...جاري تحميل البيانات</div>
             </div>
        </div>
       )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص المهجع</h2>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                     <div>
                        <label htmlFor="dorm-select-recap" className="block text-lg font-semibold text-slate-700 mb-2">اختر المهجع</label>
                        <select
                            id="dorm-select-recap"
                            value={selectedDormitoryId}
                            onChange={e => setSelectedDormitoryId(e.target.value)}
                            className="w-full md:w-80 p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">-- اختر لعرض البيانات --</option>
                            {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    {selectedDormitoryId && (
                         <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <PrinterIcon className="w-5 h-5" />
                            <span>تصدير إلى PDF</span>
                        </button>
                    )}
                </div>
            </div>

            {selectedDormitoryId && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">
                        ملخص {dormitories.find(d => d.id === selectedDormitoryId)?.name}
                    </h3>
                    {loading ? <div className="text-center p-8">...جاري تحديث البيانات</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-6 py-3">اسم الطالب</th>
                                    <th className="px-6 py-3">إذن خروج</th>
                                    <th className="px-6 py-3">إذن عودة</th>
                                    <th className="px-6 py-3">المجموع</th>
                                    <th className="px-6 py-3">مجموع الأيام</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dormitoryRecapData.map(data => (
                                    <tr key={data.studentId} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold">{data.studentName}</td>
                                        <td className="px-6 py-4">{data.izinKeluarCount}</td>
                                        <td className="px-6 py-4">{data.izinPulangCount}</td>
                                        <td className="px-6 py-4 font-bold">{data.total}</td>
                                        <td className="px-6 py-4 font-bold text-purple-600">{data.uniqueDays}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {dormitoryRecapData.length === 0 && (
                            <p className="text-center text-slate-500 py-8">لا توجد سجلات أذونات لهذا المهجع.</p>
                        )}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
};