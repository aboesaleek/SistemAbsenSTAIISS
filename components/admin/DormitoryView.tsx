import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dormitory, Student } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../supabaseClient';
import { Pagination } from '../shared/Pagination';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

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

export const DormitoryView: React.FC = () => {
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingDorm, setIsAddingDorm] = useState(false);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [activeTab, setActiveTab] = useState<'dormitories' | 'students'>('dormitories');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string | number, tableName: string } | null>(null);
    const { showNotification } = useNotification();
    
    // State for pagination and search
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const newDormsRef = useRef<HTMLTextAreaElement>(null);
    const newStudentsRef = useRef<HTMLTextAreaElement>(null);
    const newStudentDormRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        setSearchQuery('');
        setCurrentPage(1);
    }, [activeTab]);

    const { filteredItems, paginatedItems } = useMemo(() => {
        let items: (Dormitory | Student)[] = [];
        if (activeTab === 'dormitories') items = dormitories;
        else if (activeTab === 'students') items = students;

        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const paginated = filtered.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
        
        return { filteredItems: filtered, paginatedItems: paginated };
    }, [activeTab, dormitories, students, searchQuery, currentPage, itemsPerPage]);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*').order('name');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);

            // Fetch only students who have a dormitoryId
            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('dormitory_id', 'is', null).order('name');
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
        } catch (error: any) {
            console.error('Error fetching dormitory data:', error);
            showNotification('فشل في جلب بيانات المهجع.', 'error');
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
    
     const renderTable = () => {
        let headers: string[] = [];
        let data: (string | number)[][] = [];

        if (activeTab === 'dormitories') {
            headers = ['اسم المهجع'];
            data = paginatedItems.map(d => [d.name]);
        } else if (activeTab === 'students') {
            headers = ['اسم الطالب', 'المهجع'];
            data = (paginatedItems as Student[]).map(s => [s.name, dormitories.find(d => d.id === s.dormitory_id)?.name || 'N/A']);
        }
        
        return (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            {headers.map(h => <th key={h} className="px-2 py-3 sm:px-6 whitespace-nowrap">{h}</th>)}
                            <th className="px-2 py-3 sm:px-6 whitespace-nowrap">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length + 1} className="text-center py-8 text-slate-500">
                                    لا توجد بيانات متاحة.
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr key={paginatedItems[rowIndex].id} className="bg-white border-b hover:bg-slate-50">
                                    {row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{cell}</td>)}
                                    <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                                        <div className="flex gap-3 justify-end">
                                            <button disabled className="text-blue-400 cursor-not-allowed" title="ميزة التعديل قيد التطوير">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => requestDelete(paginatedItems[rowIndex].id, activeTab)} className="text-red-600 hover:text-red-800">
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
    }

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
                message="هل أنت متأكد أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
            />
            <h2 className="text-3xl font-bold text-slate-800">إدارة شؤون المهجع</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="إضافة مهاجع">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم مهجع في سطر جديد.</p>
                    <textarea ref={newDormsRef} placeholder="مبنى أ&#x0a;مبنى ب&#x0a;..." className="w-full h-24 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                    <button onClick={() => handleGenericAdd(newDormsRef, 'dormitories', setIsAddingDorm, 'مهاجع')} disabled={isAddingDorm} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingDorm ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
                 <Card title="إضافة طلاب للمهجع">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم طالب في سطر جديد.</p>
                    <select ref={newStudentDormRef} className="w-full p-2 mb-2 border rounded-md">
                        <option value="">اختر المهجع</option>
                        {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <textarea ref={newStudentsRef} placeholder="اسم الطالب 1&#x0a;اسم الطالب 2&#x0a;..." className="w-full h-24 p-2 border rounded-md" />
                    <button onClick={() => {
                        const dormitoryId = newStudentDormRef.current?.value;
                        if (!dormitoryId) {
                            showNotification('يرجى اختيار المهجع أولاً.', 'error');
                            return;
                        }
                        // This assumes you add new students here.
                        // A more complex setup might involve assigning existing students.
                        handleGenericAdd(newStudentsRef, 'students', setIsAddingStudent, 'طلاب', { dormitory_id: dormitoryId });
                    }} disabled={isAddingStudent} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingStudent ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-slate-200">
                <div className="px-6 pt-4 border-b border-slate-200">
                    <nav className="-mb-px flex gap-6" aria-label="Tabs">
                        <TabButton isActive={activeTab === 'dormitories'} onClick={() => setActiveTab('dormitories')}>
                            المهاجع الحالية ({dormitories.length})
                        </TabButton>
                        <TabButton isActive={activeTab === 'students'} onClick={() => setActiveTab('students')}>
                            الطلاب في المهاجع ({students.length})
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
                    {renderTable()}
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
