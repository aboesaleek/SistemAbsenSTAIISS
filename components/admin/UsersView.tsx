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
        <table className="w-full text-sm text-right text-slate-600">
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
                            {row.map((cell, cellIndex) => <td key={cellIndex} className="px-6 py-4">{cell}</td>)}
                            <td className="px-6 py-4 flex gap-3">
                                <button className="text-blue-400 cursor-not-allowed" title="ميزة التعديل قيد التطوير">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button className="text-red-400 cursor-not-allowed" title="الحذف يتطلب أذونات المسؤول من جانب الخادم">
                                    <DeleteIcon className="w-5 h-5" />
                                </button>
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

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const roleRef = useRef<HTMLSelectElement>(null);

    async function fetchUsers() {
        setLoading(true);
        try {
            // Fetch users from the 'profiles' table
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            
            // The table has 'id' and 'role'. The screenshot shows a 'username' column with email.
            // Ensure your 'profiles' table has a 'username' column that stores the email.
            // If not, you'd need to fetch from auth.users which is not possible on client-side.
            // Assuming 'profiles' table has {id, role, username}
            setUsers(data || []);
        } catch (error: any) {
            console.error(`فشل في جلب المستخدمين: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;
        const role = roleRef.current?.value as AppRole;

        if (!email || !password || !role) {
            console.error("يرجى ملء جميع الحقول.");
            return;
        }

        try {
            setLoading(true);
            // Step 1: Create the user in Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;
            if (!signUpData.user) throw new Error("فشل في إنشاء مستخدم في نظام المصادقة.");

            // Step 2: Insert the user's profile and role into the 'profiles' table
            // This will only succeed if the current user is a super_admin due to RLS policies.
            const { error: profileError } = await supabase.from('profiles').insert({
                id: signUpData.user.id,
                role: role,
                username: email, // Assuming you have a username column for the email
            });

            if (profileError) {
                // Important: If profile creation fails, you might want to delete the auth user
                // to avoid orphaned users. This requires an admin client on the server.
                // For now, we'll just show the error.
                throw profileError;
            }
            
            fetchUsers(); // Refresh the list
            // Clear form
            emailRef.current!.value = '';
            passwordRef.current!.value = '';
            
        } catch (error: any) {
            console.error(`فشل في إضافة المستخدم: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return <div className="text-center p-8">...جاري تحميل المستخدمين</div>;
    }


    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">إدارة المستخدمين</h2>

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
                                <PlusIcon className="w-5 h-5" />
                                إضافة مستخدم
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