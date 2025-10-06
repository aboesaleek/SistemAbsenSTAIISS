import React, { useState, useEffect, useRef } from 'react';
import { Class, Student, Course } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../supabaseClient';

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
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
        <table className="w-full text-sm text-right text-slate-600 responsive-table">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                    {headers.map(h => <th key={h} className="px-6 py-3 whitespace-nowrap">{h}</th>)}
                    <th className="px-6 py-3 whitespace-nowrap">إجراءات</th>
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
                            {row.map((cell, cellIndex) => <td key={cellIndex} data-label={headers[cellIndex]} className="px-6 py-4 whitespace-nowrap">{cell}</td>)}
                            <td className="px-6 py-4 action-cell whitespace-nowrap">
                                <div className="flex gap-3 justify-end">
                                    <button disabled className="text-blue-400 cursor-not-allowed" title="ميزة التعديل قيد التطوير">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    {onDelete && (
                                        <button onClick={() => onDelete(items[rowIndex].id)} className="text-red-600 hover:text-red-800">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
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
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'courses'>('classes');


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

    const handleGenericAdd = async (
        ref: React.RefObject<HTMLTextAreaElement>,
        tableName: string,
        setLoading: (loading: boolean) => void,
        itemType: string,
        additionalData?: Record<string, any>
    ) => {
        const content = ref.current?.value;
        if (!content?.trim()) {
            setMessage({ type: 'error', text: `يرجى إدخال ${itemType} لإضافتها.` });
            setTimeout(() => setMessage(null), 5000);
            return;
        }

        setLoading(true);
        setMessage(null);

        const items = content.split('\n').map(name => ({ name: name.trim(), ...additionalData })).filter(item => item.name);
        
        if (items.length === 0) {
            setMessage({ type: 'error', text: `يرجى إدخال ${itemType} صالحة لإضافتها.` });
            setLoading(false);
            setTimeout(() => setMessage(null), 5000);
            return;
        }

        const { error } = await supabase.from(tableName).insert(items);
        
        if (error) {
            setMessage({ type: 'error', text: `فشل في الإضافة: ${error.message}` });
            console.error(`فشل في الإضافة: ${error.message}`);
        } else {
            setMessage({ type: 'success', text: `تمت إضافة ${items.length} ${itemType} بنجاح.` });
            ref.current!.value = '';
            fetchData(); // Refresh data
        }

        setLoading(false);
        setTimeout(() => setMessage(null), 5000);
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
            
            {message && (
                <div className={`p-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

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
                            setMessage({ type: 'error', text: 'يرجى اختيار الفصل الدراسي أولاً.' });
                            setTimeout(() => setMessage(null), 5000);
                            return;
                        }
                        handleGenericAdd(newStudentsRef, 'students', setIsAddingStudent, 'طلاب', { class_id: classId });
                    }} disabled={isAddingStudent} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingStudent ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
                <Card title="إضافة مواد دراسية">
                    <p className="text-sm text-slate-500 mb-3">أدخل כל اسم مادة في سطر جديد.</p>
                    <textarea ref={newCoursesRef} placeholder="المادة 1&#x0a;المادة 2&#x0a;..." className="w-full h-24 p-2 border rounded-md" />
                    <button onClick={() => handleGenericAdd(newCoursesRef, 'courses', setIsAddingCourse, 'مواد دراسية')} disabled={isAddingCourse} className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed">
                        {isAddingCourse ? '...جاري الإضافة' : <><PlusIcon className="w-5 h-5" /> إضافة</>}
                    </button>
                </Card>
            </div>
            
            <div className="bg-white rounded-xl shadow-md border border-slate-200">
                <div className="px-6 pt-4 border-b border-slate-200">
                    <nav className="-mb-px flex gap-6" aria-label="Tabs">
                        <TabButton isActive={activeTab === 'classes'} onClick={() => setActiveTab('classes')}>
                            الفصول الدراسية
                        </TabButton>
                        <TabButton isActive={activeTab === 'students'} onClick={() => setActiveTab('students')}>
                            الطلاب المسجلون
                        </TabButton>
                        <TabButton isActive={activeTab === 'courses'} onClick={() => setActiveTab('courses')}>
                            المواد الدراسية
                        </TabButton>
                    </nav>
                </div>
                <div className="p-4 sm:p-6">
                    {activeTab === 'classes' && (
                        <DataTable 
                            headers={['#', 'اسم الفصل']} 
                            data={classes.map((c, i) => [i + 1, c.name])}
                            onDelete={(id) => handleDelete(id, 'classes')}
                            items={classes}
                        />
                    )}
                    {activeTab === 'students' && (
                        <DataTable 
                            headers={['#', 'اسم الطالب', 'الفصل الدراسي']} 
                            data={students.map((s, i) => [i + 1, s.name, classes.find(c => c.id === s.class_id)?.name || 'N/A'])}
                            onDelete={(id) => handleDelete(id, 'students')}
                            items={students}
                        />
                    )}
                    {activeTab === 'courses' && (
                        <DataTable 
                            headers={['#', 'اسم المادة']} 
                            data={courses.map((c, i) => [i + 1, c.name])}
                            onDelete={(id) => handleDelete(id, 'courses')}
                            items={courses}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};