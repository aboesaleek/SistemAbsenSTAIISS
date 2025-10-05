import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';


export const PermissionsView: React.FC = () => {
    // Form State
    const [permissionType, setPermissionType] = useState<DormitoryPermissionType>(DormitoryPermissionType.GENERAL_LEAVE);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [numberOfDays, setNumberOfDays] = useState(1);
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    
    // Student Selection State
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    // Data State
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [groupSelectedDormId, setGroupSelectedDormId] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');

    const dormitoriesMap = useMemo(() => new Map(dormitories.map(d => [d.id, d.name])), [dormitories]);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('dormitory_id', 'is', null);
            if (studentsError) throw studentsError;
            setStudents(studentsData.sort((a,b) => a.name.localeCompare(b.name)) || []);
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

    const resetForm = () => {
        setSearchQuery('');
        setSelectedDormitoryId('');
        setSelectedStudentId('');
        setSelectedStudentIds(new Set());
        setGroupSelectedDormId('');
        setNumberOfDays(1);
        setReason('');
    }

    useEffect(() => {
        resetForm(); // Reset selections when permission type changes
    }, [permissionType]);


    // Memos for filtering and searching students
    const filteredStudentsByDormitory = useMemo(() => {
        if (!selectedDormitoryId) return [];
        return students.filter(s => s.dormitory_id === selectedDormitoryId);
    }, [selectedDormitoryId, students]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, students]);

    const groupLeaveStudents = useMemo(() => {
        if (!groupSelectedDormId) return [];
        return students.filter(student => {
            const matchesDorm = student.dormitory_id === groupSelectedDormId;
            const matchesSearch = !searchQuery || student.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDorm && matchesSearch;
        });
    }, [students, groupSelectedDormId, searchQuery]);


    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedDormitoryId(student.dormitory_id || '');
        setTimeout(() => setSelectedStudentId(student.id), 0);
        setShowSearchResults(false);
    };

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

        const isGroup = permissionType === DormitoryPermissionType.GROUP_LEAVE;
        const studentIds = isGroup ? Array.from(selectedStudentIds) : (selectedStudentId ? [selectedStudentId] : []);
        
        if (studentIds.length === 0 || !date) {
            setMessage({ type: 'error', text: 'يرجى اختيار طالب واحد على الأقل وتحديد التاريخ.' });
            return;
        }

        if (permissionType === DormitoryPermissionType.OVERNIGHT_LEAVE) {
            const selectedDate = new Date(date);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);

            const { count, error: checkError } = await supabase
                .from('dormitory_permissions')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', studentIds[0])
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
        }
        
        const permissionsToInsert = studentIds.map(studentId => ({
            student_id: studentId,
            date,
            type: permissionType,
            number_of_days: numberOfDays,
            reason,
        }));

        const { error } = await supabase.from('dormitory_permissions').insert(permissionsToInsert);

        if (error) {
            setMessage({ type: 'error', text: `فشل تسجيل الإذن: ${error.message}` });
        } else {
            setMessage({ type: 'success', text: `تم تسجيل الإذن لـ ${permissionsToInsert.length} طالب بنجاح.` });
            resetForm();
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    const permissionTypes = [
        { value: DormitoryPermissionType.GENERAL_LEAVE, label: 'إذن خروج فردي' },
        { value: DormitoryPermissionType.SICK_LEAVE, label: 'إذن خروج للمريض' },
        { value: DormitoryPermissionType.OVERNIGHT_LEAVE, label: 'إذن مبيت' },
        { value: DormitoryPermissionType.GROUP_LEAVE, label: 'إذن خروج جماعي' },
    ];

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">تسجيل إذن المهجع</h2>
            {message && (
                <div className={`p-4 mb-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-lg font-semibold text-slate-700 mb-3">نوع الإذن</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {permissionTypes.map(pt => (
                             <label key={pt.value} className={`flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${permissionType === pt.value ? 'bg-purple-500 border-purple-600 text-white shadow-md' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                                <input 
                                    type="radio" 
                                    name="permissionType" 
                                    value={pt.value}
                                    checked={permissionType === pt.value}
                                    onChange={() => setPermissionType(pt.value)}
                                    className="sr-only"
                                />
                                <span className="text-sm font-bold text-center">{pt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                        {permissionType === DormitoryPermissionType.GROUP_LEAVE ? `تحديد الطلاب (${selectedStudentIds.size} محدد)` : 'تحديد الطالب'}
                    </h3>
                    {permissionType === DormitoryPermissionType.GROUP_LEAVE ? (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <input type="text" placeholder="بحث باسم الطالب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" disabled={!groupSelectedDormId} />
                                <select value={groupSelectedDormId} onChange={e => { setGroupSelectedDormId(e.target.value); setSearchQuery(''); }} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                                    <option value="">-- اختر المهجع لعرض الطلاب --</option>
                                    {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            {!groupSelectedDormId ? (
                                <div className="text-center p-4 bg-slate-100 rounded-lg mt-2">
                                    <p className="text-slate-600">اختر المهجع أعلاه لعرض قائمة الطلاب.</p>
                                </div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto border p-2 rounded-lg bg-slate-50 mt-2">
                                    {groupLeaveStudents.length > 0 ? groupLeaveStudents.map(student => (
                                        <label key={student.id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-100 rounded cursor-pointer">
                                            <div>
                                                <input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => handleStudentToggle(student.id)} className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-slate-400 mr-3"/>
                                                {student.name}
                                            </div>
                                        </label>
                                    )) : <p className="text-center text-slate-500 p-4">لم يتم العثور على طلاب.</p>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div className="relative">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <select id="dormitory-select" value={selectedDormitoryId} onChange={e => setSelectedDormitoryId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500">
                                        <option value="">-- اختر المهجع --</option>
                                        {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <select id="student-select" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={!selectedDormitoryId} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100">
                                        <option value="">-- اختر الطالب --</option>
                                        {filteredStudentsByDormitory.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                 <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="permission-date" className="block text-lg font-semibold text-slate-700 mb-2">تاريخ الإذن</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"><CalendarIcon className="w-5 h-5" /></span>
                            <input type="date" id="permission-date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="days-select" className="block text-lg font-semibold text-slate-700 mb-2">عدد الأيام</label>
                        <input id="days-select" type="number" min="1" value={numberOfDays} onChange={e => setNumberOfDays(parseInt(e.target.value, 10) || 1)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/>
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
    );
};