import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNotification } from '../../contexts/NotificationContext';

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

const DEFAULT_YEAR_KEY = 'default_academic_year';
const DEFAULT_SEMESTER_KEY = 'default_semester';


// Helper to generate academic years
const generateAcademicYears = () => {
    const startYear = 2025;
    const years = [];
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        years.push(`${year}-${year + 1}`);
    }
    return years;
};

export const SettingsView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [defaultYear, setDefaultYear] = useState('');
    const [defaultSemester, setDefaultSemester] = useState(1);
    const [isSavingDefaults, setIsSavingDefaults] = useState(false);

    const academicYears = generateAcademicYears();
    
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                 // Fetch default period settings
                const { data: settingsData, error: settingsError } = await supabase.from('app_settings').select('key, value');
                if (settingsError) throw settingsError;

                const yearSetting = settingsData.find(s => s.key === DEFAULT_YEAR_KEY);
                const semesterSetting = settingsData.find(s => s.key === DEFAULT_SEMESTER_KEY);
                
                if (yearSetting) setDefaultYear(yearSetting.value);
                if (semesterSetting) setDefaultSemester(parseInt(semesterSetting.value, 10));

            } catch (error: any) {
                showNotification(`فشل في جلب الإعدادات: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSaveDefaults = async () => {
        setIsSavingDefaults(true);
        try {
            const { error } = await supabase.from('app_settings').upsert([
                { key: DEFAULT_YEAR_KEY, value: defaultYear },
                { key: DEFAULT_SEMESTER_KEY, value: defaultSemester.toString() }
            ]);

            if (error) throw error;
            showNotification('تم حفظ الإعدادات الافتراضية بنجاح.', 'success');
        } catch (error: any) {
            showNotification(`فشل في حفظ الإعدادات: ${error.message}`, 'error');
        } finally {
            setIsSavingDefaults(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">الإعدادات</h2>
            
             <Card title="إعدادات العام الدراسي الافتراضي">
                 {loading ? <div className="text-center">...جاري تحميل الإعدادات</div> : (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">اختر العام الدراسي والفصل الدراسي الذي سيظهر بشكل افتراضي في صفحة تسجيل الدخول لجميع المستخدمين.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">العام الدراسي</label>
                                <select value={defaultYear} onChange={(e) => setDefaultYear(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">الفصل الدراسي</label>
                                <select value={defaultSemester} onChange={(e) => setDefaultSemester(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white">
                                    <option value={1}>الفصل الدراسي 1</option>
                                    <option value={2}>الفصل الدراسي 2</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleSaveDefaults} disabled={isSavingDefaults} className="w-full sm:w-auto mt-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:opacity-50">
                            {isSavingDefaults ? '...جاري الحفظ' : 'حفظ الإعدادات'}
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};