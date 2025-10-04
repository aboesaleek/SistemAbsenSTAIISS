import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { supabase } from '../../supabaseClient';

// Tipe data khusus untuk tampilan ini
interface GroupLeaveRecord {
    id: string;
    studentId: string;
    studentName: string;
    dormitoryId: string;
    dormitoryName: string;
    date: string;
    numberOfDays: number;
    reason?: string;
}

export const GroupLeaveRecapView: React.FC = () => {
    const [records, setRecords] = useState<GroupLeaveRecord[]>([]);
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);
            const dormsMap = new Map((dormsData || []).map(d => [d.id, d.name]));

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name, dormitory_id');
            if (studentsError) throw studentsError;
            const studentsMap = new Map<string, Student>((studentsData || []).map(s => [s.id, s]));

            const { data: permissionsData, error: permissionsError } = await supabase
                .from('dormitory_permissions')
                .select('*')
                .eq('type', DormitoryPermissionType.GROUP_LEAVE);

            if (permissionsError) throw permissionsError;

            const fetchedRecords = (permissionsData || []).map((p: any) => {
                const student = studentsMap.get(p.student_id);
                const dormitoryName = student ? dormsMap.get(student.dormitory_id) : 'N/A';
                return {
                    id: p.id,
                    studentId: p.student_id,
                    studentName: student?.name || 'طالب محذوف',
                    dormitoryId: student?.dormitory_id || '',
                    dormitoryName: dormitoryName || 'N/A',
                    date: p.date,
                    numberOfDays: p.number_of_days,
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
            return matchesSearch && matchesDormitory;
        });
    }, [records, searchQuery, selectedDormitoryId]);

    const deleteRecord = async (id: string) => {
        const { error } = await supabase.from('dormitory_permissions').delete().eq('id', id);
        if (error) {
            console.error(`فشل الحذف: ${error.message}`);
        } else {
            fetchData();
        }
    };

    const handlePrint = () => {
        window.print();
    };
    
    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <div className="no-print">
                <h2 className="text-3xl font-bold text-slate-800">ملخص إذن الخروج الجماعي</h2>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4 no-print">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                     <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        <PrinterIcon className="w-5 h-5" />
                        <span>تصدير إلى PDF</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 printable-area">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 hidden print:block">ملخص إذن الخروج الجماعي</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">اسم الطالب</th>
                                <th className="px-6 py-3">المهجع</th>
                                <th className="px-6 py-3">التاريخ</th>
                                <th className="px-6 py-3">عدد الأيام</th>
                                <th className="px-6 py-3">البيان</th>
                                <th className="px-6 py-3 no-print">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, index) => (
                                <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4 font-semibold">{record.studentName}</td>
                                    <td className="px-6 py-4">{record.dormitoryName}</td>
                                    <td className="px-6 py-4">{record.date}</td>
                                    <td className="px-6 py-4">{record.numberOfDays}</td>
                                    <td className="px-6 py-4 text-slate-500">{record.reason || '-'}</td>
                                    <td className="px-6 py-4 no-print">
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
