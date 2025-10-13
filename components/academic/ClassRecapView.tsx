import React, { useState, useMemo } from 'react';
import { RecapStatus, StudentRecapData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';
import { useAcademicData } from '../../contexts/AcademicDataContext';

interface ClassRecapViewProps {
  onStudentSelect: (studentId: string) => void;
}

export const ClassRecapView: React.FC<ClassRecapViewProps> = ({ onStudentSelect }) => {
    const { classes, records: allRecords, loading } = useAcademicData();
    const [selectedClassId, setSelectedClassId] = useState('');
    
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
             <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="text-center p-8">...جاري تحميل البيانات</div>
             </div>
        </div>
       )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الفصل</h2>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
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
                         <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <PrinterIcon className="w-5 h-5" />
                            <span>تصدير إلى PDF</span>
                        </button>
                    )}
                </div>
            </div>

            {selectedClassId && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">
                        ملخص {classes.find(c => c.id === selectedClassId)?.name}
                    </h3>
                    {loading ? <div className="text-center p-8">...جاري تحديث البيانات</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600 responsive-table">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-6 py-3 whitespace-nowrap">اسم الطالب</th>
                                    <th className="px-6 py-3 whitespace-nowrap">غائب</th>
                                    <th className="px-6 py-3 whitespace-nowrap">إذن</th>
                                    <th className="px-6 py-3 whitespace-nowrap">مرض</th>
                                    <th className="px-6 py-3 whitespace-nowrap">المجموع</th>
                                    <th className="px-6 py-3 whitespace-nowrap">مجموع الأيام</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classRecapData.map(data => (
                                    <tr key={data.studentId} className="bg-white border-b hover:bg-slate-50">
                                        <td data-label="اسم الطالب" className="px-6 py-4 font-semibold whitespace-nowrap">
                                          <button onClick={() => onStudentSelect(data.studentId)} className="text-right w-full hover:text-teal-600 hover:underline cursor-pointer">
                                              {data.studentName}
                                          </button>
                                        </td>
                                        <td data-label="غائب" className="px-6 py-4 whitespace-nowrap">{data.absentCount}</td>
                                        <td data-label="إذن" className="px-6 py-4 whitespace-nowrap">{data.permissionCount}</td>
                                        <td data-label="مرض" className="px-6 py-4 whitespace-nowrap">{data.sickCount}</td>
                                        <td data-label="المجموع" className="px-6 py-4 font-bold whitespace-nowrap">{data.total}</td>
                                        <td data-label="مجموع الأيام" className="px-6 py-4 font-bold text-teal-600 whitespace-nowrap">{data.uniqueDays}</td>
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
