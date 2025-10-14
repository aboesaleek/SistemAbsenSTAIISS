import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { CheckIcon } from '../icons/CheckIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { RecapStatus } from '../../types';
import { Pagination } from '../shared/Pagination';

interface AbsenceFollowUpRecord {
    id: string; 
    studentId: string;
    studentName: string;
    className: string;
    courseName: string;
    date: string;
}

const CONFIRMED_IDS_STORAGE_KEY = 'academic_absence_confirmed_ids';

const getConfirmedIds = (): Set<string> => {
    try {
        const stored = localStorage.getItem(CONFIRMED_IDS_STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
        console.error("Gagal mengurai ID yang dikonfirmasi dari localStorage", e);
        return new Set();
    }
};

const addConfirmedId = (id: string) => {
    const confirmedIds = getConfirmedIds();
    confirmedIds.add(id);
    try {
        localStorage.setItem(CONFIRMED_IDS_STORAGE_KEY, JSON.stringify(Array.from(confirmedIds)));
    } catch (e) {
        console.error("Gagal menyimpan ID yang dikonfirmasi ke localStorage", e);
        alert("Gagal menyimpan status. Catatan ini mungkin muncul lagi saat halaman dimuat ulang.");
    }
};


export const FollowUpView: React.FC = () => {
    const { records: allRecords, loading, refetchData } = useAcademicData();
    const [absences, setAbsences] = useState<AbsenceFollowUpRecord[]>([]);

    // State for pagination and search
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
      const confirmedIds = getConfirmedIds();
      const absenceRecords = allRecords
        .filter(r => r.status === RecapStatus.ABSENT && !confirmedIds.has(r.id.substring(2)))
        .map(r => ({
            id: r.id.substring(2), // Original absence ID
            studentId: r.studentId,
            studentName: r.studentName,
            className: r.className,
            courseName: r.courseName || 'N/A',
            date: r.date
        }))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.studentName.localeCompare(b.studentName));
      
      setAbsences(absenceRecords);

    }, [allRecords]);

    const filteredAbsences = useMemo(() => {
        return absences.filter(absence =>
            absence.studentName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [absences, searchQuery]);

    const paginatedAbsences = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAbsences.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAbsences, currentPage, itemsPerPage]);


    const handleConfirm = (absenceId: string) => {
        addConfirmedId(absenceId);
        setAbsences(prev => prev.filter(a => a.id !== absenceId));
    };

    const handleDelete = async (absenceId: string) => {
        const { error } = await supabase.from('academic_absences').delete().eq('id', absenceId);
        if (error) {
            console.error('Gagal menghapus absensi:', error.message);
        } else {
            const confirmedIds = getConfirmedIds();
            if (confirmedIds.has(absenceId)) {
                confirmedIds.delete(absenceId);
                localStorage.setItem(CONFIRMED_IDS_STORAGE_KEY, JSON.stringify(Array.from(confirmedIds)));
            }
            refetchData(); // Refresh data terpusat
        }
    };

    if (loading) {
        return <div className="text-center p-8">...jاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">متابعة الغياب</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
                <div className="p-2 sm:p-6">
                    <p className="text-slate-600 mb-4 text-sm sm:text-base">
                        تحتوي هذه القائمة على الطلاب الذين تم وضع علامة "غائب" عليهم من وحدة الحضور والغياب.
                        انقر فوق <b className="text-green-600">تأكيد</b> لإخفاء الطالب من هذه القائمة (تبقى البيانات في الملخصات).
                        انقر فوق <b className="text-red-600">حذف</b> لإزالة بيانات الغياب بشكل دائم dari جميع الوحدات.
                    </p>
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full md:w-1/3 p-2 border border-slate-300 rounded-lg mb-4"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600 responsive-table">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                               <tr>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">#</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الفصل</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">تاريخ الغياب</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">المادة الدراسية</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAbsences.length > 0 ? (
                                    paginatedAbsences.map((record, index) => (
                                        <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                            <td data-label="#" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                                            <td data-label="اسم الطالب" className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">{record.studentName}</td>
                                            <td data-label="الفصل" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.className}</td>
                                            <td data-label="تاريخ الغياب" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.date}</td>
                                            <td data-label="المادة الدراسية" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.courseName}</td>
                                            <td className="px-2 py-3 sm:px-6 sm:py-4 action-cell whitespace-nowrap">
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
                                            {searchQuery ? 'لم يتم العثور على طلاب.' : 'لا توجد بيانات غياب تحتاج إلى متابعة.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredAbsences.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                />
            </div>
        </div>
    );
};