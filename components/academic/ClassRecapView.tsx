import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecapStatus, Class, StudentRecapData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';

// Sample data (can be shared or fetched)
const sampleClasses: Class[] = [
    { id: 'c1', name: 'الفصل الأول' },
    { id: 'c2', name: 'الفصل الثاني' },
    { id: 'c3', name: 'الفصل الثالث' },
];

const sampleRecords: AttendanceRecord[] = [
  { id: 'r1', studentId: 's1', studentName: 'أحمد علي', classId: 'c1', className: 'الفصل الأول', date: '2024-05-20', status: RecapStatus.ABSENT },
  { id: 'r2', studentId: 's2', studentName: 'فاطمة محمد', classId: 'c1', className: 'الفصل الأول', date: '2024-05-20', status: RecapStatus.SICK },
  { id: 'r3', studentId: 's3', studentName: 'يوسف حسن', classId: 'c2', className: 'الفصل الثاني', date: '2024-05-21', status: RecapStatus.ABSENT },
  { id: 'r4', studentId: 's1', studentName: 'أحمد علي', classId: 'c1', className: 'الفصل الأول', date: '2024-05-22', status: RecapStatus.PERMISSION },
  { id: 'r5', studentId: 's4', studentName: 'عائشة عبد الله', classId: 'c2', className: 'الفصل الثاني', date: '2024-05-22', status: RecapStatus.ABSENT },
  { id: 'r6', studentId: 's1', studentName: 'أحمد علي', classId: 'c1', className: 'الفصل الأول', date: '2024-05-22', status: RecapStatus.ABSENT }, // Same day, different status
  { id: 'r7', studentId: 's3', studentName: 'يوسف حسن', classId: 'c2', className: 'الفصل الثاني', date: '2024-05-23', status: RecapStatus.SICK },
];

export const ClassRecapView: React.FC = () => {
    const [selectedClassId, setSelectedClassId] = useState('');

    const classRecapData = useMemo((): StudentRecapData[] => {
        if (!selectedClassId) return [];

        const classRecords = sampleRecords.filter(r => r.classId === selectedClassId);
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

        return Array.from(studentDataMap.values());
    }, [selectedClassId]);

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
                            {sampleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                        ملخص {sampleClasses.find(c => c.id === selectedClassId)?.name}
                    </h3>
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
                </div>
            )}
        </div>
    );
};