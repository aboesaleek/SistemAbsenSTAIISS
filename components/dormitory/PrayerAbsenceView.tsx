import React, { useState, useMemo, useEffect } from 'react';
import { Prayer, DormitoryPrayerAbsence, CeremonyStatus, ceremonyStatusToLabel } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { supabase } from '../../supabaseClient';
import { useDormitoryData } from '../../contexts/DormitoryDataContext';
import { useNotification } from '../../contexts/NotificationContext';

const statusColorMap: { [key in CeremonyStatus]: { bg: string, text: string, border: string } } = {
  [CeremonyStatus.ALPHA]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
  [CeremonyStatus.SAKIT]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  [CeremonyStatus.IZIN]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
};

interface TodayRecordsTableProps {
  records: DormitoryPrayerAbsence[];
  onStudentSelect: (studentId: string) => void;
}

const TodayRecordsTable: React.FC<TodayRecordsTableProps> = ({ records, onStudentSelect }) => {
    if (records.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-lg mb-8">
                <h3 className="text-2xl font-bold text-slate-800">ملخص بيانات اليوم</h3>
                <p className="text-slate-600 mt-2">لم يتم تسجيل أي بيانات لهذا اليوم. ابدأ باختيار مهجع.</p>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-6 bg-slate-50 border border-slate-200 rounded-lg mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">بيانات الغياب المسجلة اليوم</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-200">
                        <tr>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">المهجع</th>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الصلاة</th>
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {records.map((record) => {
                            // Defensive coding: Provide a fallback in case record.status is an unexpected value
                            const statusInfo = statusColorMap[record.status] || statusColorMap[CeremonyStatus.ALPHA];
                            const statusLabel = ceremonyStatusToLabel[record.status] || ceremonyStatusToLabel[CeremonyStatus.ALPHA];

                            return (
                                <tr key={record.id} className="border-b hover:bg-slate-50">
                                    <td className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">
                                        <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-purple-600 hover:underline cursor-pointer">
                                            {record.studentName}
                                        </button>
                                    </td>
                                    <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.dormitoryName}</td>
                                    <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.prayer}</td>
                                    <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface PrayerAbsenceViewProps {
  onStudentSelect: (studentId: string) => void;
}

export const PrayerAbsenceView: React.FC<PrayerAbsenceViewProps> = ({ onStudentSelect }) => {
    const { dormitories, students, prayerAbsences, loading, refetchData } = useDormitoryData();
    const { showNotification } = useNotification();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedPrayer, setSelectedPrayer] = useState<Prayer>(Prayer.SUBUH);
    const [studentStatuses, setStudentStatuses] = useState<Map<string, CeremonyStatus>>(new Map());
    const [interactionStarted, setInteractionStarted] = useState(false);
    
    const todayRecords = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return prayerAbsences
            .filter(r => r.date === today)
            .sort((a, b) => a.studentName.localeCompare(b.studentName));
    }, [prayerAbsences]);


    const filteredStudents = useMemo(() => {
        if (!selectedDormitoryId) return [];
        return students.filter(s => s.dormitory_id === selectedDormitoryId);
    }, [selectedDormitoryId, students]);
    
    useEffect(() => {
      if (selectedDormitoryId) setInteractionStarted(true);
    }, [selectedDormitoryId]);

    const toggleStatus = (studentId: string, status: CeremonyStatus) => {
        setStudentStatuses(prev => {
            const newMap = new Map(prev);
            if (newMap.get(studentId) === status) {
                newMap.delete(studentId);
            } else {
                newMap.set(studentId, status);
            }
            return newMap;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (studentStatuses.size === 0) {
            showNotification('لم يتم تحديد غياب أي طالب.', 'error');
            return;
        }
        
        const absenceData = Array.from(studentStatuses.entries()).map(([studentId, status]) => ({
            student_id: studentId,
            date,
            prayer: selectedPrayer,
            status,
        }));

        const { error } = await supabase.from('dormitory_prayer_absences').insert(absenceData);
        if (error) {
            showNotification(`فشل حفظ الغياب: ${error.message}`, 'error');
        } else {
            showNotification(`تم حفظ غياب ${absenceData.length} طالب بنجاح.`, 'success');
            refetchData();
            setStudentStatuses(new Map());
            setSelectedDormitoryId('');
            setInteractionStarted(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label htmlFor="dorm-select" className="block text-sm font-semibold text-slate-700 mb-2">المهجع</label>
                    <select id="dorm-select" value={selectedDormitoryId} onChange={e => setSelectedDormitoryId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500">
                        <option value="">-- اختر المهجع --</option>
                        {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="prayer-select" className="block text-sm font-semibold text-slate-700 mb-2">الصلاة</label>
                    <select id="prayer-select" value={selectedPrayer} onChange={e => setSelectedPrayer(e.target.value as Prayer)} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500">
                        {Object.values(Prayer).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="date-select" className="block text-sm font-semibold text-slate-700 mb-2">التاريخ</label>
                    <div className="relative"><span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"><CalendarIcon className="w-5 h-5" /></span><input type="date" id="date-select" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"/></div>
                </div>
            </div>

            <div className="mt-8">
                {!interactionStarted ? <TodayRecordsTable records={todayRecords} onStudentSelect={onStudentSelect} /> : (
                    <form onSubmit={handleSubmit}>
                        {filteredStudents.length > 0 ? (
                            <div>
                                <h3 className="text-xl font-bold text-slate-700 mb-4">قائمة طلاب {dormitories.find(d => d.id === selectedDormitoryId)?.name}</h3>
                                <div className="overflow-x-auto bg-white rounded-lg border">
                                    <table className="w-full text-sm text-right text-slate-600">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                            <tr><th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th><th className="px-2 py-3 sm:px-6 text-left whitespace-nowrap">حالة الحضور</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {filteredStudents.map(student => (
                                                <tr key={student.id} className="hover:bg-slate-50">
                                                    <td className="px-2 py-3 sm:px-6 sm:py-4 font-semibold text-slate-800 whitespace-nowrap">{student.name}</td>
                                                    <td className="px-2 py-3 sm:px-6 sm:py-4 text-left whitespace-nowrap">
                                                        <div className="flex justify-end gap-2">
                                                            {Object.values(CeremonyStatus).map(status => {
                                                                const isActive = studentStatuses.get(student.id) === status;
                                                                const colors = statusColorMap[status];
                                                                return <button key={status} type="button" onClick={() => toggleStatus(student.id, status)} className={`px-3 py-1 text-sm font-bold rounded-full border-2 transition-colors duration-200 ${isActive ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300'}`}>{ceremonyStatusToLabel[status]}</button>
                                                            })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="pt-6 border-t mt-6"><button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105">حفظ الغياب</button></div>
                            </div>
                        ) : ( selectedDormitoryId && <p className="text-center text-slate-500 py-8">لا يوجد طلاب في هذا المهجع.</p> )}
                    </form>
                )}
            </div>
        </>
    );
};
