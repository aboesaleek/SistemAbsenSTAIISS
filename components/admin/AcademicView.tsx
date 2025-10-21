import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Class, Student, Course } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../supabaseClient';
import { Pagination } from '../shared/Pagination';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { CheckIcon } from '../icons/CheckIcon';
import { CancelIcon } from '../icons/CancelIcon';

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors duration-200 focus:outline-none ${
            isActive
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
    >
        {children}
    </button>
);

export const AcademicView: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingClass, setIsAddingClass] = useState(false);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'courses'>('classes');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string | number, tableName: string } | null>(null);
    const { showNotification } = useNotification();

    const [editingItem, setEditingItem] = useState<{ id: string; name: string; class_id?: string } | null>(null);

    // State for pagination and search
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const newClassesRef = useRef<HTMLTextAreaElement>(null);
    const newStudentsRef = useRef<HTMLTextAreaElement>(null);
    const newStudentClassRef = useRef<HTMLSelectElement>(null);
    const newCoursesRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        setSearchQuery('');
        setCurrentPage(1);
        setEditingItem(null); // Cancel edit on tab change
    }, [activeTab]);

    const { filteredItems, paginatedItems } = useMemo(() => {
        let items: (Class | Student | Course)[] = [];
        if (activeTab === 'classes') items = classes;
        else if (activeTab === 'students') items = students;
        else if (activeTab === 'courses') items = courses;
        
        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const paginated = filtered.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
        
        return { filteredItems: filtered, paginatedItems: paginated };
    }, [activeTab, classes, students, courses, searchQuery, currentPage, itemsPerPage]);


    async function fetchData() {
        setLoading(true);
        try {
            const { data: classesData, error: classesError } = await supabase.from('classes').select('*').order('name');
            if (classesError) throw classesError;
            setClasses(classesData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').order('name');
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
            
            const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*').order('name');
            if (coursesError) throw coursesError;
            setCourses(coursesData || []);
        } catch (error: any) {
            console.error('Error fetching academic data:', error);
            showNotification('فشل في جلب البيانات الأكاديمية.', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenericAdd = async (
        ref: React.RefObject<HTMLTextAreaElement>,
        tableName: string,
        setLoadingState: (loading: boolean) => void,
        itemType: string,
        additionalData?: Record<string, any>
    ) => {
        const content = ref.current?.value;
        if (!content?.trim()) {
            showNotification(`يرجى إدخال ${itemType} لإضافتها.`, 'error');
            return;
        }

        setLoadingState(true);

        const items = content.split('\n').map(name => ({ name: name.trim(), ...additionalData })).filter(item => item.name);
        
        if (items.length === 0) {
            showNotification(`يرجى إدخال ${itemType} صالحة لإضافتها.`, 'error');
            setLoadingState(false);
            return;
        }

        const { error } = await supabase.from(tableName).insert(items);
        
        if (error) {
            showNotification(`فشل في الإضافة: ${error.message}`, 'error');
        } else {
            showNotification(`تمت إضافة ${items.length} ${itemType} بنجاح.`, 'success');
            ref.current!.value = '';
            fetchData(); // Refresh data
        }

        setLoadingState(false);
    };

    const requestDelete = (id: string | number, tableName: string) => {
        setConfirmDelete({ id, tableName });
    };

    const executeDelete = async () => {
        if (!confirmDelete) return;
        
        const { id, tableName } = confirmDelete;
        const { error } = await supabase.from(tableName).delete().eq('id', id);

        if (error) {
            showNotification(`فشل في الحذف: ${error.message}`, 'error');
        } else {
            showNotification('تم حذف العنصر بنجاح.', 'success');
            fetchData(); // Refresh data
        }
    };

    const handleEdit = (item: Class | Student | Course) => {
        if ('class_id' in item) {
            setEditingItem({ id: item.id, name: item.name, class_id: item.class_id });
        } else {
            setEditingItem({ id: item.id, name: item.name });
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    const handleUpdate = async () => {
        if (!editingItem) return;

        const { id, name, class_id } = editingItem;
        if (!name.trim()) {
            showNotification('لا يمكن أن يكون الاسم فارغًا.', 'error');
            return;
        }

        let dataToUpdate: { name: string; class_id?: string } = { name: name.trim() };
        if (class_id !== undefined) {
            dataToUpdate.class_id = class_id;
        }
        
        const { error } = await supabase
            .from(activeTab)
            .update(dataToUpdate)
            .eq('id', id);

        if (error) {
            showNotification(`فشل في التحديث: ${error.message}`, 'error');
        } else {
            showNotification('تم تحديث العنصر بنجاح.', 'success');
            setEditingItem(null);
            fetchData();
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    const headers = {
        classes: ['اسم الفصل'],
        students: ['اسم الطالب', 'الفصل الدراسي'],
        courses: ['اسم المادة'],
    };

    return (
        <div className="space-y-6">
            <ConfirmationDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={executeDelete}
                title="تأكيد الحذف"
                message="هل أنت متأكد أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
            />
            <h2 className="text-3xl font-bold text-slate-800">إدارة الشؤون الأكاديمية</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="إضافة فصول دراسية">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم فصل في سطر جديد.</p>
                    <textarea ref={newClassesRef} placeholder="الفصل أ&#x0a;الفصل ب&#x0a;..." className="w-full h-24 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                    <button onClick={() => handleGenericAdd(newClassesRef, 'classes', setIsAddingClass, 'فصول')} disabled={isAddingClass} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingClass ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
                 <Card title="إضافة طلاب">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم طالب في سطر جديد.</p>
                    <select ref={newStudentClassRef} className="w-full p-2 mb-2 border rounded-md">
                        <option value="">اختر الفصل الدراسي</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <textarea ref={newStudentsRef} placeholder="اسم الطالب 1&#x0a;اسم الطالب 2&#x0a;..." className="w-full h-24 p-2 border rounded-md" />
                    <button onClick={() => {
                        const classId = newStudentClassRef.current?.value;
                        if (!classId) {
                            showNotification('يرجى اختيار الفصل الدراسي أولاً.', 'error');
                            return;
                        }
                        handleGenericAdd(newStudentsRef, 'students', setIsAddingStudent, 'طلاب', { class_id: classId });
                    }} disabled={isAddingStudent} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingStudent ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
                <Card title="إضافة مواد دراسية">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم مادة في سطر جديد.</p>
                    <textarea ref={newCoursesRef} placeholder="المادة 1&#x0a;المادة 2&#x0a;..." className="w-full h-24 p-2 border rounded-md" />
                    <button onClick={() => handleGenericAdd(newCoursesRef, 'courses', setIsAddingCourse, 'مواد دراسية')} disabled={isAddingCourse} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingCourse ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-slate-200">
                <div className="px-6 pt-4 border-b border-slate-200">
                    <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
                        <TabButton isActive={activeTab === 'classes'} onClick={() => setActiveTab('classes')}>
                            الفصول الدراسية ({classes.length})
                        </TabButton>
                        <TabButton isActive={activeTab === 'students'} onClick={() => setActiveTab('students')}>
                            الطلاب المسجلون ({students.length})
                        </TabButton>
                        <TabButton isActive={activeTab === 'courses'} onClick={() => setActiveTab('courses')}>
                            المواد الدراسية ({courses.length})
                        </TabButton>
                    </nav>
                </div>
                <div className="p-2 sm:p-6">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={`بحث في ${activeTab}...`}
                        className="w-full md:w-1/3 p-2 border rounded-md mb-4"
                    />
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    {headers[activeTab].map(h => <th key={h} className="px-2 py-3 sm:px-6 whitespace-nowrap">{h}</th>)}
                                    <th className="px-2 py-3 sm:px-6 whitespace-nowrap">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={headers[activeTab].length + 1} className="text-center py-8 text-slate-500">
                                            لا توجد بيانات متاحة.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map(item => {
                                        const isEditing = editingItem?.id === item.id;
                                        return (
                                            <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                            className="w-full p-1 border rounded"
                                                        />
                                                    ) : (
                                                        item.name
                                                    )}
                                                </td>
                                                {activeTab === 'students' && (
                                                    <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                                        {isEditing ? (
                                                            <select
                                                                value={editingItem.class_id}
                                                                onChange={(e) => setEditingItem({ ...editingItem, class_id: e.target.value })}
                                                                className="w-full p-1 border rounded bg-white"
                                                            >
                                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        ) : (
                                                            classes.find(c => c.id === (item as Student).class_id)?.name || 'N/A'
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                                    <div className="flex gap-3 justify-end">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={handleUpdate} className="text-green-600 hover:text-green-800" title="حفظ"><CheckIcon className="w-5 h-5" /></button>
                                                                <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800" title="إلغاء"><CancelIcon className="w-5 h-5" /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800" title="تعديل"><EditIcon className="w-5 h-5" /></button>
                                                                <button onClick={() => requestDelete(item.id, activeTab)} className="text-red-600 hover:text-red-800" title="حذف"><DeleteIcon className="w-5 h-5" /></button>
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
                        totalItems={filteredItems.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    />
                </div>
            </div>
        </div>
    );
};
