import React, { useState, useMemo, useEffect } from 'react';
import { DormitoryPermissionRecord, DormitoryRecapStatus, Dormitory } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { supabase } from '../../supabaseClient';

const statusColorMap: { [key in DormitoryRecapStatus]: string } = {
  [DormitoryRecapStatus.IZIN_KELUAR]: 'bg-blue-100 text-blue-800',
  [DormitoryRecapStatus.IZIN_PULANG]: 'bg-green-100 text-green-800',
};

export const RecapView: React.FC = () => {
    const [records, setRecords] = useState<DormitoryPermissionRecord[]>([]);
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);
            const dormsMap = new Map((dormsData || []).map(d => [d.id, d.name]));

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name, dormitoryId');
            if (studentsError) throw studentsError;
            const studentsMap = new Map((studentsData || []).map(s => [s.id, s]));

            const { data: permissionsData, error: permissionsError } = await supabase.from('dormitory_permissions').select('*');
            if (permissionsError) throw permissionsError;

            const fetchedRecords = (permissionsData || []).map(p => {
                const student = studentsMap.get(p.studentId);
                const dormitoryName = student ? dormsMap.get(student.dormitoryId) : 'N/A';
                return {
                    id: p.id,
                    studentId: p.studentId,
                    studentName: student?.name || 'طالب محذوف',
                    dormitoryId: student?.dormitoryId || '',
                    dormitoryName: dormitoryName || 'N/A',
                    date: p.date,
                    status: p.type as DormitoryRecapStatus,
                    numberOfDays: p.numberOfDays,
                    reason: p.reason
                };
            }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setRecords(fetchedRecords);

        } catch (error: any) {
            console.error(`فشل في جلب البيانات: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

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

    const deleteRecord = async (id: string) => {
        const { error } = await supabase.from('dormitory_permissions').delete().eq('id', id);
        if (error) {
            console.error(`فشل الحذف: ${error.message}`);
        } else {
            fetchData();
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

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
                        {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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