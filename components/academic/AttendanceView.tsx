import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord, RecapStatus } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { FullDayAbsenceView } from './FullDayAbsenceView';
import { useNotification } from '../../contexts/NotificationContext';
import { useAcademicPeriod } from '../../contexts/AcademicPeriodContext';

const statusColorMap: { [key in RecapStatus]: string } = {
  [RecapStatus.ABSENT]: 'bg-red-100 text-red-800',
  [RecapStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [RecapStatus.PERMISSION]: 'bg-blue-100 text-blue-800',
};

interface TodayRecordsTableProps {
  records: AttendanceRecord[];
  onStudentSelect: (studentId: string) => void;
}

const TodayRecordsTable: React.FC<TodayRecordsTableProps> = ({ records, onStudentSelect }) => {
    if (records.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-lg mb-8">
                <h3 className="text-2xl font-bold text-slate-800">ملخص بيانات اليوم</h3>
                <p className="text-slate-600 mt-2">لم يتم تسجيل أي بيانات لهذا اليوم. ابدأ بالبحث عن طالب أو اختيار فصل.</p>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-6 bg-slate-50 border border-slate-200 rounded-lg mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">البيانات المسجلة اليوم</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-200">
                        <tr>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الفصل</th>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الحالة</th>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">المادة الدراسية</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {records.map((record) => (
                            <tr key={record.id} className="border-b hover:bg-slate-50">
                                <td className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">
                                    <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-teal-600 hover:underline cursor-pointer">
                                        {record.studentName}
                                    </button>
                                </td>
                                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.className}</td>
                                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[record.status]}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.courseName || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 font-semibold transition-colors duration-200 focus:outline-none ${
            isActive ? 'border-b-2 border-teal-500 text-teal-600' : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {children}
    </button>
);


interface AttendanceViewProps {
  onStudentSelect: (studentId: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onStudentSelect }) => {
    const { classes, students, courses, records, loading, refetchData } = useAcademicData();
    const { showNotification } = useNotification();
    const { academicYear, semester } = useAcademicPeriod();

    // Common state for daily tab
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [markedAsAbsent, setMarkedAsAbsent] = useState<Set<string>>(new Set());
    const [interactionStarted, setInteractionStarted] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'daily' | 'fullDay'>('daily');
    
    const todayRecords = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return records.filter(r => r.date === today);
    }, [records]);


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

        if (markedAsAbsent.size === 0) {
            showNotification('لم تحدد أي طالب كـ "غائب".', 'error');
            return;
        }
        if (!selectedCourseId) {
            showNotification('يرجى اختيار المادة الدراسية.', 'error');
            return;
        }
        
        const absenceData = Array.from(markedAsAbsent).map(studentId => ({
            student_id: studentId,
            date,
            course_id: selectedCourseId,
            academic_year: academicYear,
            semester: semester,
        }));

        const { error } = await supabase.from('academic_absences').insert(absenceData);

        if (error) {
            console.error(`فشل تسجيل الغياب: ${error.message}`);
            showNotification(`فشل تسجيل الغياب: ${error.message}`, 'error');
        } else {
            showNotification(`تم تسجيل غياب ${absenceData.length} طالب بنجاح.`, 'success');
            refetchData();
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
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-2 border-b pb-4">تسجيل الحاضر والغياب</h2>
             <div className="flex border-b mb-6 -mt-px">
                <TabButton isActive={activeTab === 'daily'} onClick={() => setActiveTab('daily')}>
                    حسب المادة
                </TabButton>
                <TabButton isActive={activeTab === 'fullDay'} onClick={() => setActiveTab('fullDay')}>
                    غياب متعدد المواد
                </TabButton>
            </div>
            
            {activeTab === 'daily' && (
              <>
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
                    {!interactionStarted ? <TodayRecordsTable records={todayRecords} onStudentSelect={onStudentSelect} /> : (
                        <form onSubmit={handleSubmit}>
                            {filteredStudents.length > 0 ? (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-700 mb-4">قائمة طلاب {classes.find(c => c.id === selectedClassId)?.name}</h3>
                                    <div className="overflow-x-auto bg-white rounded-lg border">
                                        <table className="w-full text-sm text-right text-slate-600">
                                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                                <tr>
                                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th>
                                                    <th className="px-2 py-3 sm:px-6 text-left whitespace-nowrap">تسجيل غياب</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {filteredStudents.map(student => (
                                                    <tr key={student.id} className="hover:bg-slate-50">
                                                        <td className="px-2 py-3 sm:px-6 sm:py-4 font-semibold text-slate-800 whitespace-nowrap">{student.name}</td>
                                                        <td className="px-2 py-3 sm:px-6 sm:py-4 text-left whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleAbsent(student.id)}
                                                                className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors duration-200 ${markedAsAbsent.has(student.id) ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-red-200'}`}
                                                            >
                                                                غائب
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
              </>
            )}

            {activeTab === 'fullDay' && (
                <FullDayAbsenceView />
            )}
        </div>
    );
};