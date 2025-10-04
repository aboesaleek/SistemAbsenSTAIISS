import React, { useState, useEffect, useRef } from 'react';
import { Dormitory, Student } from '../../types';
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

const DataTable: React.FC<{
  headers: string[];
  data: (string | number)[][];
  onDelete?: (id: string | number) => Promise<void>;
  items: (Dormitory | Student)[];
}> = ({ headers, data, onDelete, items }) => (
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
                            لا توجد بيانات متاحة.
                        </td>
                    </tr>
                ) : (
                    data.map((row, rowIndex) => (
                        <tr key={items[rowIndex].id} className="bg-white border-b hover:bg-slate-50">
                            {row.map((cell, cellIndex) => <td key={cellIndex} className="px-6 py-4">{cell}</td>)}
                            <td className="px-6 py-4 flex gap-3">
                                <button className="text-blue-600 hover:text-blue-800" onClick={() => alert('ميزة التعديل قيد التطوير.')}>
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                {onDelete && (
                                    <button onClick={() => onDelete(items[rowIndex].id)} className="text-red-600 hover:text-red-800">
                                        <DeleteIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);


export const DormitoryView: React.FC = () => {
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    
    const newDormsRef = useRef<HTMLTextAreaElement>(null);
    const newStudentsRef = useRef<HTMLTextAreaElement>(null);
    const newStudentDormRef = useRef<HTMLSelectElement>(null);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: dormsData, error: dormsError } = await supabase.from('dormitories').select('*');
            if (dormsError) throw dormsError;
            setDormitories(dormsData || []);

            // Fetch only students who have a dormitoryId
            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').not('dormitoryId', 'is', null);
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
        } catch (error: any) {
            console.error('Error fetching dormitory data:', error);
            let errorMessage = 'An unknown error occurred.';

            if (error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            if (errorMessage.toLowerCase().includes('security policy') || errorMessage.toLowerCase().includes('rls')) {
                errorMessage += '\n\n(هذا يعني على الأرجح أن سياسة أمان قاعدة البيانات تمنع الوصول. تحقق من أدوار المستخدم وسياسات RLS.)';
            }

            alert(`فشل في جلب بيانات المهجع: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (ref: React.RefObject<HTMLTextAreaElement>, tableName: string, additionalData?: Record<string, any>) => {
        const content = ref.current?.value;
        if (!content) return;

        const items = content.split('\n').map(name => ({ name: name.trim(), ...additionalData })).filter(item => item.name);
        
        const { error } = await supabase.from(tableName).insert(items);
        
        if (error) {
            alert(`فشل في الإضافة: ${error.message}`);
        } else {
            alert(`تمت إضافة ${items.length} عنصر بنجاح.`);
            ref.current!.value = '';
            fetchData(); // Refresh data
        }
    };
    
    const handleDelete = async (id: string | number, tableName: string) => {
        if (!confirm('هل أنت متأكد أنك تريد الحذف؟')) return;

        const { error } = await supabase.from(tableName).delete().eq('id', id);

        if (error) {
            alert(`فشل في الحذف: ${error.message}`);
        } else {
            alert('تم الحذف بنجاح.');
            fetchData(); // Refresh data
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">إدارة شؤون المهجع</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="إضافة مهاجع">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم مهجع في سطر جديد.</p>
                    <textarea ref={newDormsRef} placeholder="مبنى أ&#x0a;مبنى ب&#x0a;..." className="w-full h-24 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                    <button onClick={() => handleAdd(newDormsRef, 'dormitories')} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"><PlusIcon className="w-5 h-5" /> إضافة</button>
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
                            alert('يرجى اختيار المهجع أولاً.');
                            return;
                        }
                        // This assumes you add new students here.
                        // A more complex setup might involve assigning existing students.
                        handleAdd(newStudentsRef, 'students', { dormitoryId: dormitoryId });
                    }} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"><PlusIcon className="w-5 h-5" /> إضافة</button>
                </Card>
            </div>
            
            <Card title="المهاجع الحالية">
                <DataTable 
                    headers={['#', 'اسم المهجع']} 
                    data={dormitories.map((d, i) => [i + 1, d.name])}
                    onDelete={(id) => handleDelete(id, 'dormitories')}
                    items={dormitories}
                />
            </Card>
            <Card title="الطلاب في المهاجع">
                <DataTable 
                    headers={['#', 'اسم الطالب', 'المهجع']} 
                    data={students.map((s, i) => [i + 1, s.name, dormitories.find(d => d.id === s.dormitoryId)?.name || 'N/A'])}
                    onDelete={(id) => handleDelete(id, 'students')}
                    items={students}
                />
            </Card>
        </div>
    );
};