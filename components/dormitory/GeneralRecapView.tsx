import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dormitory, Student, DormitoryPermissionType } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { supabase } from '../../supabaseClient';
import { useDormitoryData } from '../../contexts/DormitoryDataContext';
import { DownloadIcon } from '../icons/DownloadIcon';
import { Pagination } from '../shared/Pagination';

// Declare jsPDF and html2canvas from window for TypeScript
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

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
    const { dormitories, students, permissionRecords, loading, refetchData } = useDormitoryData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const recapContentRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const records = useMemo(() => {
        const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));
        const dormsMap = new Map<string, string>(dormitories.map(d => [d.id, d.name]));

        return permissionRecords
            .filter(p => p.type === permissionType)
            .map((p: any) => {
                const student = studentsMap.get(p.student_id);
                const dormitoryName = student ? dormsMap.get(student.dormitory_id!) : 'N/A';
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
    }, [permissionType, students, dormitories, permissionRecords]);

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDormitory = !selectedDormitoryId || record.dormitoryId === selectedDormitoryId;
            return matchesSearch && matchesDormitory;
        });
    }, [records, searchQuery, selectedDormitoryId]);

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRecords, currentPage, itemsPerPage]);

    const deleteRecord = async (id: string) => {
        const { error } = await supabase.from('dormitory_permissions').delete().eq('id', id);
        if (error) {
            console.error(`Gagal menghapus catatan: ${error.message}`);
        } else {
            refetchData();
        }
    };

    const handlePrint = () => window.print();

    const handleExportPDF = async () => {
        if (!recapContentRef.current) {
            console.error("Ref is missing.");
            return;
        }
        
        setIsExporting(true);
        try {
            const { jsPDF } = window.jspdf;
            const canvas = await window.html2canvas(recapContentRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });
            
            const A4_WIDTH = 297;
            const A4_HEIGHT = 210;
            const MARGIN = 10;
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;

            const pdfWidth = A4_WIDTH - MARGIN * 2;
            const pdfHeight = A4_HEIGHT - MARGIN * 2;
            const pdfAspectRatio = pdfWidth / pdfHeight;

            let finalWidth, finalHeight;
            if (canvasAspectRatio > pdfAspectRatio) {
                finalWidth = pdfWidth;
                finalHeight = pdfWidth / canvasAspectRatio;
            } else {
                finalHeight = pdfHeight;
                finalWidth = pdfHeight * canvasAspectRatio;
            }
            
            const x = MARGIN + (pdfWidth - finalWidth) / 2;
            const y = MARGIN + (pdfHeight - finalHeight) / 2;
            
            doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

            const today = new Date().toISOString().split('T')[0];
            const fileName = `تقرير-${title.replace(/\s/g, '_')}-${today}.pdf`;
            
            doc.save(fileName);
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            alert("حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8 bg-white rounded-2xl shadow-lg border">...جاري تحميل البيانات</div>;
    }
    
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            <div ref={recapContentRef} className="p-2 sm:p-6 printable-area">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
                    <div className="no-print flex items-center gap-2">
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>{isExporting ? '...جاري التصدير' : 'تصدير إلى PDF'}</span>
                        </button>
                        <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <PrinterIcon className="w-5 h-5" />
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 no-print">
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <select
                        value={selectedDormitoryId}
                        onChange={e => { setSelectedDormitoryId(e.target.value); setCurrentPage(1); }}
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
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">#</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">المهجع</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">التاريخ</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">عدد الأيام</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">البيان</th>
                                <th className="px-2 py-3 sm:px-6 no-print whitespace-nowrap">إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.map((record, index) => (
                                <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                    <td data-label="#" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                                    <td data-label="اسم الطالب" className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">
                                         <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-purple-600 hover:underline cursor-pointer no-print-link">
                                            {record.studentName}
                                        </button>
                                        <span className="print-only-text">{record.studentName}</span>
                                    </td>
                                    <td data-label="المهجع" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.dormitoryName}</td>
                                    <td data-label="التاريخ" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.date}</td>
                                    <td data-label="عدد الأيام" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.numberOfDays}</td>
                                    <td data-label="البيان" className="px-2 py-3 sm:px-6 sm:py-4 text-slate-500 whitespace-nowrap">{record.reason || '-'}</td>
                                    <td className="px-2 py-3 sm:px-6 sm:py-4 no-print action-cell whitespace-nowrap">
                                        <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {paginatedRecords.length === 0 && (
                        <p className="text-center text-slate-500 py-8">لا توجد بيانات تطابق معايير البحث.</p>
                    )}
                </div>
            </div>
            <Pagination
                currentPage={currentPage}
                totalItems={filteredRecords.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
            />
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
            <h2 className="text-3xl font-bold text-slate-800">ملخص الأذونات</h2>
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 no-print">
                <label htmlFor="recap-select" className="block text-lg font-semibold text-slate-700 mb-2">اختر نوع الملخص</label>
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