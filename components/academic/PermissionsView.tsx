import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student, PermissionType } from '../../types';
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

export const PermissionsView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [permissionType, setPermissionType] = useState<PermissionType>(PermissionType.PERMISSION);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const filteredStudentsByClass = useMemo(() => {
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
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !date || !permissionType) {
            alert('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        console.log({
            studentId: selectedStudentId,
            classId: selectedClassId,
            date,
            permissionType,
        });
        alert('تم تسجيل الإذن بنجاح!');
        // Reset form
        setSearchQuery('');
        setSelectedClassId('');
        setSelectedStudentId('');
    };

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
                                        {student.name} - <span className="text-sm text-slate-500">{sampleClasses.find(c => c.id === student.classId)?.name}</span>
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
                            {sampleClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
