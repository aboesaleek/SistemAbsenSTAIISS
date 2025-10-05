import React, { useState, useMemo, useEffect } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { supabase } from '../../supabaseClient';

interface RecapRecord {
    id: string;
    studentId: string;
    studentName: string;
    dormitoryId: string;
    dormitoryName: string;
    date: string;
    numberOfDays: number;
    reason?: string;
}

interface GenericDormitoryRecapProps {
    permissionType: DormitoryPermissionType;
    title: string;
    onStudentSelect: (studentId: string) => void;
}

const GenericDormitoryRecap: React.FC<GenericDormitoryRecapProps> = ({ permissionType, title, onStudentSelect }) => {
    const [records, setRecords] = useState<RecapRecord[]>([]);
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);
            const dormsMap = new Map((dormsData || []).map(d => [d.id, d.name]));

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, name, dormitory_id');
            if (studentsError) throw studentsError;
            const studentsMap = new Map<string, Student>((studentsData || []).map(s => [s.id, s]));

            const { data: permissionsData, error: permissionsError } = await supabase
                .from('dormitory_permissions')
                .select('*')
                .eq('type', permissionType);

            if (permissionsError) throw permissionsError;

            const fetchedRecords = (permissionsData || []).map((p: any) => {
                const student = studentsMap.get(p.student_id);
                const dormitoryName = student ? dormsMap.get(student.dormitory_id) : 'N/A';
                return {
                    id: p.id,
                    studentId: p.student_id,
                    studentName: student?.name || 'طالب محذوف',
                    dormitoryId: student?.dormitory_id || '',
                    dormitoryName: dormitoryName || 'N/A',
                    date: p.date,
                    numberOfDays: p.number_of_days,
                    reason: p.reason
                };
            }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setRecords(fetchedRecords);
        } catch (error: any) {
            console.error(`Failed to fetch data for ${title}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [permissionType]); // Refetch when the type changes

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDormitory = !selectedDormitoryId || record.dormitoryId === selectedDormitoryId;
            return matchesSearch && matchesDormitory;
        });
    }, [records, searchQuery, selectedDormitoryId]);

    const deleteRecord = async (id: string) => {
        const { error } = await supabase.from('dormitory_permissions').delete().eq('id', id);
        if (error) {
            console.error(`Failed to delete record: ${error.message}`);
        } else {
            fetchData();
        }
    };

    const handlePrint = () => window.print();

    if (loading) {
        return <div className="text-center p-8 bg-white rounded-2xl shadow-lg border">...جاري تحميل البيانات</div>;
    }
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 printable-area">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
                <div className="no-print">
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        <PrinterIcon className="w-5 h-5" />
                        <span>طباعة أو حفظ كـ PDF</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 no-print">
                <input
                    type="text"
                    placeholder="بحث باسم الطالب..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                />
                <select
                    value={selectedDormitoryId}
                    onChange={e => setSelectedDormitoryId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                    <option value="">كل المهاجع</option>
                    {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600 responsive-table">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-6 py-3">#</th>
                            <th className="px-6 py-3">اسم الطالب</th>
                            <th className="px-6 py-3">المهجع</th>
                            <th className="px-6 py-3">التاريخ</th>
                            <th className="px-6 py-3">عدد الأيام</th>
                            <th className="px-6 py-3">البيان</th>
                            <th className="px-6 py-3 no-print">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record, index) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                <td data-label="#" className="px-6 py-4">{index + 1}</td>
                                <td data-label="اسم الطالب" className="px-6 py-4 font-semibold">
                                     <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-purple-600 hover:underline cursor-pointer">
                                        {record.studentName}
                                    </button>
                                </td>
                                <td data-label="المهجع" className="px-6 py-4">{record.dormitoryName}</td>
                                <td data-label="التاريخ" className="px-6 py-4">{record.date}</td>
                                <td data-label="عدد الأيام" className="px-6 py-4">{record.numberOfDays}</td>
                                <td data-label="البيان" className="px-6 py-4 text-slate-500">{record.reason || '-'}</td>
                                <td className="px-6 py-4 no-print action-cell">
                                    <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800">
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
    );
};

interface GeneralRecapViewProps {
  onStudentSelect: (studentId: string) => void;
}

export const GeneralRecapView: React.FC<GeneralRecapViewProps> = ({ onStudentSelect }) => {
    const [activeRecap, setActiveRecap] = useState('sick');

    const recapOptions = {
        sick: { type: DormitoryPermissionType.SICK_LEAVE, title: "ملخص إذن الخروج للمريض" },
        group: { type: DormitoryPermissionType.GROUP_LEAVE, title: "ملخص إذن الخروج الجماعي" },
        individual: { type: DormitoryPermissionType.GENERAL_LEAVE, title: "ملخص إذن الخروج الفردي" },
        overnight: { type: DormitoryPermissionType.OVERNIGHT_LEAVE, title: "ملخص إذن المبيت" },
    };

    const currentRecap = recapOptions[activeRecap as keyof typeof recapOptions];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الخلاصة العامة</h2>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 no-print">
                <label htmlFor="recap-select" className="block text-lg font-semibold text-slate-700 mb-2">اختر نوع الخلاصة</label>
                <select
                    id="recap-select"
                    value={activeRecap}
                    onChange={e => setActiveRecap(e.target.value)}
                    className="w-full md:w-1/2 p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                    <option value="sick">إذن خروج للمريض</option>
                    <option value="group">إذن خروج جماعي</option>
                    <option value="individual">إذن خروج فردي</option>
                    <option value="overnight">إذن مبيت</option>
                </select>
            </div>

            {currentRecap && (
                <GenericDormitoryRecap
                    permissionType={currentRecap.type}
                    title={currentRecap.title}
                    onStudentSelect={onStudentSelect}
                />
            )}
        </div>
    );
};