import React, { useState, useMemo, useRef } from 'react';
// FIX: Import specific absence types for type assertions.
import { CeremonyStatus, ceremonyStatusToLabel, DormitoryPrayerAbsence, DormitoryCeremonyAbsence } from '../../types';
import { DeleteIcon } from '../icons/DeleteIcon';
import { supabase } from '../../supabaseClient';
import { useDormitoryData } from '../../contexts/DormitoryDataContext';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PrinterIcon } from '../icons/PrinterIcon';

// Declare jsPDF and html2canvas from window for TypeScript
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`px-6 py-3 text-lg font-bold transition-colors duration-200 focus:outline-none ${isActive ? 'border-b-4 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-800'}`}>
        {children}
    </button>
);

interface GenericRecapProps {
    type: 'prayer' | 'ceremony';
    onStudentSelect: (studentId: string) => void;
}

const GenericAbsenceRecap: React.FC<GenericRecapProps> = ({ type, onStudentSelect }) => {
    const { dormitories, prayerAbsences, ceremonyAbsences, loading, refetchData } = useDormitoryData();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const recapContentRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const tableName = type === 'prayer' ? 'dormitory_prayer_absences' : 'dormitory_ceremony_absences';
    const title = type === 'prayer' ? 'ملخص غياب الصلاة' : 'ملخص غياب المراسم';

    const records = useMemo(() => {
        const sourceRecords = type === 'prayer' ? prayerAbsences : ceremonyAbsences;
        return sourceRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [type, prayerAbsences, ceremonyAbsences]);


    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDormitory = !selectedDormitoryId || record.dormitoryId === selectedDormitoryId;
            const recordDate = new Date(record.date);
            const matchesStartDate = !startDate || recordDate >= new Date(startDate);
            const matchesEndDate = !endDate || recordDate <= new Date(endDate);
            return matchesSearch && matchesDormitory && matchesStartDate && matchesEndDate;
        });
    }, [records, searchQuery, selectedDormitoryId, startDate, endDate]);

    const deleteRecord = async (id: string) => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
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
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div ref={recapContentRef} className="space-y-4 printable-area">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
                <div className="flex items-center gap-2 no-print">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>{isExporting ? '...جاري التصدير' : 'تصدير إلى PDF'}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        <span>طباعة</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                <input type="text" placeholder="بحث باسم الطالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" />
                <select value={selectedDormitoryId} onChange={e => setSelectedDormitoryId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                    <option value="">كل المهاجع</option>
                    {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600 responsive-table">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-6 py-3 whitespace-nowrap">#</th>
                            <th className="px-6 py-3 whitespace-nowrap">اسم الطالب</th>
                            <th className="px-6 py-3 whitespace-nowrap">المهجع</th>
                            <th className="px-6 py-3 whitespace-nowrap">التاريخ</th>
                            {type === 'prayer' && <th className="px-6 py-3 whitespace-nowrap">الصلاة</th>}
                            <th className="px-6 py-3 whitespace-nowrap">الحالة</th>
                            <th className="px-6 py-3 whitespace-nowrap no-print">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record, index) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                <td data-label="#" className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                <td data-label="اسم الطالب" className="px-6 py-4 font-semibold whitespace-nowrap">
                                    <button onClick={() => onStudentSelect(record.studentId)} className="text-right w-full hover:text-purple-600 hover:underline cursor-pointer no-print-link">{record.studentName}</button>
                                    <span className="print-only-text">{record.studentName}</span>
                                </td>
                                <td data-label="المهجع" className="px-6 py-4 whitespace-nowrap">{record.dormitoryName}</td>
                                <td data-label="التاريخ" className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                                {type === 'prayer' && (
                                    <td data-label="الصلاة" className="px-6 py-4 whitespace-nowrap">{(record as DormitoryPrayerAbsence).prayer}</td>
                                )}
                                <td data-label="الحالة" className="px-6 py-4 whitespace-nowrap">{ceremonyStatusToLabel[type === 'prayer' ? (record as DormitoryPrayerAbsence).status : (record as DormitoryCeremonyAbsence).status]}</td>
                                <td className="px-6 py-4 action-cell whitespace-nowrap no-print">
                                    <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRecords.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد بيانات تطابق معايير البحث.</p>}
            </div>
        </div>
    );
}

interface AbsenceRecapViewProps {
    onStudentSelect: (studentId: string) => void;
}

export const AbsenceRecapView: React.FC<AbsenceRecapViewProps> = ({ onStudentSelect }) => {
    const [activeTab, setActiveTab] = useState<'prayer' | 'ceremony'>('prayer');

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الغياب</h2>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
                <div className="flex justify-center border-b mb-6">
                    <TabButton isActive={activeTab === 'prayer'} onClick={() => setActiveTab('prayer')}>غياب الصلاة</TabButton>
                    <TabButton isActive={activeTab === 'ceremony'} onClick={() => setActiveTab('ceremony')}>غياب المراسم</TabButton>
                </div>
                <div>
                    {activeTab === 'prayer' && <GenericAbsenceRecap type="prayer" onStudentSelect={onStudentSelect} />}
                    {activeTab === 'ceremony' && <GenericAbsenceRecap type="ceremony" onStudentSelect={onStudentSelect} />}
                </div>
            </div>
        </div>
    );
};