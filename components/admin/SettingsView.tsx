import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { PlusIcon } from '../icons/PlusIcon';
import { useNotification } from '../../contexts/NotificationContext';

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

const LOGIN_BACKGROUND_KEY = 'login_background_url';
const BUCKET_NAME = 'public_assets';
const FILE_NAME = 'login_background';

export const SettingsView: React.FC = () => {
    const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState('');
    const [newBackgroundFile, setNewBackgroundFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const { showNotification } = useNotification();

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        const fetchCurrentBackground = async () => {
            setLoading(true);
            const supabaseUrl = 'https://hzfzmoddonrwdlqxdwxs.supabase.co';
            const customBackgroundUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${FILE_NAME}`;
            
            try {
                const urlWithCacheBust = `${customBackgroundUrl}?t=${new Date().getTime()}`;
                const response = await fetch(urlWithCacheBust, { method: 'HEAD' });

                if (response.ok) {
                    setCurrentBackgroundUrl(urlWithCacheBust);
                    setPreviewUrl(urlWithCacheBust);
                } else {
                    setCurrentBackgroundUrl('');
                    setPreviewUrl('');
                }
            } catch (error: any) {
                showNotification(`فشل في جلب الخلفية الحالية: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentBackground();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setNewBackgroundFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!newBackgroundFile) {
            showNotification('يرجى تحديد ملف أولاً.', 'error');
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload new image, overwriting the old one.
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(FILE_NAME, newBackgroundFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // 2. Get the public URL.
            const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(FILE_NAME);

            if (!urlData || !urlData.publicUrl) {
                throw new Error("لم يتمكن من الحصول على عنوان URL العام للملف الذي تم تحميله.");
            }
            
            // 3. Update the URL in the app_settings table.
            const { error: dbError } = await supabase
                .from('app_settings')
                .upsert({ key: LOGIN_BACKGROUND_KEY, value: urlData.publicUrl }, { onConflict: 'key' });

            if (dbError) throw dbError;

            const newUrlWithCacheBust = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            setCurrentBackgroundUrl(newUrlWithCacheBust);
            setPreviewUrl(newUrlWithCacheBust);
            setNewBackgroundFile(null);
            showNotification('تم تحديث صورة الخلفية بنجاح.', 'success');

        } catch (error: any) {
            let errorMessage = `فشل في تحميل الصورة: ${error.message}`;
            if (error.message.includes('bucket not found')) {
                errorMessage = `فشل في تحميل الصورة: لم يتم العثور على حاوية التخزين '${BUCKET_NAME}'. يرجى التأكد من إنشائها في Supabase.`;
            } else if (error.message.includes('new row violates row-level security policy')) {
                errorMessage = `فشل في تحديث الإعدادات: ليس لديك إذن. تأكد من أن لدى المسؤولين الكبار أذونات الكتابة على جدول 'app_settings'.`;
            }
            showNotification(errorMessage, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">إعدادات المظهر</h2>
            
            <Card title="خلفية صفحة تسجيل الدخول">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        قم بتحميل صورة جديدة لاستخدامها كخلفية لصفحة تسجيل الدخول. يوصى باستخدام صورة داكنة وعالية الجودة.
                    </p>
                    
                    {loading ? <div className="text-center">...جاري تحميل الخلفية الحالية</div> : (
                         <div className="w-full h-48 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                            {previewUrl ? 
                                <img src={previewUrl} alt="معاينة الخلفية" className="w-full h-full object-cover" /> :
                                <span className="text-slate-500">لا توجد خلفية حالية</span>
                            }
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto flex-grow text-center bg-slate-100 text-slate-700 py-2 px-4 rounded-md hover:bg-slate-200 transition-colors"
                        >
                            اختر صورة...
                        </button>
                        <button 
                            onClick={handleUpload}
                            disabled={isUploading || !newBackgroundFile}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:opacity-50"
                        >
                            {isUploading ? '...جاري التحميل' : <><PlusIcon className="w-5 h-5" /> تحميل وتعيين</>}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
