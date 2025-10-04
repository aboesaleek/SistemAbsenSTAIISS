import React, { useState, useEffect, useRef } from 'react';
import { Class, Student, Course } from '../../types';
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
  items: (Class | Student | Course)[];
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
                                <button disabled className="text-blue-400 cursor-not-allowed" title="ميزة التعديل قيد التطوير">
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


export const AcademicView: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const newClassesRef = useRef<HTMLTextAreaElement>(null);
    const newStudentsRef = useRef<HTMLTextAreaElement>(null);
    const newStudentClassRef = useRef<HTMLSelectElement>(null);
    const newCoursesRef = useRef<HTMLTextAreaElement>(null);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
            if (classesError) throw classesError;
            setClasses(classesData || []);

            const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
            
            const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
            if (coursesError) throw coursesError;
            setCourses(coursesData || []);
        } catch (error: any) {
            console.error('Error fetching academic data:', error);
            let errorMessage = 'An unknown error occurred.';

            if (error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            if (errorMessage.toLowerCase().includes('security policy') || errorMessage.toLowerCase().includes('rls')) {
                errorMessage += '\n\n(هذا يعني على الأرجح أن سياسة أمان قاعدة البيانات تمنع الوصول. تحقق من أدوار المستخدم وسياسات RLS.)';
            }

            console.error(`فشل في جلب البيانات الأكاديمية: ${errorMessage}`);
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
            console.error(`فشل في الإضافة: ${error.message}`);
        } else {
            ref.current!.value = '';
            fetchData(); // Refresh data
        }
    };

    const handleDelete = async (id: string | number, tableName: string) => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);

        if (error) {
            console.error(`فشل في الحذف: ${error.message}`);
        } else {
            fetchData(); // Refresh data
        }
    };

    if (loading) {
        return <div className="text-center p-8">...جاري تحميل البيانات</div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">إدارة الشؤون الأكاديمية</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="إضافة فصول دراسية">
                    <p className="text-sm text-slate-500 mb-3">أدخل كل اسم فصل في سطر جديد.</p>
                    <textarea ref={newClassesRef} placeholder="الفصل أ&#x0a;الفصل ب&#x0a;..." className="w-full h-24 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                    <button onClick={() => handleAdd(newClassesRef, 'classes')} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"><PlusIcon className="w-5 h-5" /> إضافة</button>
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
                            console.error('يرجى اختيار الفصل الدراسي أولاً.');
                            return;
                        }
                        handleAdd(newStudentsRef, 'students', { classId: classId });
                    }} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"><PlusIcon className="w-5 h-5" /> إضافة</button>
                </Card>
                <Card title="إضافة مواد دراسية">
                    <p className="text-sm text-slate-500 mb-3">أدخل כל اسم مادة في سطر جديد.</p>
                    <textarea ref={newCoursesRef} placeholder="المادة 1&#x0a;المادة 2&#x0a;..." className="w-full h-24 p-2 border rounded-md" />
                    <button onClick={() => handleAdd(newCoursesRef, 'courses')} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600"><PlusIcon className="w-5 h-5" /> إضافة</button>
                </Card>
            </div>
            
            <Card title="الفصول الدراسية الحالية">
                <DataTable 
                    headers={['#', 'اسم الفصل']} 
                    data={classes.map((c, i) => [i + 1, c.name])}
                    onDelete={(id) => handleDelete(id, 'classes')}
                    items={classes}
                />
            </Card>
            <Card title="الطلاب المسجلون">
                <DataTable 
                    headers={['#', 'اسم الطالب', 'الفصل الدراسي']} 
                    data={students.map((s, i) => [i + 1, s.name, classes.find(c => c.id === s.classId)?.name || 'N/A'])}
                    onDelete={(id) => handleDelete(id, 'students')}
                    items={students}
                />
            </Card>
            <Card title="المواد الدراسية المتاحة">
                <DataTable 
                    headers={['#', 'اسم المادة']} 
                    data={courses.map((c, i) => [i + 1, c.name])}
                    onDelete={(id) => handleDelete(id, 'courses')}
                    items={courses}
                />
            </Card>
        </div>
    );
};