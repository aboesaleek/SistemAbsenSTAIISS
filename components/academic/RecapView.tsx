import React, { useState, useMemo } from 'react';
import { AttendanceRecord, RecapStatus } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { supabase } from '../../supabaseClient';
import { useAcademicData } from '../../contexts/AcademicDataContext';

// Declare XLSX from window for TypeScript
declare global {
  interface Window {
    XLSX: any;
  }
}

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
    const { classes, records: allRecords, loading, refetchData } = useAcademicData();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Transform records from context to include sourceId and sourceType for deletion
    const combinedRecords = useMemo((): CombinedRecord[] => {
        return allRecords.map(r => ({
            ...r,
            sourceId: r.id.substring(2),
            sourceType: r.id.startsWith('p-') ? 'permission' : 'absence'
        }));
    }, [allRecords]);

    const filteredRecords = useMemo(() => {
        return combinedRecords.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = !selectedClassId || record.classId === selectedClassId;
            const recordDate = new Date(record.date);
            const matchesStartDate = !startDate || recordDate >= new Date(startDate);
            const matchesEndDate = !endDate || recordDate <= new Date(endDate);
            return matchesSearch && matchesClass && matchesStartDate && matchesEndDate;
        });
    }, [combinedRecords, searchQuery, selectedClassId, startDate, endDate]);

    const deleteRecord = async (record: CombinedRecord) => {
        const tableName = record.sourceType === 'permission' ? 'academic_permissions' : 'academic_absences';
        const { error } = await supabase.from(tableName).delete().eq('id', record.sourceId);

        if (error) {
            console.error(`فشل الحذف: ${error.message}`);
        } else {
            refetchData(); // Refresh data terpusat
        }
    };

    const handleExportXLSX = () => {
        if (!filteredRecords.length) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }

        const headers = ['#', 'اسم الطالب', 'الفصل', 'التاريخ', 'الحالة', 'المادة'];
        const data = filteredRecords.map((record, index) => [
            index + 1,
            record.studentName,
            record.className,
            record.date,
            record.status,
            record.courseName || '-'
        ]);

        const ws = window.XLSX.utils.aoa_to_sheet([headers, ...data]);

        if (!ws['!props']) ws['!props'] = {};
        ws['!props'].RTL = true;

        ws['!cols'] = [
            { wch: 5 },  // #
            { wch: 30 }, // اسم الطالب
            { wch: 20 }, // الفصل
            { wch: 15 }, // التاريخ
            { wch: 10 }, // الحالة
            { wch: 20 }  // المادة
        ];

        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'ملخص الغياب');
        const today = new Date().toISOString().split('T')[0];
        window.XLSX.writeFile(wb, `تقرير-الغياب-العام-${today}.xlsx`);
    };
    
    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الملخص العام</h2>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4">
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
                <button
                  onClick={handleExportXLSX}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>تصدير إلى XLSX</span>
                </button>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600 responsive-table">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">#</th>
                                <th className="px-6 py-3 whitespace-nowrap">اسم الطالب</th>
                                <th className="px-6 py-3 whitespace-nowrap">الفصل</th>
                                <th className="px-6 py-3 whitespace-nowrap">التاريخ</th>
                                <th className="px-6 py-3 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-3 whitespace-nowrap">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, index) => (
                                <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                    <td data-label="#" className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                    <td data-label="اسم الطالب" className="px-6 py-4 font-semibold whitespace-nowrap">
                                      <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-teal-600 hover:underline cursor-pointer">
                                          {record.studentName}
                                      </button>
                                    </td>
                                    <td data-label="الفصل" className="px-6 py-4 whitespace-nowrap">{record.className}</td>
                                    <td data-label="التاريخ" className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                                    <td data-label="الحالة" className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 action-cell whitespace-nowrap">
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