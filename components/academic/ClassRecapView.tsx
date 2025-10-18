import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RecapStatus, StudentRecapData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';
import { useAcademicData } from '../../contexts/AcademicDataContext';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';

// Declare jsPDF, html2canvas, and markdownit from window for TypeScript
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    markdownit: any;
  }
}

interface ClassRecapViewProps {
  onStudentSelect: (studentId: string) => void;
}

export const ClassRecapView: React.FC<ClassRecapViewProps> = ({ onStudentSelect }) => {
    const { classes, records: allRecords, loading } = useAcademicData();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const recapContentRef = useRef<HTMLDivElement>(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    useEffect(() => {
        setAiAnalysis('');
        setAnalysisError('');
    }, [selectedClassId]);
    
    const classRecapData = useMemo((): StudentRecapData[] => {
        if (!selectedClassId) return [];

        const classRecords = allRecords.filter(r => r.classId === selectedClassId);
        const studentDataMap = new Map<string, StudentRecapData>();

        for (const record of classRecords) {
            if (!studentDataMap.has(record.studentId)) {
                studentDataMap.set(record.studentId, {
                    studentId: record.studentId,
                    studentName: record.studentName,
                    absentCount: 0,
                    permissionCount: 0,
                    sickCount: 0,
                    total: 0,
                    uniqueDays: 0,
                });
            }
            const studentData = studentDataMap.get(record.studentId)!;
            studentData.total++;
            if (record.status === RecapStatus.ABSENT) studentData.absentCount++;
            if (record.status === RecapStatus.PERMISSION) studentData.permissionCount++;
            if (record.status === RecapStatus.SICK) studentData.sickCount++;
        }

        studentDataMap.forEach(data => {
            const studentRecords = classRecords.filter(r => r.studentId === data.studentId);
            const uniqueDates = new Set(studentRecords.map(r => r.date));
            data.uniqueDays = uniqueDates.size;
        });

        return Array.from(studentDataMap.values()).sort((a,b) => a.studentName.localeCompare(b.studentName));
    }, [selectedClassId, allRecords]);

    const handlePrint = async () => {
        const className = classes.find(c => c.id === selectedClassId)?.name;
        if (!recapContentRef.current || !className) {
            console.error("Ref atau nama kelas hilang untuk dicetak.");
            return;
        }

        setIsExporting(true);
        try {
            const canvas = await window.html2canvas(recapContentRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert("Harap izinkan popup untuk situs ini untuk mencetak.");
                setIsExporting(false);
                return;
            }
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Cetak Laporan Kelas ${className}</title>
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
            console.error("Terjadi kesalahan saat mempersiapkan pencetakan:", error);
            alert("Terjadi kesalahan saat mempersiapkan pencetakan. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        const className = classes.find(c => c.id === selectedClassId)?.name;
        if (!recapContentRef.current || !className) {
            console.error("Ref or class name is missing.");
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
            
            const pdfWidth = 297; // A4 landscape width in mm
            const pdfHeight = 210; // A4 landscape height in mm
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;

            let finalImgWidth = pdfWidth - 20; // with 10mm margin on each side
            let finalImgHeight = finalImgWidth / ratio;
            
            if (finalImgHeight > pdfHeight - 20) {
                finalImgHeight = pdfHeight - 20;
                finalImgWidth = finalImgHeight * ratio;
            }
            
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const x = (pdfWidth - finalImgWidth) / 2;
            const y = (pdfHeight - finalImgHeight) / 2;
            
            doc.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);

            const today = new Date().toISOString().split('T')[0];
            const fileName = `تقرير-فصل-${className.replace(/\s/g, '_')}-${today}.pdf`;
            
            doc.save(fileName);
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            alert("حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleGenerateAnalysis = async () => {
        if (!selectedClassId || classRecapData.length === 0) {
            setAnalysisError('يرجى اختيار فصل دراسي يحتوي على بيانات للتحليل.');
            return;
        }
        setIsGeneratingAnalysis(true);
        setAiAnalysis('');
        setAnalysisError('');
    
        try {
            const className = classes.find(c => c.id === selectedClassId)?.name || 'فصل غير معروف';
            
            const studentsSummary = classRecapData.map(student => 
                `- ${student.studentName}: غياب ${student.absentCount}, إذن ${student.permissionCount}, مرض ${student.sickCount}`
            ).join('\n');
            
            const prompt = `أنت مساعد إداري في مؤسسة تعليمية. قم بتحليل بيانات الحضور والغياب التالية لفصل "${className}":
${studentsSummary}

بناءً على هذه البيانات، قم بما يلي باللغة العربية:
1.  قدم ملخصًا عامًا لأداء الفصل من حيث الحضور.
2.  حدد الطلاب الذين لديهم أعلى عدد من الغيابات (أذكر أفضل 3 إن وجدوا).
3.  هل هناك أي أنماط أو ملاحظات مهمة أخرى؟ (على سبيل المثال، عدد كبير من الأذونات المرضية قد يشير إلى مشكلة صحية).
4.  قدم توصية موجزة للإدارة.

اجعل التحليل موجزًا وفي شكل نقاط.`;
    
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            
            const md = window.markdownit();
            setAiAnalysis(md.render(response.text));
    
        } catch (error) {
            console.error("Error generating AI analysis:", error);
            setAnalysisError('فشل إنشاء التحليل. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsGeneratingAnalysis(false);
        }
    };
    
    if (loading && !selectedClassId) {
       return (
         <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ملخص الفصل</h2>
             <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <div className="text-center p-8">...جاري تحميل البيانات</div>
             </div>
        </div>
       )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 no-print">ملخص الفصل</h2>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4 no-print">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                     <div>
                        <label htmlFor="class-select-recap" className="block text-lg font-semibold text-slate-700 mb-2">اختر الفصل الدراسي</label>
                        <select
                            id="class-select-recap"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-full md:w-80 p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">-- اختر لعرض البيانات --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {selectedClassId && (
                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={handleGenerateAnalysis}
                              disabled={isGeneratingAnalysis || isExporting}
                              className="flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                <span>{isGeneratingAnalysis ? '...جاري التحليل' : 'تحليل ذكي للفصل'}</span>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={isGeneratingAnalysis || isExporting}
                                className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span>{isExporting ? '...جاري التصدير' : 'تصدير إلى PDF'}</span>
                            </button>
                             <button
                                onClick={handlePrint}
                                disabled={isExporting || isGeneratingAnalysis}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                <span>{isExporting ? '...جاري الطباعة' : 'طباعة'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {(isGeneratingAnalysis || aiAnalysis || analysisError) && (
                <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded-r-lg my-4 no-print">
                    <h4 className="flex items-center gap-2 text-lg font-bold text-teal-800 mb-2">
                        <SparklesIcon className="w-6 h-6" />
                        تحليل ذكي للفصل
                    </h4>
                    {isGeneratingAnalysis && <p className="text-teal-700">جاري تحليل بيانات الفصل، يرجى الانتظار...</p>}
                    {analysisError && <p className="text-red-600">{analysisError}</p>}
                    {aiAnalysis && <div className="prose prose-sm text-teal-800" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />}
                </div>
            )}

            {selectedClassId && (
                <div ref={recapContentRef} className="printable-area bg-white p-2 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">
                        ملخص {classes.find(c => c.id === selectedClassId)?.name}
                    </h3>
                    {loading ? <div className="text-center p-8">...جاري تحديث البيانات</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600 responsive-table">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم الطالب</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">غائب</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">إذن</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">مرض</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">المجموع</th>
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">مجموع الأيام</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classRecapData.map(data => (
                                    <tr key={data.studentId} className="bg-white border-b hover:bg-slate-50">
                                        <td data-label="اسم الطالب" className="px-2 py-3 sm:px-6 sm:py-4 font-semibold whitespace-nowrap">
                                          <button onClick={() => onStudentSelect(data.studentId)} className="text-right w-full hover:text-teal-600 hover:underline cursor-pointer no-print-link">
                                              {data.studentName}
                                          </button>
                                          <span className="print-only-text">{data.studentName}</span>
                                        </td>
                                        <td data-label="غائب" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{data.absentCount}</td>
                                        <td data-label="إذن" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{data.permissionCount}</td>
                                        <td data-label="مرض" className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{data.sickCount}</td>
                                        <td data-label="المجموع" className="px-2 py-3 sm:px-6 sm:py-4 font-bold whitespace-nowrap">{data.total}</td>
                                        <td data-label="مجموع الأيام" className="px-2 py-3 sm:px-6 sm:py-4 font-bold text-teal-600 whitespace-nowrap">{data.uniqueDays}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {classRecapData.length === 0 && (
                            <p className="text-center text-slate-500 py-8">لا توجد سجلات غياب لهذا الفصل.</p>
                        )}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
};