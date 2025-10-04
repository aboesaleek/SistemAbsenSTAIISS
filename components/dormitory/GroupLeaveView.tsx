import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PrinterIcon } from '../icons/PrinterIcon';

// Tipe data khusus untuk tampilan rekap
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


export const GroupLeaveView: React.FC = () => {
    // State for Form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dormFilter, setDormFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [numberOfDays, setNumberOfDays] = useState(1);
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // State for Recap
    const [records, setRecords] = useState<GroupLeaveRecord[]>([]);
    const [recapSearchQuery, setRecapSearchQuery] = useState('');
    const [recapSelectedDormId, setRecapSelectedDormId] = useState('');

    // Shared State
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    const dormitoriesMap = useMemo(() => new Map(dormitories.map(d => [d.id, d.name])), [dormitories]);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);
            const dormsMap = new Map((dormsData || []).map(d => [d.id, d.name]));

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('dormitory_id', 'is', null);
            if (studentsError) throw studentsError;
            setStudents(studentsData.sort((a,b) => a.name.localeCompare(b.name)) || []);
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
            setMessage({ type: 'error', text: `فشل في جلب البيانات: ${error.message}` });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    // Memos for Form
    const availableStudents = useMemo(() => {
        return students.filter(student => {
            const matchesDorm = !dormFilter || student.dormitory_id === dormFilter;
            const matchesSearch = !searchQuery || student.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDorm && matchesSearch;
        });
    }, [students, dormFilter, searchQuery]);

    // Memos for Recap
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(recapSearchQuery.toLowerCase());
            const matchesDormitory = !recapSelectedDormId || record.dormitoryId === recapSelectedDormId;
            return matchesSearch && matchesDormitory;
        });
    }, [records, recapSearchQuery, recapSelectedDormId]);

    const handleStudentToggle = (studentId: string) => {
      setSelectedStudentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(studentId)) {
          newSet.delete(studentId);
        } else {
          newSet.add(studentId);
        }
        return newSet;
      });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (selectedStudentIds.size === 0 || !date) {
            setMessage({ type: 'error', text: 'يرجى اختيار طالب واحد على الأقل وتحديد التاريخ.' });
            return;
        }
        
        const permissionsToInsert = Array.from(selectedStudentIds).map(studentId => ({
            student_id: studentId,
            date,
            type: DormitoryPermissionType.GROUP_LEAVE,
            number_of_days: numberOfDays,
            reason,
        }));

        const { error } = await supabase.from('dormitory_permissions').insert(permissionsToInsert);

        if (error) {
            setMessage({ type: 'error', text: `فشل تسجيل الإذن: ${error.message}` });
        } else {
            setMessage({ type: 'success', text: `تم تسجيل الإذن لـ ${permissionsToInsert.length} طالب بنجاح.` });
            setSelectedStudentIds(new Set());
            setNumberOfDays(1);
            setReason('');
            setSearchQuery('');
            setDormFilter('');
            fetchData();
        }
    };
    
    const deleteRecord = async (id: string) => {
        const { error } = await supabase.from('dormitory_permissions').delete().eq('id', id);
        if (error) {
            console.error(`فشل الحذف: ${error.message}`);
        } else {
            fetchData();
        }
    };

    const handlePrint = () => { window.print(); };


    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">إذن الخروج الجماعي</h2>
                 {message && (
                    <div className={`p-4 mb-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="permission-date" className="block text-lg font-semibold text-slate-700 mb-2">تاريخ الإذن</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"><CalendarIcon className="w-5 h-5" /></span>
                                <input type="date" id="permission-date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="days-select" className="block text-lg font-semibold text-slate-700 mb-2">عدد الأيام</label>
                            <select id="days-select" value={numberOfDays} onChange={e => setNumberOfDays(parseInt(e.target.value, 10))} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500">
                                {[...Array(10)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-slate-700 mb-2">الطلاب ({selectedStudentIds.size} محدد)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <input type="text" placeholder="بحث باسم الطالب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg"/>
                            <select value={dormFilter} onChange={e => setDormFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                                <option value="">-- تصفية حسب المهجع --</option>
                                {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                         <div className="max-h-60 overflow-y-auto border p-2 rounded-lg bg-slate-50">
                            {availableStudents.length > 0 ? availableStudents.map(student => (
                                <label key={student.id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-100 rounded cursor-pointer">
                                    <div>
                                        <input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => handleStudentToggle(student.id)} className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-slate-400 mr-3"/>
                                        {student.name}
                                    </div>
                                    <span className="text-sm text-slate-500">{dormitoriesMap.get(student.dormitory_id || '')}</span>
                                </label>
                            )) : <p className="text-center text-slate-500 p-4">لم يتم العثور على طلاب.</p>}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="reason" className="block text-lg font-semibold text-slate-700 mb-2">البيان (اختياري)</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="أضف ملاحظات أو سبب الإذن هنا..." rows={3} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>

                    <div className="pt-4 border-t">
                         <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105">تسجيل الإذن</button>
                    </div>
                </form>
            </div>

            {/* Recap Section */}
            <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 printable-area">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-slate-800">ملخص إذن الخروج الجماعي</h3>
                        <div className="no-print">
                            <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                <PrinterIcon className="w-5 h-5" />
                                <span>تصدير إلى PDF</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 no-print">
                        <input type="text" placeholder="بحث باسم الطالب..." value={recapSearchQuery} onChange={e => setRecapSearchQuery(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg"/>
                        <select value={recapSelectedDormId} onChange={e => setRecapSelectedDormId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                            <option value="">كل المهاجع</option>
                            {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
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
                                            <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRecords.length === 0 && (<p className="text-center text-slate-500 py-8">لا توجد بيانات تطابق معايير البحث.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};
