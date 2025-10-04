import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student, Course, AttendanceRecord, RecapStatus } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';

const statusColorMap: { [key in RecapStatus]: string } = {
  [RecapStatus.ABSENT]: 'bg-red-100 text-red-800',
  [RecapStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [RecapStatus.PERMISSION]: 'bg-blue-100 text-blue-800',
};

const TodayRecordsTable: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => {
    if (records.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-lg mb-8">
                <h3 className="text-2xl font-bold text-slate-800">ملخص بيانات اليوم</h3>
                <p className="text-slate-600 mt-2">لم يتم تسجيل أي بيانات لهذا اليوم. ابدأ بالبحث عن طالب أو اختيار فصل.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">البيانات المسجلة اليوم</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-200">
                        <tr>
                            <th className="px-6 py-3">اسم الطالب</th>
                            <th className="px-6 py-3">الفصل</th>
                            <th className="px-6 py-3">الحالة</th>
                            <th className="px-6 py-3">المادة الدراسية</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {records.map((record) => (
                            <tr key={record.id} className="border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{record.studentName}</td>
                                <td className="px-6 py-4">{record.className}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[record.status]}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{record.courseName || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const AttendanceView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [markedAsAbsent, setMarkedAsAbsent] = useState<Set<string>>(new Set());
    const [interactionStarted, setInteractionStarted] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
    
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
            if (classesError) throw classesError;
            setClasses(classesData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('class_id', 'is', null);
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
            
            const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
            if (coursesError) throw coursesError;
            setCourses(coursesData || []);

            // Fetch today's detailed records
            const today = new Date().toISOString().split('T')[0];

            const { data: permissionsToday, error: permissionsError } = await supabase
                .from('academic_permissions').select('*').eq('date', today);
            if (permissionsError) throw permissionsError;

            const { data: absencesToday, error: absencesError } = await supabase
                .from('academic_absences').select('*').eq('date', today);
            if (absencesError) throw absencesError;
            
            const studentsMap = new Map((studentsData || []).map(s => [s.id, s]));
            const classesMap = new Map((classesData || []).map(c => [c.id, c]));
            const coursesMap = new Map((coursesData || []).map(c => [c.id, c]));

            const combined: AttendanceRecord[] = [];

            (permissionsToday || []).forEach((p: any) => {
                const student = studentsMap.get(p.student_id);
                if (!student) return;
                const studentClass = classesMap.get(student.class_id);
                combined.push({
                    id: `p-${p.id}`,
                    studentId: p.student_id,
                    studentName: student.name,
                    classId: student.class_id || '',
                    className: studentClass?.name || 'N/A',
                    date: p.date,
                    status: p.type === 'sakit' ? RecapStatus.SICK : RecapStatus.PERMISSION,
                });
            });

            (absencesToday || []).forEach((a: any) => {
                const student = studentsMap.get(a.student_id);
                if (!student) return;
                const studentClass = classesMap.get(student.class_id);
                const course = coursesMap.get(a.course_id);
                combined.push({
                    id: `a-${a.id}`,
                    studentId: a.student_id,
                    studentName: student.name,
                    classId: student.class_id || '',
                    className: studentClass?.name || 'N/A',
                    date: a.date,
                    status: RecapStatus.ABSENT,
                    courseName: course?.name,
                });
            });

            setTodayRecords(combined.sort((a, b) => a.studentName.localeCompare(b.studentName)));

        } catch (error: any) {
            console.error(`فشل في جلب البيانات: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const filteredStudents = useMemo(() => {
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
      if (searchQuery || selectedClassId) {
        setInteractionStarted(true);
      }
    }, [searchQuery, selectedClassId]);

    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedClassId(student.class_id || '');
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
        setSubmitStatus(null);

        if (markedAsAbsent.size === 0) {
            setSubmitStatus({ type: 'error', text: 'لم تحدد أي طالب كـ "غائب".' });
            return;
        }
        if (!selectedCourseId) {
            setSubmitStatus({ type: 'error', text: 'يرجى اختيار المادة الدراسية.' });
            return;
        }
        
        const absenceData = Array.from(markedAsAbsent).map(studentId => ({
            student_id: studentId,
            date,
            course_id: selectedCourseId,
        }));

        const { error } = await supabase.from('academic_absences').insert(absenceData);

        if (error) {
            console.error(`فشل تسجيل الغياب: ${error.message}`);
            setSubmitStatus({ type: 'error', text: `فشل تسجيل الغياب: ${error.message}` });
        } else {
            setSubmitStatus({ type: 'success', text: `تم تسجيل غياب ${absenceData.length} طالب بنجاح.` });
            // Refresh today's data and reset form
            fetchData();
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
            
            {submitStatus && (
                <div className={`p-4 mb-4 rounded-md text-center ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {submitStatus.text}
                </div>
            )}

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
                                    {student.name} - <span className="text-sm text-slate-500">{classes.find(c => c.id === student.class_id)?.name}</span>
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
                {!interactionStarted ? <TodayRecordsTable records={todayRecords} /> : (
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