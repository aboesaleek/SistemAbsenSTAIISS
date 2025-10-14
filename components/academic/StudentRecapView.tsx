import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AttendanceRecord, RecapStatus } from '../../types';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { PrinterIcon } from '../icons/PrinterIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

// Declare jsPDF and html2canvas from window for TypeScript
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const StatCard: React.FC<{ label: string; value: number; gradient: string }> = ({ label, value, gradient }) => (
    <div className={`text-white p-4 rounded-xl shadow-lg bg-gradient-to-br ${gradient}`}>
        <p className="text-sm font-semibold opacity-90">{label}</p>
        <span className="text-4xl font-bold">{value}</span>
    </div>
);

const DonutChart: React.FC<{ data: { label: string; value: number; color: string; bgColor: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) {
       return (
         <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الغياب</h4>
            <p className="text-slate-500">لا توجد بيانات لعرضها.</p>
        </div>
       )
    }
    const radius = 15.9155;
    const circumference = 2 * Math.PI * radius;
    let accumulatedLength = 0;

    return (
        <div className="w-full flex flex-col items-center justify-center bg-slate-50/80 p-6 rounded-xl border border-slate-200/60 min-h-[316px]">
            <h4 className="text-lg font-bold text-slate-700 mb-4 text-center">ملخص الغياب</h4>
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
            <div className="mt-6 w-full flex justify-center gap-4 text-sm">
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

interface StudentRecapViewProps {
  preselectedStudentId?: string | null;
}

export const StudentRecapView: React.FC<StudentRecapViewProps> = ({ preselectedStudentId }) => {
    const { classes, students, records: allRecords, loading } = useAcademicData();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    const [isExporting, setIsExporting] = useState(false);
    const recapContentRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (preselectedStudentId && students.length > 0) {
        const student = students.find(s => s.id === preselectedStudentId);
        if (student) {
          setSelectedClassId(student.class_id || '');
          setSelectedStudentId(student.id);
        }
      }
    }, [preselectedStudentId, students]);

    const studentData = useMemo(() => {
        if (!selectedStudentId) return null;
        const records = allRecords.filter(r => r.studentId === selectedStudentId);
        const absentRecords = records.filter(r => r.status === RecapStatus.ABSENT);
        const permissionRecords = records.filter(r => r.status === RecapStatus.PERMISSION);
        const sickRecords = records.filter(r => r.status === RecapStatus.SICK);
        const uniqueDays = new Set(records.map(r => r.date)).size;
        
        const allEvents = [...permissionRecords, ...sickRecords]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const absenceDetailsByCourse = new Map<string, string[]>();
        absentRecords.forEach(record => {
            const courseName = record.courseName || 'غير محدد';
            if (!absenceDetailsByCourse.has(courseName)) {
                absenceDetailsByCourse.set(courseName, []);
            }
            const dates = absenceDetailsByCourse.get(courseName)!;
            if (dates.length < 3) {
                dates.push(record.date);
            }
        });
        absenceDetailsByCourse.forEach(dates => dates.sort());

        return {
            absentRecords,
            permissionRecords,
            sickRecords,
            uniqueDays,
            absenceDetailsByCourse,
            allEvents,
        };
    }, [selectedStudentId, allRecords]);

    const filteredStudents = useMemo(() => {
        let result = students;
        if (selectedClassId) {
            result = result.filter(s => s.class_id === selectedClassId);
        }
        if (searchQuery) {
            result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return result;
    }, [students, selectedClassId, searchQuery]);

    const generateReportCanvas = async (): Promise<HTMLCanvasElement | null> => {
        const reportElement = recapContentRef.current;
        if (!reportElement) {
            console.error("Report element ref is missing.");
            return null;
        }

        const scrollableLog = reportElement.querySelector('.js-log-container') as HTMLElement;
        let originalLogMaxHeight = '';
        let originalLogOverflowY = '';

        if (scrollableLog) {
            originalLogMaxHeight = scrollableLog.style.maxHeight;
            originalLogOverflowY = scrollableLog.style.overflowY;
        }

        try {
            // Temporarily modify styles for full content capture
            if (scrollableLog) {
                scrollableLog.style.maxHeight = 'none';
                scrollableLog.style.overflowY = 'visible';
            }

            const canvas = await window.html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            
            return canvas;
        } finally {
            // Revert styles
            if (scrollableLog) {
                scrollableLog.style.maxHeight = originalLogMaxHeight;
                scrollableLog.style.overflowY = originalLogOverflowY;
            }
        }
    };

    const handlePrint = async () => {
        setIsExporting(true); // Reuse state to show loading/disabled state
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


    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-800">ملخص الطالب</h2>
                 {studentData && (
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
                            disabled={isExporting}
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
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setSelectedStudentId(''); }}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                    <select
                        value={selectedClassId}
                        onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                        <option value="">-- اختر الفصل --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        disabled={filteredStudents.length === 0}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                    >
                        <option value="">-- اختر الطالب --</option>
                        {filteredStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {studentData && (
                <div ref={recapContentRef} className="printable-area">
                    <div className="space-y-6 p-4 bg-white">
                        <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg border">
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">{students.find(s=>s.id === selectedStudentId)?.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-between space-y-4">
                                    <div className="text-center p-6 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-xl shadow-xl">
                                        <p className="text-lg font-semibold">مجموع أيام الغياب</p>
                                        <p className="text-7xl font-extrabold tracking-tighter">{studentData.uniqueDays}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <StatCard label="غائب" value={studentData.absentRecords.length} gradient="from-red-500 to-orange-500" />
                                        <StatCard label="إذن" value={studentData.permissionRecords.length} gradient="from-blue-500 to-sky-500" />
                                        <StatCard label="مرض" value={studentData.sickRecords.length} gradient="from-yellow-400 to-yellow-500" />
                                    </div>
                                </div>
                                <DonutChart data={[
                                    {label: 'غائب', value: studentData.absentRecords.length, color: 'text-red-500', bgColor: 'bg-red-500'},
                                    {label: 'إذن', value: studentData.permissionRecords.length, color: 'text-blue-500', bgColor: 'bg-blue-500'},
                                    {label: 'مرض', value: studentData.sickRecords.length, color: 'text-yellow-500', bgColor: 'bg-yellow-500'},
                                ]} />
                            </div>
                        </div>
                    
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border">
                            <h3 className="text-xl font-bold text-slate-700 mb-4">تفاصيل السجل</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <h4 className="font-bold text-slate-800 mb-2 border-b-2 border-slate-200 pb-2">سجل الإذن والمرض</h4>
                                         <div className="overflow-y-auto max-h-48 js-log-container">
                                            <table className="w-full text-sm text-right">
                                                <tbody>
                                                    {studentData.allEvents.length > 0 ? studentData.allEvents.map(event => (
                                                        <tr key={event.id} className="border-b border-slate-200/50 last:border-0">
                                                            <td className="py-2 pr-2 font-semibold whitespace-nowrap">{event.date}</td>
                                                            <td className="py-2 pl-2 whitespace-nowrap">
                                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                    event.status === RecapStatus.SICK 
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {event.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td className="text-slate-500 text-center py-4">لا يوجد سجل</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                         </div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-700 mb-3">تفاصيل الغياب حسب المادة</h4>
                                        <div className="overflow-x-auto border border-red-200 rounded-lg">
                                            <table className="w-full text-sm text-right text-slate-600 responsive-table">
                                                <thead className="text-xs text-red-800 uppercase bg-red-100">
                                                    <tr>
                                                        <th className="px-4 py-3 whitespace-nowrap">المادة الدراسية</th>
                                                        <th className="px-4 py-3 whitespace-nowrap">الغياب الأول</th>
                                                        <th className="px-4 py-3 whitespace-nowrap">الغياب الثاني</th>
                                                        <th className="px-4 py-3 whitespace-nowrap">الغياب الثالث</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentData.absenceDetailsByCourse.size > 0 ? (
                                                        Array.from(studentData.absenceDetailsByCourse.entries()).map(([course, dates]) => (
                                                            <tr key={course} className="bg-white border-b border-red-100 last:border-b-0 hover:bg-red-50/50">
                                                                <td data-label="المادة الدراسية" className="px-4 py-3 font-semibold whitespace-nowrap">{course}</td>
                                                                <td data-label="الغياب الأول" className="px-4 py-3 whitespace-nowrap">{dates[0] || '-'}</td>
                                                                <td data-label="الغياب الثاني" className="px-4 py-3 whitespace-nowrap">{dates[1] || '-'}</td>
                                                                <td data-label="الغياب الثالث" className="px-4 py-3 whitespace-nowrap">{dates[2] || '-'}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="text-center py-6 text-slate-500">لا يوجد سجل غياب.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};