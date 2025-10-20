import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAcademicPeriod } from '../../contexts/AcademicPeriodContext';

export const FullDayAbsenceView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
    const { showNotification } = useNotification();
    const { academicYear, semester } = useAcademicPeriod();

    const { classes, students, courses, loading, refetchData } = useAcademicData();
    
    const filteredStudentsByClass = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => s.class_id === selectedClassId);
    }, [selectedClassId, students]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, students]);

    useEffect(() => {
        setSelectedStudentId('');
        setSelectedCourseIds(new Set()); // Reset selected courses when class changes
    }, [selectedClassId]);

    useEffect(() => {
        setSelectedCourseIds(new Set()); // Reset selected courses when student changes
    }, [selectedStudentId]);
    
    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedClassId(student.class_id || '');
        setTimeout(() => {
            setSelectedStudentId(student.id);
        }, 0);
        setShowSearchResults(false);
    };

    const handleCourseToggle = (courseId: string) => {
        setSelectedCourseIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!selectedStudentId || !date) {
            showNotification('يرجى تحديد الطالب والتاريخ.', 'error');
            setIsSubmitting(false);
            return;
        }

        if (selectedCourseIds.size === 0) {
            showNotification('يرجى اختيار مادة دراسية واحدة على الأقل.', 'error');
            setIsSubmitting(false);
            return;
        }
        
        try {
            const absenceData = Array.from(selectedCourseIds).map(courseId => ({
                student_id: selectedStudentId,
                date,
                course_id: courseId,
                academic_year: academicYear,
                semester: semester,
            }));

            const { error: insertError } = await supabase.from('academic_absences').insert(absenceData);
            if (insertError) throw insertError;
            
            showNotification(`تم تسجيل غياب الطالب بنجاح لـ ${absenceData.length} مادة دراسية.`, 'success');
            refetchData();
            // Reset form
            setSearchQuery('');
            setSelectedClassId('');
            setSelectedStudentId('');
            setSelectedCourseIds(new Set());
        } catch (error: any) {
             showNotification(`فشل تسجيل الغياب: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="absence-date" className="block text-lg font-semibold text-slate-700 mb-2">تاريخ الغياب</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                                <CalendarIcon className="w-5 h-5" />
                            </span>
                            <input 
                                type="date"
                                id="absence-date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                            />
                        </div>
                    </div>
                     <div className="relative">
                        <label htmlFor="student-search-full-day" className="block text-lg font-semibold text-slate-700 mb-2">بحث عن طالب</label>
                        <input 
                            type="text"
                            id="student-search-full-day"
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
                                        {student.name} - <span className="text-sm text-slate-500">{classes.find(c => c.id === student.class_id)?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="class-select-full-day" className="block text-lg font-semibold text-slate-700 mb-2">الفصل الدراسي</label>
                        <select 
                            id="class-select-full-day"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        >
                            <option value="">-- اختر الفصل --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="student-select-full-day" className="block text-lg font-semibold text-slate-700 mb-2">اسم الطالب</label>
                        <select 
                            id="student-select-full-day"
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

                {selectedStudentId && (
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">
                            اختر المواد الدراسية للغياب ({selectedCourseIds.size} محدد)
                        </h3>
                        <div className="max-h-60 overflow-y-auto border p-2 rounded-lg bg-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {courses.length > 0 ? courses.map(course => (
                                <label key={course.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={selectedCourseIds.has(course.id)}
                                        onChange={() => handleCourseToggle(course.id)}
                                        className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-400"
                                    />
                                    <span>{course.name}</span>
                                </label>
                            )) : <p className="col-span-full text-center text-slate-500 p-4">لا توجد مواد دراسية. يرجى إضافتها من لوحة تحكم المسؤول.</p>}
                        </div>
                    </div>
                )}


                <div className="pt-4 border-t">
                     <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? '...جاري التسجيل' : 'تسجيل الغياب المحدد'}
                     </button>
                </div>
            </form>
        </>
    );
};