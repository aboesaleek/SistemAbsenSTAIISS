import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';

// Sample data (in a real app, this would come from an API)
const sampleClasses: Class[] = [
    { id: 'c1', name: 'الفصل الأول' },
    { id: 'c2', name: 'الفصل الثاني' },
    { id: 'c3', name: 'الفصل الثالث' },
];

const sampleStudents: Student[] = [
    { id: 's1', name: 'أحمد علي', classId: 'c1' },
    { id: 's2', name: 'فاطمة محمد', classId: 'c1' },
    { id: 's3', name: 'يوسف حسن', classId: 'c2' },
    { id: 's4', name: 'عائشة عبد الله', classId: 'c2' },
    { id: 's5', name: 'عمر خالد', classId: 'c3' },
    { id: 's6', name: 'مريم سعيد', classId: 'c3' },
];

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
    const [markedAsAbsent, setMarkedAsAbsent] = useState<Set<string>>(new Set());
    const [interactionStarted, setInteractionStarted] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const filteredStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return sampleStudents.filter(s => s.classId === selectedClassId);
    }, [selectedClassId]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return sampleStudents.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);
    
    useEffect(() => {
      if (searchQuery || selectedClassId) {
        setInteractionStarted(true);
      }
    }, [searchQuery, selectedClassId]);

    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedClassId(student.classId || '');
        setShowSearchResults(false);
        // In a real app, you might want to scroll to the student in the list
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (markedAsAbsent.size === 0) {
            alert('لم تحدد أي طالب كـ "غائب".');
            return;
        }
        const absenceData = Array.from(markedAsAbsent).map(studentId => ({
            studentId,
            date,
        }));
        console.log("Saving absence data:", absenceData);
        alert(`تم تسجيل غياب ${absenceData.length} طالب بنجاح.`);
        // Reset state after submission
        setMarkedAsAbsent(new Set());
        setSelectedClassId('');
        setSearchQuery('');
        setInteractionStarted(false);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">تسجيل الحضور والغياب</h2>
            
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2 relative">
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
                                    {student.name} - <span className="text-sm text-slate-500">{sampleClasses.find(c => c.id === student.classId)?.name}</span>
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
             <div>
                <label htmlFor="class-select" className="block text-sm font-semibold text-slate-700 mb-2">الفصل الدراسي</label>
                <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500">
                    <option value="">-- اختر الفصل لعرض الطلاب --</option>
                    {sampleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="mt-8">
                {!interactionStarted ? <TodaySummary /> : (
                    <form onSubmit={handleSubmit}>
                        {filteredStudents.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-700 mb-4">قائمة طلاب {sampleClasses.find(c => c.id === selectedClassId)?.name}</h3>
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