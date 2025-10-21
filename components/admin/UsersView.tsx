import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, AppRole } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../supabaseClient';
import { Pagination } from '../shared/Pagination';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { CheckIcon } from '../icons/CheckIcon';
import { CancelIcon } from '../icons/CancelIcon';
import { User as SupabaseUser } from '@supabase/supabase-js';


const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

const roleLabels: { [key in AppRole]: string } = {
  [AppRole.SUPER_ADMIN]: 'مسؤول عام (Super Admin)',
  [AppRole.ACADEMIC_ADMIN]: 'مسؤول أكاديمي',
  [AppRole.DORMITORY_ADMIN]: 'مسؤول سكني',
};

export const UsersView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();
    const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const { data, error } = await supabase.from('profiles').select('*').order('username');
            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            showNotification(`فشل في جلب المستخدمين: ${error.message}`, 'error');
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

        const email = emailRef.current?.value;
        const password = passwordRef.current?.value;
        const role = roleRef.current?.value as AppRole;

        if (!email || !password || !role) {
            showNotification("يرجى ملء جميع الحقول.", 'error');
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
            showNotification(`فشل في إنشاء المستخدم: ${userMessage}`, 'error');
            setIsSubmitting(false);
            return;
        }
        
        showNotification("تمت إضافة المستخدم بنجاح!", 'success');
        
        // Use a short delay to allow the new user to be available in the profiles table.
        setTimeout(() => fetchUsers(), 1000);

        if (emailRef.current) emailRef.current.value = '';
        if (passwordRef.current) passwordRef.current.value = '';

        setIsSubmitting(false);
    };

    const handleEditUser = (user: User) => {
        setEditingUser({ ...user });
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        
        const { error } = await supabase
            .from('profiles')
            .update({ role: editingUser.role })
            .eq('id', editingUser.id);
            
        if (error) {
            showNotification(`فشل تحديث المستخدم: ${error.message}`, 'error');
        } else {
            showNotification('تم تحديث دور المستخدم بنجاح.', 'success');
            setEditingUser(null);
            fetchUsers();
        }
    };
    
    const requestDeleteUser = (user: User) => {
        setConfirmDelete(user);
    };

    const executeDeleteUser = async () => {
        if (!confirmDelete) return;

        if (currentUser && currentUser.id === confirmDelete.id) {
            showNotification("لا يمكنك حذف حسابك الخاص.", 'error');
            setConfirmDelete(null);
            return;
        }
        
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', confirmDelete.id);

        if (error) {
            showNotification(`فشل حذف ملف المستخدم: ${error.message}`, 'error');
        } else {
            showNotification('تم حذف ملف المستخدم بنجاح. لن يتمكن المستخدم من تسجيل الدخول.', 'success');
            fetchUsers();
        }
        setConfirmDelete(null);
    };


    if (loading && users.length === 0) {
        return <div className="text-center p-8">...جاري تحميل المستخدمين</div>;
    }

    return (
        <div className="space-y-6">
             <ConfirmationDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={executeDeleteUser}
                title="تأكيد حذف المستخدم"
                message={`هل أنت متأكد أنك تريد حذف المستخدم ${confirmDelete?.username}؟ سيتم حذف ملفه الشخصي ولن يتمكن من تسجيل الدخول. لا يمكن التراجع عن هذا الإجراء.`}
            />
            <h2 className="text-3xl font-bold text-slate-800">إدارة المستخدمين</h2>

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
                            <option value={AppRole.ACADEMIC_ADMIN}>{roleLabels[AppRole.ACADEMIC_ADMIN]}</option>
                            <option value={AppRole.DORMITORY_ADMIN}>{roleLabels[AppRole.DORMITORY_ADMIN]}</option>
                            <option value={AppRole.SUPER_ADMIN}>{roleLabels[AppRole.SUPER_ADMIN]}</option>
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
                                paginatedUsers.map((user) => {
                                    const isEditing = editingUser?.id === user.id;
                                    const isCurrentUser = currentUser?.id === user.id;

                                    return (
                                        <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap font-semibold">{user.username}</td>
                                            <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                                {isEditing ? (
                                                     <select
                                                        value={editingUser!.role}
                                                        onChange={(e) => setEditingUser({ ...editingUser!, role: e.target.value as AppRole })}
                                                        className="w-full p-1 border rounded bg-white"
                                                    >
                                                        <option value={AppRole.ACADEMIC_ADMIN}>{roleLabels[AppRole.ACADEMIC_ADMIN]}</option>
                                                        <option value={AppRole.DORMITORY_ADMIN}>{roleLabels[AppRole.DORMITORY_ADMIN]}</option>
                                                        <option value={AppRole.SUPER_ADMIN}>{roleLabels[AppRole.SUPER_ADMIN]}</option>
                                                    </select>
                                                ) : (
                                                    roleLabels[user.role] || user.role
                                                )}
                                            </td>
                                            <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                                <div className="flex gap-3 justify-end">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={handleUpdateUser} className="text-green-600 hover:text-green-800" title="حفظ"><CheckIcon className="w-5 h-5" /></button>
                                                            <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800" title="إلغاء"><CancelIcon className="w-5 h-5" /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                disabled={isCurrentUser}
                                                                className="text-blue-600 hover:text-blue-800 disabled:text-blue-300 disabled:cursor-not-allowed"
                                                                title={isCurrentUser ? "لا يمكنك تعديل حسابك الخاص" : "تعديل المستخدم"}
                                                            >
                                                                <EditIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => requestDeleteUser(user)}
                                                                disabled={isCurrentUser}
                                                                className="text-red-600 hover:text-red-800 disabled:text-red-300 disabled:cursor-not-allowed"
                                                                title={isCurrentUser ? "لا يمكنك حذف حسابك الخاص" : "حذف المستخدم"}
                                                            >
                                                                <DeleteIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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
