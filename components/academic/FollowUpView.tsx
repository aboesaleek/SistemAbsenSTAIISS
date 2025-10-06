import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { CheckIcon } from '../icons/CheckIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { Student, Class, Course } from '../../types';

interface AbsenceFollowUpRecord {
    id: string; 
    studentId: string;
    studentName: string;
    className: string;
    courseName: string;
    date: string;
}

const CONFIRMED_IDS_STORAGE_KEY = 'academic_absence_confirmed_ids';

// Helper function to get confirmed IDs from localStorage
const getConfirmedIds = (): Set<string> => {
    try {
        const stored = localStorage.getItem(CONFIRMED_IDS_STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
        console.error("Failed to parse confirmed IDs from localStorage", e);
        return new Set();
    }
};

// Helper function to add a confirmed ID to localStorage
const addConfirmedId = (id: string) => {
    const confirmedIds = getConfirmedIds();
    confirmedIds.add(id);
    try {
        localStorage.setItem(CONFIRMED_IDS_STORAGE_KEY, JSON.stringify(Array.from(confirmedIds)));
    } catch (e) {
        console.error("Failed to save confirmed IDs to localStorage", e);
        alert("فشل حفظ الحالة. قد يظهر هذا السجل مرة أخرى عند تحديث الصفحة.");
    }
};


export const FollowUpView: React.FC = () => {
    const [absences, setAbsences] = useState<AbsenceFollowUpRecord[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name, class_id');
            if (studentsError) throw studentsError;
            const studentsMap = new Map<string, Student>((studentsData || []).map(s => [s.id, s]));

            const { data: classesData, error: classesError } = await supabase.from('classes').select('id, name');
            if (classesError) throw classesError;
            const classesMap = new Map<string, string>((classesData as Class[] || []).map(c => [c.id, c.name]));

            const { data: coursesData, error: coursesError } = await supabase.from('courses').select('id, name');
            if (coursesError) throw coursesError;
            const coursesMap = new Map<string, string>((coursesData as Course[] || []).map(c => [c.id, c.name]));

            // Fetch all academic absences. The filtering of "followed up" absences will now happen client-side.
            const { data: absencesData, error: absencesError } = await supabase
                .from('academic_absences')
                .select('id, student_id, course_id, date');

            if (absencesError) throw absencesError;
            
            const confirmedIds = getConfirmedIds();

            const mappedAbsences: AbsenceFollowUpRecord[] = (absencesData || [])
                .filter((a: any) => !confirmedIds.has(a.id)) // Exclude already confirmed absences on the client
                .map((a: any) => {
                    const student = studentsMap.get(a.student_id);
                    return {
                        id: a.id,
                        studentId: a.student_id,
                        studentName: student?.name || 'طالب محذوف',
                        className: student && student.class_id ? (classesMap.get(student.class_id) || 'N/A') : 'N/A',
                        courseName: coursesMap.get(a.course_id) || 'N/A',
                        date: a.date
                    };
                }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.studentName.localeCompare(b.studentName));

            setAbsences(mappedAbsences);

        } catch (error: any) {
            console.error('Error fetching follow-up data:', error.message);
        } finally {
            setLoading(false);
        }
    }
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleConfirm = (absenceId: string) => {
        // Persist the confirmation in localStorage and update the UI.
        addConfirmedId(absenceId);
        setAbsences(prev => prev.filter(a => a.id !== absenceId));
    };

    const handleDelete = async (absenceId: string) => {
        const { error } = await supabase.from('academic_absences').delete().eq('id', absenceId);
        if (error) {
            console.error('Error deleting absence:', error.message);
        } else {
            // Clean up localStorage as well if the record is deleted.
            const confirmedIds = getConfirmedIds();
            if (confirmedIds.has(absenceId)) {
                confirmedIds.delete(absenceId);
                localStorage.setItem(CONFIRMED_IDS_STORAGE_KEY, JSON.stringify(Array.from(confirmedIds)));
            }
            setAbsences(prev => prev.filter(a => a.id !== absenceId));
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">متابعة الغياب</h2>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <p className="text-slate-600 mb-4">
                    تحتوي هذه القائمة على الطلاب الذين تم وضع علامة "غائب" عليهم من وحدة الحضور والغياب.
                    انقر فوق <b className="text-green-600">تأكيد</b> لإخفاء الطالب من هذه القائمة (تبقى البيانات في الملخصات).
                    انقر فوق <b className="text-red-600">حذف</b> لإزالة بيانات الغياب بشكل دائم من جميع الوحدات.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600 responsive-table">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                           <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">اسم الطالب</th>
                                <th className="px-6 py-3">الفصل</th>
                                <th className="px-6 py-3">تاريخ الغياب</th>
                                <th className="px-6 py-3">المادة الدراسية</th>
                                <th className="px-6 py-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absences.length > 0 ? (
                                absences.map((record, index) => (
                                    <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                        <td data-label="#" className="px-6 py-4">{index + 1}</td>
                                        <td data-label="اسم الطالب" className="px-6 py-4 font-semibold">{record.studentName}</td>
                                        <td data-label="الفصل" className="px-6 py-4">{record.className}</td>
                                        <td data-label="تاريخ الغياب" className="px-6 py-4">{record.date}</td>
                                        <td data-label="المادة الدراسية" className="px-6 py-4">{record.courseName}</td>
                                        <td className="px-6 py-4 action-cell">
                                            <div className="flex gap-4 justify-end md:justify-start">
                                                <button onClick={() => handleConfirm(record.id)} className="text-green-600 hover:text-green-800" title="تأكيد المتابعة">
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-800" title="حذف الغياب نهائياً">
                                                    <DeleteIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500">
                                        لا توجد بيانات غياب تحتاج إلى متابعة.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};