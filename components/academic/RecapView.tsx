import React, { useState, useMemo, useEffect } from 'react';
// FIX: Import Student and Course types to correctly type data from Supabase.
import { AttendanceRecord, RecapStatus, Class, Student, Course } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { supabase } from '../../supabaseClient';

// Local type for combined record
interface CombinedRecord extends AttendanceRecord {
    sourceId: string;
    sourceType: 'permission' | 'absence';
}

const statusColorMap: { [key in RecapStatus]: string } = {
  [RecapStatus.ABSENT]: 'bg-red-100 text-red-800',
  [RecapStatus.SICK]: 'bg-yellow-100 text-yellow-800',
  [RecapStatus.PERMISSION]: 'bg-blue-100 text-blue-800',
};

interface RecapViewProps {
  onStudentSelect: (studentId: string) => void;
}

export const RecapView: React.FC<RecapViewProps> = ({ onStudentSelect }) => {
    const [records, setRecords] = useState<CombinedRecord[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    async function fetchData() {
        setLoading(true);
        try {
            const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
            if (classesError) throw classesError;
            setClasses(classesData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
            if (studentsError) throw studentsError;
            
            const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
            if (coursesError) throw coursesError;

            const { data: permissionsData, error: permissionsError } = await supabase.from('academic_permissions').select('*');
            if (permissionsError) throw permissionsError;

            const { data: absencesData, error: absencesError } = await supabase.from('academic_absences').select('*');
            if (absencesError) throw absencesError;
            
            // FIX: Explicitly type maps to provide type safety for Supabase data.
            const studentsMap = new Map<string, Student>((studentsData || []).map(s => [s.id, s]));
            const classesMap = new Map<string, Class>((classesData || []).map(c => [c.id, c]));
            const coursesMap = new Map<string, Course>((coursesData || []).map(c => [c.id, c]));

            const combined: CombinedRecord[] = [];

            (permissionsData || []).forEach((p: any) => {
                const student = studentsMap.get(p.student_id);
                if (!student) return;
                const studentClass = classesMap.get(student.class_id);
                combined.push({
                    id: `p-${p.id}`,
                    sourceId: p.id,
                    sourceType: 'permission',
                    studentId: p.student_id,
                    studentName: student.name,
                    classId: student.class_id || '',
                    className: studentClass?.name || 'N/A',
                    date: p.date,
                    status: p.type === 'sakit' ? RecapStatus.SICK : RecapStatus.PERMISSION,
                });
            });

            (absencesData || []).forEach((a: any) => {
                const student = studentsMap.get(a.student_id);
                if (!student) return;
                const studentClass = classesMap.get(student.class_id);
                const course = coursesMap.get(a.course_id);
                combined.push({
                    id: `a-${a.id}`,
                    sourceId: a.id,
                    sourceType: 'absence',
                    studentId: a.student_id,
                    studentName: student.name,
                    classId: student.class_id || '',
                    className: studentClass?.name || 'N/A',
                    date: a.date,
                    status: RecapStatus.ABSENT,
                    courseName: course?.name,
                });
            });
            
            setRecords(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error: any) {
             console.error(`فشل في جلب البيانات: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = !selectedClassId || record.classId === selectedClassId;
            const recordDate = new Date(record.date);
            const matchesStartDate = !startDate || recordDate >= new Date(startDate);
            const matchesEndDate = !endDate || recordDate <= new Date(endDate);
            return matchesSearch && matchesClass && matchesStartDate && matchesEndDate;
        });
    }, [records, searchQuery, selectedClassId, startDate, endDate]);

    const deleteRecord = async (record: CombinedRecord) => {
        const tableName = record.sourceType === 'permission' ? 'academic_permissions' : 'academic_absences';
        const { error } = await supabase.from(tableName).delete().eq('id', record.sourceId);

        if (error) {
            console.error(`فشل الحذف: ${error.message}`);
        } else {
            fetchData(); // Refresh data
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الملخص العام</h2>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <select
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">كل الفصول</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    <DownloadIcon className="w-5 h-5" />
                    <span>تصدير إلى Excel</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600 responsive-table">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">اسم الطالب</th>
                                <th className="px-6 py-3">الفصل</th>
                                <th className="px-6 py-3">التاريخ</th>
                                <th className="px-6 py-3">الحالة</th>
                                <th className="px-6 py-3">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, index) => (
                                <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                    <td data-label="#" className="px-6 py-4">{index + 1}</td>
                                    <td data-label="اسم الطالب" className="px-6 py-4 font-semibold">
                                      <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-teal-600 hover:underline cursor-pointer">
                                          {record.studentName}
                                      </button>
                                    </td>
                                    <td data-label="الفصل" className="px-6 py-4">{record.className}</td>
                                    <td data-label="التاريخ" className="px-6 py-4">{record.date}</td>
                                    <td data-label="الحالة" className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 action-cell">
                                        <button onClick={() => deleteRecord(record)} className="text-red-600 hover:text-red-800">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredRecords.length === 0 && (
                        <p className="text-center text-slate-500 py-8">لا توجد بيانات تطابق معايير البحث.</p>
                    )}
                </div>
            </div>
        </div>
    );
};