import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';

// Sample data (in a real app, this would come from an API)
const sampleDormitories: Dormitory[] = [
    { id: 'd1', name: 'مبنى الشافعي' },
    { id: 'd2', name: 'مبنى أحمد بن حنبل' },
];

const sampleStudents: Student[] = [
    { id: 's1', name: 'عبد الله عمر', dormitoryId: 'd1' },
    { id: 's2', name: 'خالد بن الوليد', dormitoryId: 'd1' },
    { id: 's3', name: 'سلمان الفارسي', dormitoryId: 'd2' },
    { id: 's4', name: 'أبو هريرة', dormitoryId: 'd2' },
];

export const PermissionsView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [permissionType, setPermissionType] = useState<DormitoryPermissionType>(DormitoryPermissionType.IZIN_KELUAR);
    const [numberOfDays, setNumberOfDays] = useState(1);
    const [reason, setReason] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);

    const filteredStudentsByDormitory = useMemo(() => {
        if (!selectedDormitoryId) return [];
        return sampleStudents.filter(s => s.dormitoryId === selectedDormitoryId);
    }, [selectedDormitoryId]);

    const searchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        return sampleStudents.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    useEffect(() => {
        setSelectedStudentId('');
    }, [selectedDormitoryId]);
    
    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedDormitoryId(student.dormitoryId || '');
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
            dormitoryId: selectedDormitoryId,
            date,
            permissionType,
            numberOfDays,
            reason,
        });
        alert('تم تسجيل الإذن بنجاح!');
        // Reset form
        setSearchQuery('');
        setSelectedDormitoryId('');
        setSelectedStudentId('');
        setNumberOfDays(1);
        setReason('');
    };

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
                                        {student.name} - <span className="text-sm text-slate-500">{sampleDormitories.find(d => d.id === student.dormitoryId)?.name}</span>
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
                            {sampleDormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                                    value={DormitoryPermissionType.IZIN_KELUAR}
                                    checked={permissionType === DormitoryPermissionType.IZIN_KELUAR}
                                    onChange={() => setPermissionType(DormitoryPermissionType.IZIN_KELUAR)}
                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-slate-400"
                                />
                                <span>إذن خروج</span>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer text-md">
                                <input 
                                    type="radio" 
                                    name="permissionType" 
                                    value={DormitoryPermissionType.IZIN_PULANG}
                                    checked={permissionType === DormitoryPermissionType.IZIN_PULANG}
                                    onChange={() => setPermissionType(DormitoryPermissionType.IZIN_PULANG)}
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