import React, { useState, useMemo } from 'react';
import { DormitoryPermissionRecord, DormitoryRecapStatus, Dormitory, DormitoryStudentRecapData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';

// Sample data
const sampleDormitories: Dormitory[] = [
    { id: 'd1', name: 'مبنى الشافعي' },
    { id: 'd2', name: 'مبنى أحمد بن حنبل' },
];

const sampleRecords: DormitoryPermissionRecord[] = [
  { id: 'r1', studentId: 's1', studentName: 'عبد الله عمر', dormitoryId: 'd1', dormitoryName: 'مبنى الشافعي', date: '2024-05-20', status: DormitoryRecapStatus.IZIN_KELUAR, numberOfDays: 1 },
  { id: 'r2', studentId: 's2', studentName: 'خالد بن الوليد', dormitoryId: 'd1', dormitoryName: 'مبنى الشافعي', date: '2024-05-21', status: DormitoryRecapStatus.IZIN_PULANG, numberOfDays: 3 },
  { id: 'r3', studentId: 's1', studentName: 'عبد الله عمر', dormitoryId: 'd1', dormitoryName: 'مبنى الشافعي', date: '2024-05-22', status: DormitoryRecapStatus.IZIN_PULANG, numberOfDays: 2 },
  { id: 'r4', studentId: 's3', studentName: 'سلمان الفارسي', dormitoryId: 'd2', dormitoryName: 'مبنى أحمد بن حنبل', date: '2024-05-22', status: DormitoryRecapStatus.IZIN_KELUAR, numberOfDays: 1 },
  { id: 'r5', studentId: 's1', studentName: 'عبد الله عمر', dormitoryId: 'd1', dormitoryName: 'مبنى الشافعي', date: '2024-05-22', status: DormitoryRecapStatus.IZIN_KELUAR, numberOfDays: 1 },
];

export const DormitoryRecapView: React.FC = () => {
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');

    const dormitoryRecapData = useMemo((): DormitoryStudentRecapData[] => {
        if (!selectedDormitoryId) return [];

        const dormitoryRecords = sampleRecords.filter(r => r.dormitoryId === selectedDormitoryId);
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

        return Array.from(studentDataMap.values());
    }, [selectedDormitoryId]);

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
                            {sampleDormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                        ملخص {sampleDormitories.find(d => d.id === selectedDormitoryId)?.name}
                    </h3>
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
                </div>
            )}
        </div>
    );
};