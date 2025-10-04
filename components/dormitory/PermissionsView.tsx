import React, { useState, useMemo, useEffect } from 'react';
// FIX: Import DormitoryRecapStatus to use the correct enum for permission types in this view.
import { Dormitory, Student, DormitoryPermissionType, DormitoryRecapStatus } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';


export const PermissionsView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    // FIX: Use DormitoryRecapStatus as it contains the correct values for this form's radio buttons.
    const [permissionType, setPermissionType] = useState<DormitoryRecapStatus>(DormitoryRecapStatus.IZIN_KELUAR);
    const [numberOfDays, setNumberOfDays] = useState(1);
    const [reason, setReason] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredStudentsByDormitory = useMemo(() => {
        if (!selectedDormitoryId) return [];
        return students.filter(s => s.dormitory_id === selectedDormitoryId);
    }, [selectedDormitoryId, students]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, students]);

    useEffect(() => {
        setSelectedStudentId('');
    }, [selectedDormitoryId]);
    
    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedDormitoryId(student.dormitory_id || '');
        setTimeout(() => {
            setSelectedStudentId(student.id);
        }, 0);
        setShowSearchResults(false);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !date || !permissionType) {
            console.error('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        
        const { error } = await supabase.from('dormitory_permissions').insert({
            student_id: selectedStudentId,
            date,
            type: permissionType,
            number_of_days: numberOfDays,
            reason,
        });

        if (error) {
            console.error(`فشل تسجيل الإذن: ${error.message}`);
        } else {
            // Reset form
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
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">تسجيل إذن جديد (المهجع)</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="permission-date" className="block text-lg font-semibold text-slate-700 mb-2">تاريخ الإذن</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                                <CalendarIcon className="w-5 h-5" />
                            </span>
                            <input 
                                type="date"
                                id="permission-date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            />
                        </div>
                    </div>
                     <div className="relative">
                        <label htmlFor="student-search" className="block text-lg font-semibold text-slate-700 mb-2">بحث عن طالب</label>
                        <input 
                            type="text"
                            id="student-search"
                            placeholder="اكتب اسم الطالب للبحث..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setShowSearchResults(true);
                            }}
                            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        />
                         {showSearchResults && searchedStudents.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {searchedStudents.map(student => (
                                    <li 
                                        key={student.id} 
                                        className="p-3 hover:bg-purple-100 cursor-pointer"
                                        onClick={() => handleStudentSearchSelect(student)}
                                    >
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
                        <select 
                            id="dormitory-select"
                            value={selectedDormitoryId}
                            onChange={e => setSelectedDormitoryId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        >
                            <option value="">-- اختر المهجع --</option>
                            {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="student-select" className="block text-lg font-semibold text-slate-700 mb-2">اسم الطالب</label>
                        <select 
                            id="student-select"
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                            disabled={!selectedDormitoryId}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:bg-slate-100"
                        >
                            <option value="">-- اختر الطالب --</option>
                            {filteredStudentsByDormitory.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="days-select" className="block text-lg font-semibold text-slate-700 mb-2">عدد الأيام</label>
                        <select
                            id="days-select"
                            value={numberOfDays}
                            onChange={e => setNumberOfDays(parseInt(e.target.value, 10))}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        >
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-lg font-semibold text-slate-700 mb-2">نوع الإذن</label>
                         <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-md">
                                <input 
                                    type="radio" 
                                    name="permissionType" 
                                    // FIX: Use DormitoryRecapStatus enum for value, checked, and onChange handler.
                                    value={DormitoryRecapStatus.IZIN_KELUAR}
                                    checked={permissionType === DormitoryRecapStatus.IZIN_KELUAR}
                                    onChange={() => setPermissionType(DormitoryRecapStatus.IZIN_KELUAR)}
                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-slate-400"
                                />
                                <span>إذن خروج</span>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer text-md">
                                <input 
                                    type="radio" 
                                    name="permissionType" 
                                    // FIX: Use DormitoryRecapStatus enum for value, checked, and onChange handler.
                                    value={DormitoryRecapStatus.IZIN_PULANG}
                                    checked={permissionType === DormitoryRecapStatus.IZIN_PULANG}
                                    onChange={() => setPermissionType(DormitoryRecapStatus.IZIN_PULANG)}
                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-slate-400"
                                />
                                <span>إذن عودة</span>
                            </label>
                         </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="reason" className="block text-lg font-semibold text-slate-700 mb-2">البيان (اختياري)</label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="أضف ملاحظات أو سبب الإذن هنا..."
                        rows={3}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    ></textarea>
                </div>


                <div className="pt-4 border-t">
                     <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105">
                        تسجيل الإذن
                     </button>
                </div>
            </form>
        </div>
    );
};