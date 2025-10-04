import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecapStatus, Class } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

// Sample data (in a real app, this would come from an API)
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
  { id: 'r6', studentId: 's5', studentName: 'عمر خالد', classId: 'c3', className: 'الفصل الثالث', date: '2024-05-23', status: RecapStatus.SICK },
];

const statusColorMap: { [key in RecapStatus]: string } = {
  [RecapStatus.ABSENT]: 'bg-red-100 text-red-800',
  [RecapStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [RecapStatus.PERMISSION]: 'bg-blue-100 text-blue-800',
};

export const RecapView: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>(sampleRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = !selectedClassId || record.classId === selectedClassId;
            const recordDate = new Date(record.date);
            const matchesStartDate = !startDate || recordDate >= new Date(startDate);
            const matchesEndDate = !endDate || recordDate <= new Date(endDate);
            return matchesSearch && matchesClass && matchesStartDate && matchesEndDate;
        });
    }, [records, searchQuery, selectedClassId, startDate, endDate]);

    const deleteRecord = (id: string) => {
        setRecords(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الملخص العام</h2>
            
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
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">كل الفصول</option>
                        {sampleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                                <th className="px-6 py-3">الفصل</th>
                                <th className="px-6 py-3">التاريخ</th>
                                <th className="px-6 py-3">الحالة</th>
                                <th className="px-6 py-3">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, index) => (
                                <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4 font-semibold">{record.studentName}</td>
                                    <td className="px-6 py-4">{record.className}</td>
                                    <td className="px-6 py-4">{record.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
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