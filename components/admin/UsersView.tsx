import React, { useState, useEffect, useRef } from 'react';
import { User, AppRole } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../supabaseClient';


const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

const DataTable: React.FC<{ headers: string[]; data: any[][]; }> = ({ headers, data }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-right text-slate-600 responsive-table">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                    {headers.map(h => <th key={h} className="px-6 py-3">{h}</th>)}
                    <th className="px-6 py-3">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                 {data.length === 0 ? (
                    <tr>
                        <td colSpan={headers.length + 1} className="text-center py-8 text-slate-500">
                            لا يوجد مستخدمون.
                        </td>
                    </tr>
                ) : (
                    data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-white border-b hover:bg-slate-50">
                            {row.map((cell, cellIndex) => <td key={cellIndex} data-label={headers[cellIndex]} className="px-6 py-4">{cell}</td>)}
                            <td className="px-6 py-4 action-cell">
                                <div className="flex gap-3 justify-end">
                                    <button className="text-blue-400 cursor-not-allowed" title="ميزة التعديل قيد التطوير">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button className="text-red-400 cursor-not-allowed" title="الحذف يتطلب أذونات المسؤول من جانب الخادم">
                                        <DeleteIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export const UsersView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const roleRef = useRef<HTMLSelectElement>(null);

    async function fetchUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            setMessage({ type: 'error', text: `فشل في جلب المستخدمين: ${error.message}` });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;
        const role = roleRef.current?.value as AppRole;

        if (!email || !password || !role) {
            setMessage({ type: 'error', text: "يرجى ملء جميع الحقول." });
            setLoading(false);
            return;
        }

        // Dengan trigger SQL, kita tidak perlu lagi menyisipkan profil secara manual.
        // Cukup kirim 'role' sebagai metadata, dan trigger akan menanganinya.
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: role, // Metadata ini akan dibaca oleh trigger di database
                },
            },
        });

        if (error) {
            let userMessage = error.message;
            if (userMessage.includes("User already registered")) {
                userMessage = "هذا البريد الإلكتروني مسجل بالفعل.";
            } else if (userMessage.includes("Password should be at least 6 characters")) {
                userMessage = "يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل.";
            } else if (userMessage.includes("violates row-level security policy for table \"profiles\"")) {
                // Pesan ini sekarang lebih relevan karena trigger berjalan di server
                userMessage = "فشل في إنشاء الملف الشخصي: تحقق من أذونات trigger SQL أو سياسات RLS.";
            }
            setMessage({ type: 'error', text: `فشل في إنشاء المستخدم: ${userMessage}` });
            setLoading(false);
            return;
        }
        
        // Success
        setMessage({ type: 'success', text: "تمت إضافة المستخدم بنجاح! سيظهر في القائمة بعد لحظات." });
        
        // Beri sedikit waktu agar trigger berjalan sebelum memuat ulang data
        setTimeout(() => {
            fetchUsers();
        }, 1000);

        if (emailRef.current) emailRef.current.value = '';
        if (passwordRef.current) passwordRef.current.value = '';

        setLoading(false);
        setTimeout(() => setMessage(null), 8000);
    };


    if (loading && users.length === 0) {
        return <div className="text-center p-8">...جاري تحميل المستخدمين</div>;
    }


    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">إدارة المستخدمين</h2>
            
            {message && (
                <div className={`p-4 mb-6 rounded-md text-center whitespace-pre-line ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card title="إضافة مستخدم جديد">
                        <form className="space-y-4" onSubmit={handleAddUser}>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1">البريد الإلكتروني</label>
                                <input ref={emailRef} type="email" id="username" className="w-full p-2 border rounded-md" required/>
                            </div>
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">كلمة المرور</label>
                                <input ref={passwordRef} type="password" id="password" className="w-full p-2 border rounded-md" required/>
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">الدور</label>
                                <select ref={roleRef} id="role" className="w-full p-2 border rounded-md bg-white" defaultValue={AppRole.ACADEMIC_ADMIN}>
                                    <option value={AppRole.ACADEMIC_ADMIN}>مسؤول أكاديمي</option>
                                    <option value={AppRole.DORMITORY_ADMIN}>مسؤول سكني</option>
                                    <option value={AppRole.SUPER_ADMIN}>مسؤول عام (Super Admin)</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:opacity-50">
                                {loading ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة مستخدم</>}
                            </button>
                        </form>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title="قائمة المستخدمين">
                        <DataTable 
                            headers={['#', 'اسم المستخدم (البريد الإلكتروني)', 'الدور']} 
                            data={users.map((u, i) => [i + 1, u.username, u.role])} 
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};