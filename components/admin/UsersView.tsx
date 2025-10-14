import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, AppRole } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../supabaseClient';
import { Pagination } from '../shared/Pagination';


const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

export const UsersView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // State for pagination and search
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const roleRef = useRef<HTMLSelectElement>(null);

    const paginatedUsers = useMemo(() => {
        const filtered = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [users, searchQuery, currentPage, itemsPerPage]);

    async function fetchUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('username');
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
        setIsSubmitting(true);
        setMessage(null);

        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;
        const role = roleRef.current?.value as AppRole;

        if (!email || !password || !role) {
            setMessage({ type: 'error', text: "يرجى ملء جميع الحقول." });
            setIsSubmitting(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role },
            },
        });

        if (error) {
            let userMessage = error.message;
            if (userMessage.includes("User already registered")) {
                userMessage = "هذا البريد الإلكتروني مسجل بالفعل.";
            } else if (userMessage.includes("Password should be at least 6 characters")) {
                userMessage = "يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل.";
            }
            setMessage({ type: 'error', text: `فشل في إنشاء المستخدم: ${userMessage}` });
            setIsSubmitting(false);
            return;
        }
        
        setMessage({ type: 'success', text: "تمت إضافة المستخدم بنجاح! سيظهر في القائمة بعد لحظات." });
        
        setTimeout(() => fetchUsers(), 1000);

        if (emailRef.current) emailRef.current.value = '';
        if (passwordRef.current) passwordRef.current.value = '';

        setIsSubmitting(false);
        setTimeout(() => setMessage(null), 8000);
    };

    if (loading && users.length === 0) {
        return <div className="text-center p-8">...جاري تحميل المستخدمين</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">إدارة المستخدمين</h2>
            
            {message && (
                <div className={`p-4 mb-6 rounded-md text-center whitespace-pre-line ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

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
                    <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:opacity-50">
                        {isSubmitting ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة مستخدم</>}
                    </button>
                </form>
            </Card>

            <Card title={`قائمة المستخدمين (${users.length})`}>
                 <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="بحث باسم المستخدم..."
                    className="w-full md:w-1/3 p-2 border rounded-md mb-4"
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">اسم المستخدم (البريد الإلكتروني)</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">الدور</th>
                                <th className="px-2 py-3 sm:px-6 whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                             {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-slate-500">
                                        لا يوجد مستخدمون.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap font-semibold">{user.username}</td>
                                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{user.role}</td>
                                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
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
                 <Pagination
                    currentPage={currentPage}
                    totalItems={users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                />
            </Card>
        </div>
    );
};