import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student, PermissionType } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';

export const PermissionsView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [permissionType, setPermissionType] = useState<PermissionType>(PermissionType.PERMISSION);
    const [reason, setReason] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
                if (classesError) throw classesError;
                setClasses(classesData || []);

                const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('classId', 'is', null);
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

    const filteredStudentsByClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.classId === selectedClassId);
    }, [selectedClassId, students]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, students]);

    useEffect(() => {
        // Reset student selection when class changes
        setSelectedStudentId('');
    }, [selectedClassId]);
    
    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedClassId(student.classId || '');
        // Use a timeout to allow the class dropdown to update and re-render the student dropdown
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
        
        const { error } = await supabase.from('academic_permissions').insert({
            studentId: selectedStudentId,
            date,
            type: permissionType,
            reason
        });

        if (error) {
            console.error(`فشل تسجيل الإذن: ${error.message}`);
        } else {
            // Reset form
            setSearchQuery('');
            setSelectedClassId('');
            setSelectedStudentId('');
            setReason('');
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">تسجيل إذن جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Date and Search Row */}
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
                                className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
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
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        />
                         {showSearchResults && searchedStudents.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {searchedStudents.map(student => (
                                    <li 
                                        key={student.id} 
                                        className="p-3 hover:bg-teal-100 cursor-pointer"
                                        onClick={() => handleStudentSearchSelect(student)}
                                    >
                                        {student.name} - <span className="text-sm text-slate-500">{classes.find(c => c.id === student.classId)?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Class and Student Dropdowns Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="class-select" className="block text-lg font-semibold text-slate-700 mb-2">الفصل الدراسي</label>
                        <select 
                            id="class-select"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        >
                            <option value="">-- اختر الفصل --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="student-select" className="block text-lg font-semibold text-slate-700 mb-2">اسم الطالب</label>
                        <select 
                            id="student-select"
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                            disabled={!selectedClassId}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-slate-100"
                        >
                            <option value="">-- اختر الطالب --</option>
                            {filteredStudentsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Permission Type */}
                <div>
                     <label className="block text-lg font-semibold text-slate-700 mb-3">نوع الإذن</label>
                     <div className="flex items-center gap-8">
                        <label className="flex items-center gap-3 cursor-pointer text-lg">
                            <input 
                                type="radio" 
                                name="permissionType" 
                                value={PermissionType.PERMISSION}
                                checked={permissionType === PermissionType.PERMISSION}
                                onChange={() => setPermissionType(PermissionType.PERMISSION)}
                                className="w-5 h-5 text-teal-600 focus:ring-teal-500 border-slate-400"
                            />
                            <span>إذن</span>
                        </label>
                         <label className="flex items-center gap-3 cursor-pointer text-lg">
                            <input 
                                type="radio" 
                                name="permissionType" 
                                value={PermissionType.SICK}
                                checked={permissionType === PermissionType.SICK}
                                onChange={() => setPermissionType(PermissionType.SICK)}
                                className="w-5 h-5 text-teal-600 focus:ring-teal-500 border-slate-400"
                            />
                            <span>مرض</span>
                        </label>
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
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    ></textarea>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t">
                     <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105">
                        تسجيل الإذن
                     </button>
                </div>
            </form>
        </div>
    );
};