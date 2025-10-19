import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DormitoryPermissionType, CeremonyStatus, ceremonyStatusToLabel, Student } from '../../types';
import { supabase } from '../../supabaseClient';
import { DeleteIcon } from '../icons/DeleteIcon';
import { useDormitoryData } from '../../contexts/DormitoryDataContext';
import { PrinterIcon } from '../icons/PrinterIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

// Declare jsPDF, html2canvas, and markdownit from window for TypeScript
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    markdownit: any;
  }
}

const StatCard: React.FC<{ label: string; value: number; gradient: string }> = ({ label, value, gradient }) => (
    <div className={`text-white p-4 rounded-xl shadow-lg bg-gradient-to-br ${gradient}`}>
        <p className="text-sm font-semibold opacity-90">{label}</p>
        <span className="text-4xl font-bold">{value}</span>
    </div>
);

const DonutChart: React.FC<{ title: string; data: { label: string; value: number; color: string; bgColor: string }[] }> = ({ title, data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) {
       return (
         <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">{title}</h4>
            <p className="text-slate-500">لا توجد بيانات لعرضها.</p>
        </div>
       )
    }
    const radius = 15.9155;
    const circumference = 2 * Math.PI * radius;
    let accumulatedLength = 0;

    return (
        <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">{title}</h4>
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r={radius} className="stroke-current text-slate-200" strokeWidth="3" fill="transparent" />
                    {data.map((item, index) => {
                        if (item.value === 0) return null;
                        const segmentLength = (item.value / total) * circumference;
                        const strokeDashoffset = accumulatedLength;
                        accumulatedLength += segmentLength;

                        return (
                            <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r={radius}
                                className={`stroke-current ${item.color}`}
                                strokeWidth="3.2"
                                fill="transparent"
                                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                strokeDashoffset={-strokeDashoffset}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-700">{total}</span>
                    <span className="text-sm text-slate-500">مجموع</span>
                </div>
            </div>
            <div className="mt-6 w-full flex justify-center gap-x-4 gap-y-2 flex-wrap text-sm">
                {data.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${item.bgColor}`}></span>
                        <span className="font-semibold text-slate-600">{item.label}:</span>
                        <span className="font-bold text-slate-800">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MainTabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`px-4 sm:px-6 py-3 text-base sm:text-lg font-bold transition-colors duration-200 focus:outline-none text-center ${isActive ? 'border-b-4 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-800'}`}>
        {children}
    </button>
);

interface StudentRecapViewProps {
  preselectedStudentId?: string | null;
}

export const StudentRecapView: React.FC<StudentRecapViewProps> = ({ preselectedStudentId }) => {
    const { dormitories, students, permissionRecords, prayerAbsences, ceremonyAbsences, loading, refetchData } = useDormitoryData();
    const { showNotification } = useNotification();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    const [activeTab, setActiveTab] = useState<'permissions' | 'prayerAbsences' | 'ceremonyAbsences'>('permissions');
    const [isExporting, setIsExporting] = useState(false);
    const recapContentRef = useRef<HTMLDivElement>(null);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'prayer' | 'ceremony' | 'permission' } | null>(null);

    const executeDelete = async () => {
        if (!confirmDelete) return;

        const { id, type } = confirmDelete;
        const tableName = type === 'prayer' ? 'dormitory_prayer_absences' : type === 'ceremony' ? 'dormitory_ceremony_absences' : 'dormitory_permissions';
        
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
            showNotification(`فشل في حذف السجل: ${error.message}`, 'error');
        } else {
            showNotification('تم حذف السجل بنجاح.', 'success');
            refetchData();
        }
    };
    
    useEffect(() => {
      if (preselectedStudentId && students.length > 0) {
        const student = students.find(s => s.id === preselectedStudentId);
        if (student) {
          setSelectedDormitoryId(student.dormitory_id || '');
          setSelectedStudentId(student.id);
          setSearchQuery(student.name);
        }
      }
    }, [preselectedStudentId, students]);

    useEffect(() => {
        setAiSummary('');
        setSummaryError('');
    }, [selectedStudentId]);

    const permissionData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = permissionRecords.filter((r: any) => r.student_id === selectedStudentId);
        const sickRecords = records.filter(r => r.type === DormitoryPermissionType.SICK_LEAVE);
        const groupRecords = records.filter(r => r.type === DormitoryPermissionType.GROUP_LEAVE);
        const generalRecords = records.filter(r => r.type === DormitoryPermissionType.GENERAL_LEAVE);
        const overnightRecords = records.filter(r => r.type === DormitoryPermissionType.OVERNIGHT_LEAVE);

        return {
            records: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            sickCount: sickRecords.length,
            groupCount: groupRecords.length,
            generalCount: generalRecords.length,
            overnightCount: overnightRecords.length,
            total: records.length
        };
    }, [selectedStudentId, permissionRecords]);
    
    const prayerAbsenceData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = prayerAbsences.filter(r => r.studentId === selectedStudentId);
        return {
            records: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            totalAlpha: records.filter(r => r.status === CeremonyStatus.ALPHA).length,
            totalIzin: records.filter(r => r.status === CeremonyStatus.IZIN).length,
            totalSakit: records.filter(r => r.status === CeremonyStatus.SAKIT).length,
            total: records.length,
        };
    }, [selectedStudentId, prayerAbsences]);
    
    const ceremonyAbsenceData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = ceremonyAbsences.filter(r => r.studentId === selectedStudentId);
        return {
            records: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            totalAlpha: records.filter(r => r.status === CeremonyStatus.ALPHA).length,
            totalIzin: records.filter(r => r.status === CeremonyStatus.IZIN).length,
            totalSakit: records.filter(r => r.status === CeremonyStatus.SAKIT).length,
            total: records.length,
        };
    }, [selectedStudentId, ceremonyAbsences]);

    const allSearchedStudents = useMemo(() => {
        if (!searchQuery) return [];
        const selectedStudentName = students.find(s => s.id === selectedStudentId)?.name;
        if (searchQuery === selectedStudentName) return [];
        return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, students, selectedStudentId]);

    const studentsInSelectedDormitory = useMemo(() => {
        if (!selectedDormitoryId) return [];
        return students.filter(s => s.dormitory_id === selectedDormitoryId);
    }, [students, selectedDormitoryId]);

    const handleStudentSearchSelect = (student: Student) => {
        setSearchQuery(student.name);
        setSelectedDormitoryId(student.dormitory_id || '');
        setSelectedStudentId(student.id);
        setShowSearchResults(false);
    };

    const generateReportCanvas = async (): Promise<HTMLCanvasElement | null> => {
        const reportElement = recapContentRef.current;
        if (!reportElement) {
            console.error("Report element ref is missing.");
            return null;
        }

        const scrollableContainers = reportElement.querySelectorAll('.js-log-container');
        const originalStyles: { element: HTMLElement; maxHeight: string; overflowY: string }[] = [];

        try {
            scrollableContainers.forEach(container => {
                const el = container as HTMLElement;
                originalStyles.push({ element: el, maxHeight: el.style.maxHeight, overflowY: el.style.overflowY });
                el.style.maxHeight = 'none';
                el.style.overflowY = 'visible';
            });

            const canvas = await window.html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            
            return canvas;
        } finally {
            originalStyles.forEach(({ element, maxHeight, overflowY }) => {
                element.style.maxHeight = maxHeight;
                element.style.overflowY = overflowY;
            });
        }
    };

    const handlePrint = async () => {
        setIsExporting(true);
        try {
            const canvas = await generateReportCanvas();
            if (!canvas) throw new Error("Canvas generation failed.");

            const imgData = canvas.toDataURL('image/png');

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert("Please allow popups for this site to print.");
                setIsExporting(false);
                return;
            }
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>طباعة التقرير</title>
                    <style>
                        @page { size: landscape; margin: 0; }
                        body { margin: 0; }
                        img { width: 100%; height: 100%; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="${imgData}" />
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };

        } catch (error) {
            console.error("Error preparing for print:", error);
            alert("حدث خطأ أثناء إعداد الطباعة. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        const studentName = students.find(s => s.id === selectedStudentId)?.name;
        if (!studentName) {
            console.error("Student name is missing for PDF export.");
            return;
        }
        
        setIsExporting(true);
        try {
            const canvas = await generateReportCanvas();
            if (!canvas) throw new Error("Canvas generation failed.");
            
            const imgData = canvas.toDataURL('image/png');
            
            const { jsPDF } = window.jspdf;
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

            const pdfImageWidth = A4_WIDTH - MARGIN * 2;
            const pdfImageHeight = A4_HEIGHT - MARGIN * 2;

            let finalWidth, finalHeight;

            if (canvasAspectRatio > (pdfImageWidth / pdfImageHeight)) {
                finalWidth = pdfImageWidth;
                finalHeight = (pdfImageWidth * canvasHeight) / canvasWidth;
            } else {
                finalHeight = pdfImageHeight;
                finalWidth = (pdfImageHeight * canvasWidth) / canvasHeight;
            }
            
            const x = MARGIN + (pdfImageWidth - finalWidth) / 2;
            const y = MARGIN + (pdfImageHeight - finalHeight) / 2;
            
            doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

            const today = new Date().toISOString().split('T')[0];
            const fileName = `تقرير-غياب-${studentName.replace(/\s/g, '_')}-${today}.pdf`;
            
            doc.save(fileName);
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            alert("حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!permissionData || !prayerAbsenceData || !ceremonyAbsenceData || !selectedStudentId) return;
        setIsGeneratingSummary(true);
        setAiSummary('');
        setSummaryError('');

        try {
            const studentName = students.find(s => s.id === selectedStudentId)?.name;
            const prompt = `فيما يلي ملخص بيانات طالب المهجع المسمى ${studentName} خلال فترة واحدة:
- إجمالي الأذونات: ${permissionData.total} (مرض: ${permissionData.sickCount}، جماعي: ${permissionData.groupCount}، عام: ${permissionData.generalCount}، مبيت: ${permissionData.overnightCount}).
- إجمالي الغياب عن الصلاة: ${prayerAbsenceData.total} (بدون عذر: ${prayerAbsenceData.totalAlpha}، بإذن: ${prayerAbsenceData.totalIzin}، مرض: ${prayerAbsenceData.totalSakit}).
- إجمالي الغياب عن المراسم: ${ceremonyAbsenceData.total} (بدون عذر: ${ceremonyAbsenceData.totalAlpha}، بإذن: ${ceremonyAbsenceData.totalIzin}، مرض: ${ceremonyAbsenceData.totalSakit}).

قم بإنشاء ملخص تحليلي موجز في 2-3 جمل حول نمط سلوكه وحضوره في المهجع باللغة العربية. ركز على المشاكل المحتملة إن وجدت وقدم توصية موجزة إذا لزم الأمر.`;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            const md = window.markdownit();
            setAiSummary(md.render(response.text));

        } catch (error) {
            console.error("Error generating AI summary:", error);
            setSummaryError('فشل إنشاء الملخص. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <ConfirmationDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={executeDelete}
                title="تأكيد الحذف"
                message="هل أنت متأكد أنك تريد حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
            />
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800 self-start">ملخص الطالب</h2>
                 {(permissionData || prayerAbsenceData || ceremonyAbsenceData) && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 no-print w-full md:w-auto">
                         <button
                            onClick={handleGenerateSummary}
                            disabled={isGeneratingSummary || isExporting}
                            className="flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>{isGeneratingSummary ? '...جاري الإنشاء' : 'إنشاء ملخص بالذكاء الاصطناعي'}</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || isGeneratingSummary}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>{isExporting ? '...جاري التصدير' : 'تصدير إلى PDF'}</span>
                        </button>
                         <button
                            onClick={handlePrint}
                            disabled={isExporting || isGeneratingSummary}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            <span>{isExporting ? '...جاري الطباعة' : 'طباعة'}</span>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4 no-print">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث باسم الطالب..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setShowSearchResults(true);
                                setSelectedStudentId('');
                            }}
                            onFocus={() => setShowSearchResults(true)}
                            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                            className="w-full p-2 border border-slate-300 rounded-lg"
                        />
                        {showSearchResults && allSearchedStudents.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                {allSearchedStudents.slice(0, 10).map(student => (
                                    <li
                                        key={student.id}
                                        className="p-2 hover:bg-purple-100 cursor-pointer text-sm"
                                        onClick={() => handleStudentSearchSelect(student)}
                                    >
                                        {student.name} - <span className="text-xs text-slate-500">{dormitories.find(d => d.id === student.dormitory_id)?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <select
                        value={selectedDormitoryId}
                        onChange={e => {
                            setSelectedDormitoryId(e.target.value);
                            setSelectedStudentId('');
                            setSearchQuery('');
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">-- اختر المهجع --</option>
                        {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select
                        value={selectedStudentId}
                        onChange={e => {
                            const student = students.find(s => s.id === e.target.value);
                            setSelectedStudentId(e.target.value);
                            if (student) {
                                setSearchQuery(student.name);
                            } else {
                                setSearchQuery('');
                            }
                        }}
                        disabled={!selectedDormitoryId}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                    >
                        <option value="">-- اختر الطالب --</option>
                        {studentsInSelectedDormitory.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedStudentId && (
              <div ref={recapContentRef} className="printable-area">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 sm:p-4">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">{students.find(s=>s.id === selectedStudentId)?.name}</h3>
                    <div className="flex justify-center border-b no-print">
                        <MainTabButton isActive={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')}>ملخص الأذونات</MainTabButton>
                        <MainTabButton isActive={activeTab === 'prayerAbsences'} onClick={() => setActiveTab('prayerAbsences')}>غياب الصلاة</MainTabButton>
                        <MainTabButton isActive={activeTab === 'ceremonyAbsences'} onClick={() => setActiveTab('ceremonyAbsences')}>غياب المراسم</MainTabButton>
                    </div>

                     {(isGeneratingSummary || aiSummary || summaryError) && (
                        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded-r-lg my-4 no-print">
                            <h4 className="flex items-center gap-2 text-lg font-bold text-teal-800 mb-2">
                                <SparklesIcon className="w-6 h-6" />
                                ملخص بالذكاء الاصطناعي
                            </h4>
                            {isGeneratingSummary && <p className="text-teal-700">جاري إنشاء الملخص، يرجى الانتظار...</p>}
                            {summaryError && <p className="text-red-600">{summaryError}</p>}
                            {aiSummary && <div className="prose prose-sm text-teal-800" dangerouslySetInnerHTML={{ __html: aiSummary }} />}
                        </div>
                    )}

                    {activeTab === 'permissions' && permissionData && (
                        <div className="p-2 sm:p-6 space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-between space-y-4">
                                   <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-xl">
                                        <p className="text-lg font-semibold">مجموع الأذونات</p>
                                        <p className="text-7xl font-extrabold tracking-tighter">{permissionData.total}</p>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <StatCard label="مرض" value={permissionData.sickCount} gradient="from-red-500 to-orange-500" />
                                        <StatCard label="جماعي" value={permissionData.groupCount} gradient="from-sky-500 to-indigo-600" />
                                        <StatCard label="فردي" value={permissionData.generalCount} gradient="from-emerald-500 to-teal-600" />
                                        <StatCard label="مبيت" value={permissionData.overnightCount} gradient="from-slate-700 to-gray-800" />
                                    </div>
                                </div>
                                <DonutChart title="ملخص الأذونات" data={[
                                    {label: 'مرض', value: permissionData.sickCount, color: 'text-red-500', bgColor: 'bg-red-500'},
                                    {label: 'جماعي', value: permissionData.groupCount, color: 'text-sky-500', bgColor: 'bg-sky-500'},
                                    {label: 'فردي', value: permissionData.generalCount, color: 'text-emerald-500', bgColor: 'bg-emerald-500'},
                                    {label: 'مبيت', value: permissionData.overnightCount, color: 'text-slate-700', bgColor: 'bg-slate-700'},
                                ]} />
                            </div>
                        
                            <div>
                                <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل سجل الإذن</h3>
                                <div className="overflow-x-auto max-h-96 border rounded-lg js-log-container">
                                    <table className="w-full text-sm text-right text-slate-600 responsive-table">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">#</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">التاريخ</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">النوع</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">عدد الأيام</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">البيان</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap no-print">إجراء</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {permissionData.records.length > 0 ? (
                                                permissionData.records.map((record, index) => (
                                                    <tr key={record.id} className="border-b hover:bg-slate-50">
                                                        <td data-label="#" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{index + 1}</td>
                                                        <td data-label="التاريخ" className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">{record.date}</td>
                                                        <td data-label="النوع" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.type}</td>
                                                        <td data-label="عدد الأيام" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.number_of_days}</td>
                                                        <td data-label="البيان" className="px-2 py-3 sm:px-6 sm:py-4 text-slate-500 whitespace-nowrap">{record.reason || '-'}</td>
                                                        <td className="px-2 py-3 sm:px-6 sm:py-4 action-cell whitespace-nowrap no-print">
                                                            <button onClick={() => setConfirmDelete({ id: record.id, type: 'permission' })} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-slate-500">لا يوجد سجل إذن لهذا الطالب.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'prayerAbsences' && prayerAbsenceData && (
                        <div className="p-2 sm:p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-between space-y-4">
                                    <div className="text-center p-6 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-xl shadow-xl">
                                        <p className="text-lg font-semibold">مجموع غياب الصلاة</p>
                                        <p className="text-7xl font-extrabold tracking-tighter">{prayerAbsenceData.total}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <StatCard label="غائب" value={prayerAbsenceData.totalAlpha} gradient="from-red-500 to-orange-500" />
                                        <StatCard label="إذن" value={prayerAbsenceData.totalIzin} gradient="from-blue-500 to-sky-500" />
                                        <StatCard label="مرض" value={prayerAbsenceData.totalSakit} gradient="from-yellow-400 to-yellow-500" />
                                    </div>
                                </div>
                                <DonutChart title="ملخص غياب الصلاة" data={[
                                    {label: 'غائب', value: prayerAbsenceData.totalAlpha, color: 'text-red-500', bgColor: 'bg-red-500'},
                                    {label: 'إذن', value: prayerAbsenceData.totalIzin, color: 'text-blue-500', bgColor: 'bg-blue-500'},
                                    {label: 'مرض', value: prayerAbsenceData.totalSakit, color: 'text-yellow-500', bgColor: 'bg-yellow-500'},
                                ]} />
                            </div>
                        
                            <div>
                                <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل سجل غياب الصلاة</h3>
                                <div className="overflow-x-auto max-h-96 border rounded-lg js-log-container">
                                    <table className="w-full text-sm text-right text-slate-600 responsive-table">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">#</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">التاريخ</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الصلاة</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الحالة</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap no-print">إجراء</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {prayerAbsenceData.records.length > 0 ? (
                                                prayerAbsenceData.records.map((record, index) => (
                                                    <tr key={record.id} className="border-b hover:bg-slate-50">
                                                        <td data-label="#" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{index + 1}</td>
                                                        <td data-label="التاريخ" className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">{record.date}</td>
                                                        <td data-label="الصلاة" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{record.prayer}</td>
                                                        <td data-label="الحالة" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{ceremonyStatusToLabel[record.status]}</td>
                                                        <td className="px-2 py-3 sm:px-6 sm:py-4 action-cell whitespace-nowrap no-print">
                                                            <button onClick={() => setConfirmDelete({ id: record.id, type: 'prayer' })} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={5} className="text-center py-8 text-slate-500">لا يوجد سجل غياب صلاة لهذا الطالب.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ceremonyAbsences' && ceremonyAbsenceData && (
                        <div className="p-2 sm:p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-between space-y-4">
                                    <div className="text-center p-6 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl shadow-xl">
                                        <p className="text-lg font-semibold">مجموع غياب المراسم</p>
                                        <p className="text-7xl font-extrabold tracking-tighter">{ceremonyAbsenceData.total}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <StatCard label="غائب" value={ceremonyAbsenceData.totalAlpha} gradient="from-red-500 to-orange-500" />
                                        <StatCard label="إذن" value={ceremonyAbsenceData.totalIzin} gradient="from-blue-500 to-sky-500" />
                                        <StatCard label="مرض" value={ceremonyAbsenceData.totalSakit} gradient="from-yellow-400 to-yellow-500" />
                                    </div>
                                </div>
                                <DonutChart title="ملخص غياب المراسم" data={[
                                    {label: 'غائب', value: ceremonyAbsenceData.totalAlpha, color: 'text-red-500', bgColor: 'bg-red-500'},
                                    {label: 'إذن', value: ceremonyAbsenceData.totalIzin, color: 'text-blue-500', bgColor: 'bg-blue-500'},
                                    {label: 'مرض', value: ceremonyAbsenceData.totalSakit, color: 'text-yellow-500', bgColor: 'bg-yellow-500'},
                                ]} />
                            </div>
                        
                            <div>
                                <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل سجل غياب المراسم</h3>
                                <div className="overflow-x-auto max-h-96 border rounded-lg js-log-container">
                                    <table className="w-full text-sm text-right text-slate-600 responsive-table">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">#</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">التاريخ</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الحالة</th>
                                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap no-print">إجراء</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {ceremonyAbsenceData.records.length > 0 ? (
                                                ceremonyAbsenceData.records.map((record, index) => (
                                                    <tr key={record.id} className="border-b hover:bg-slate-50">
                                                        <td data-label="#" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{index + 1}</td>
                                                        <td data-label="التاريخ" className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">{record.date}</td>
                                                        <td data-label="الحالة" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{ceremonyStatusToLabel[record.status]}</td>
                                                        <td className="px-2 py-3 sm:px-6 sm:py-4 action-cell whitespace-nowrap no-print">
                                                            <button onClick={() => setConfirmDelete({ id: record.id, type: 'ceremony' })} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={4} className="text-center py-8 text-slate-500">لا يوجد سجل غياب مراسم لهذا الطالب.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            )}
        </div>
    );
};
