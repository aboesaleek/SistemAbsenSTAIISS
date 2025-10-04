import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student, Course } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';

const TodaySummary: React.FC = () => (
    <div className="text-center p-8 bg-teal-50 border border-teal-200 rounded-lg mb-8">
        <h3 className="text-2xl font-bold text-teal-800">ملخص بيانات اليوم</h3>
        <p className="text-slate-600 mt-2">لم يتم تسجيل أي بيانات حتى الآن لهذا اليوم. ابدأ بالبحث عن طالب أو اختيار فصل دراسي.</p>
        {/* In a real app, you would fetch and display actual summary data here */}
    </div>
);

export const AttendanceView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [markedAsAbsent, setMarkedAsAbsent] = useState<Set<string>>(new Set());
    const [interactionStarted, setInteractionStarted] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
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
                
                const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
                if (coursesError) throw coursesError;
                setCourses(coursesData || []);

            } catch (error: any) {
                console.error(`فشل في جلب البيانات: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredStudents = useMemo(() => {
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
      if (searchQuery || selectedClassId) {
        setInteractionStarted(true);
      }
    }, [searchQuery, selectedClassId]);

    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedClassId(student.classId || '');
        setShowSearchResults(false);
    };
    
    const toggleAbsent = (studentId: string) => {
        setMarkedAsAbsent(prev => {
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
        if (markedAsAbsent.size === 0) {
            console.error('لم تحدد أي طالب كـ "غائب".');
            return;
        }
        if (!selectedCourseId) {
            console.error('يرجى اختيار المادة الدراسية.');
            return;
        }
        
        const absenceData = Array.from(markedAsAbsent).map(studentId => ({
            studentId,
            date,
            courseId: selectedCourseId,
        }));

        const { error } = await supabase.from('academic_absences').insert(absenceData);

        if (error) {
            console.error(`فشل تسجيل الغياب: ${error.message}`);
        } else {
            // Reset state after submission
            setMarkedAsAbsent(new Set());
            setSelectedClassId('');
            setSelectedCourseId('');
            setSearchQuery('');
            setInteractionStarted(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">تسجيل الحضور والغياب</h2>
            
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="relative">
                    <label htmlFor="student-search" className="block text-sm font-semibold text-slate-700 mb-2">بحث عن طالب</label>
                    <input 
                        type="text"
                        id="student-search"
                        placeholder="اكتب اسم الطالب..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                        onFocus={() => setShowSearchResults(true)}
                        onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    {showSearchResults && searchedStudents.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {searchedStudents.map(student => (
                                <li key={student.id} className="p-3 hover:bg-teal-100 cursor-pointer" onClick={() => handleStudentSearchSelect(student)}>
                                    {student.name} - <span className="text-sm text-slate-500">{classes.find(c => c.id === student.classId)?.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                 <div>
                    <label htmlFor="permission-date" className="block text-sm font-semibold text-slate-700 mb-2">التاريخ</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"><CalendarIcon className="w-5 h-5" /></span>
                        <input type="date" id="permission-date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="class-select" className="block text-sm font-semibold text-slate-700 mb-2">الفصل الدراسي</label>
                    <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500">
                        <option value="">-- اختر الفصل لعرض الطلاب --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="course-select" className="block text-sm font-semibold text-slate-700 mb-2">المادة الدراسية</label>
                    <select id="course-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500">
                        <option value="">-- اختر المادة --</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="mt-8">
                {!interactionStarted ? <TodaySummary /> : (
                    <form onSubmit={handleSubmit}>
                        {filteredStudents.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-700 mb-4">قائمة طلاب {classes.find(c => c.id === selectedClassId)?.name}</h3>
                                {filteredStudents.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="font-semibold text-slate-800">{student.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleAbsent(student.id)}
                                            className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors duration-200 ${markedAsAbsent.has(student.id) ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-red-200'}`}
                                        >
                                            غائب
                                        </button>
                                    </div>
                                ))}
                                <div className="pt-6 border-t mt-6">
                                    <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105">
                                        حفظ البيانات
                                    </button>
                                </div>
                            </div>
                        ) : (
                           selectedClassId && <p className="text-center text-slate-500 py-8">لا يوجد طلاب في هذا الفصل.</p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};