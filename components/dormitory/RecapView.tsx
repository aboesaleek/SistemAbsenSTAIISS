import React, { useState, useMemo } from 'react';
import { DormitoryPermissionRecord, DormitoryRecapStatus, Dormitory } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

const sampleDormitories: Dormitory[] = [
    { id: 'd1', name: 'مبنى الشافعي' },
    { id: 'd2', name: 'مبنى أحمد بن حنبل' },
];

const sampleRecords: DormitoryPermissionRecord[] = [
  { id: 'r1', studentId: 's1', studentName: 'عبد الله عمر', dormitoryId: 'd1', dormitoryName: 'مبنى الشافعي', date: '2024-05-20', status: DormitoryRecapStatus.IZIN_KELUAR, numberOfDays: 1, reason: 'شراء كتب' },
  { id: 'r2', studentId: 's2', studentName: 'خالد بن الوليد', dormitoryId: 'd1', dormitoryName: 'مبنى الشافعي', date: '2024-05-21', status: DormitoryRecapStatus.IZIN_PULANG, numberOfDays: 3, reason: 'زيارة الأهل' },
  { id: 'r3', studentId: 's3', studentName: 'سلمان الفارسي', dormitoryId: 'd2', dormitoryName: 'مبنى أحمد بن حنبل', date: '2024-05-22', status: DormitoryRecapStatus.IZIN_KELUAR, numberOfDays: 1 },
];

const statusColorMap: { [key in DormitoryRecapStatus]: string } = {
  [DormitoryRecapStatus.IZIN_KELUAR]: 'bg-blue-100 text-blue-800',
  [DormitoryRecapStatus.IZIN_PULANG]: 'bg-green-100 text-green-800',
};

export const RecapView: React.FC = () => {
    const [records, setRecords] = useState<DormitoryPermissionRecord[]>(sampleRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDormitory = !selectedDormitoryId || record.dormitoryId === selectedDormitoryId;
            const recordDate = new Date(record.date);
            const matchesStartDate = !startDate || recordDate >= new Date(startDate);
            const matchesEndDate = !endDate || recordDate <= new Date(endDate);
            return matchesSearch && matchesDormitory && matchesStartDate && matchesEndDate;
        });
    }, [records, searchQuery, selectedDormitoryId, startDate, endDate]);

    const deleteRecord = (id: string) => {
        setRecords(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الملخص العام (المهجع)</h2>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <select
                        value={selectedDormitoryId}
                        onChange={e => setSelectedDormitoryId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">كل المهاجع</option>
                        {sampleDormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    <DownloadIcon className="w-5 h-5" />
                    <span>تصدير إلى Excel</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">اسم الطالب</th>
                                <th className="px-6 py-3">المهجع</th>
                                <th className="px-6 py-3">التاريخ</th>
                                <th className="px-6 py-3">الحالة</th>
                                <th className="px-6 py-3">عدد الأيام</th>
                                <th className="px-6 py-3">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, index) => (
                                <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4 font-semibold">{record.studentName}</td>
                                    <td className="px-6 py-4">{record.dormitoryName}</td>
                                    <td className="px-6 py-4">{record.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{record.numberOfDays}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredRecords.length === 0 && (
                        <p className="text-center text-slate-500 py-8">لا توجد بيانات تطابق معايير البحث.</p>
                    )}
                </div>
            </div>
        </div>
    );
};