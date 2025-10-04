import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';

export const OvernightLeaveView: React.FC = () => {
    // State for Form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [numberOfDays, setNumberOfDays] = useState(1);
    const [reason, setReason] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Shared State
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('dormitory_id', 'is', null);
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);

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

    // Memo for Form
    const filteredStudentsByDormitory = useMemo(() => {
        if (!selectedDormitoryId) return [];
        return students.filter(s => s.dormitory_id === selectedDormitoryId);
    }, [selectedDormitoryId, students]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, students]);

    useEffect(() => {
        setSelectedStudentId('');
    }, [selectedDormitoryId]);
    
    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedDormitoryId(student.dormitory_id || '');
        setTimeout(() => setSelectedStudentId(student.id), 0);
        setShowSearchResults(false);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!selectedStudentId || !date) {
            setMessage({ type: 'error', text: 'يرجى اختيار طالب وتحديد التاريخ.' });
            return;
        }

        const selectedDate = new Date(date);
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const { count, error: checkError } = await supabase
            .from('dormitory_permissions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', selectedStudentId)
            .eq('type', DormitoryPermissionType.OVERNIGHT_LEAVE)
            .gte('date', firstDayOfMonth.toISOString().split('T')[0])
            .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

        if (checkError) {
             setMessage({ type: 'error', text: `خطأ في التحقق من الإذن الحالي: ${checkError.message}` });
             return;
        }
        
        if (count && count > 0) {
            setMessage({ type: 'error', text: 'هذا الطالب قد أخذ إذن مبيت بالفعل في هذا الشهر.' });
            return;
        }
        
        const { error } = await supabase.from('dormitory_permissions').insert({
            student_id: selectedStudentId,
            date,
            type: DormitoryPermissionType.OVERNIGHT_LEAVE,
            number_of_days: numberOfDays,
            reason,
        });

        if (error) {
            setMessage({ type: 'error', text: `فشل تسجيل الإذن: ${error.message}` });
        } else {
            setMessage({ type: 'success', text: 'تم تسجيل الإذن بنجاح.' });
            setSearchQuery('');
            setSelectedDormitoryId('');
            setSelectedStudentId('');
            setNumberOfDays(1);
            setReason('');
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">إذن المبيت خارج الجامعة</h2>
             {message && (
                <div className={`p-4 mb-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="permission-date" className="block text-lg font-semibold text-slate-700 mb-2">تاريخ البدء</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"><CalendarIcon className="w-5 h-5" /></span>
                            <input type="date" id="permission-date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/>
                        </div>
                    </div>
                    <div className="relative">
                        <label htmlFor="student-search" className="block text-lg font-semibold text-slate-700 mb-2">بحث عن طالب</label>
                        <input type="text" id="student-search" placeholder="اكتب اسم الطالب للبحث..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 200)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/>
                        {showSearchResults && searchedStudents.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {searchedStudents.map(student => (
                                    <li key={student.id} className="p-3 hover:bg-purple-100 cursor-pointer" onClick={() => handleStudentSearchSelect(student)}>
                                        {student.name} - <span className="text-sm text-slate-500">{dormitories.find(d => d.id === student.dormitory_id)?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="dormitory-select" className="block text-lg font-semibold text-slate-700 mb-2">المهجع</label>
                        <select id="dormitory-select" value={selectedDormitoryId} onChange={e => setSelectedDormitoryId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500">
                            <option value="">-- اختر المهجع --</option>
                            {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="student-select" className="block text-lg font-semibold text-slate-700 mb-2">اسم الطالب</label>
                        <select id="student-select" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={!selectedDormitoryId} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100">
                            <option value="">-- اختر الطالب --</option>
                            {filteredStudentsByDormitory.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="days-input" className="block text-lg font-semibold text-slate-700 mb-2">عدد الأيام</label>
                    <input id="days-input" type="number" min="1" value={numberOfDays} onChange={e => setNumberOfDays(parseInt(e.target.value, 10))} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/>
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
    );
};
