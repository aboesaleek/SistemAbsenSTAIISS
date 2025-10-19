import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Class, Course, CourseSchedule, DayOfWeek, DayOfWeekLabel } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { useNotification } from '../../contexts/NotificationContext';

interface ScheduleManagerProps {
    classes: Class[];
    courses: Course[];
}

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedCourseIds: string[]) => Promise<void>;
    class_id: string;
    day: DayOfWeek;
    allCourses: Course[];
    schedulesForDay: CourseSchedule[];
}

const ScheduleEditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, class_id, day, allCourses, schedulesForDay }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(schedulesForDay.map(s => s.course_id)));
        }
    }, [isOpen, schedulesForDay]);

    if (!isOpen) return null;

    const handleToggle = (courseId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(Array.from(selectedIds));
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">تعديل جدول يوم {DayOfWeekLabel[day]}</h3>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <p className="text-slate-600 mb-4">اختر المواد الدراسية لهذا اليوم.</p>
                    <div className="space-y-2">
                        {allCourses.map(course => (
                            <label key={course.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(course.id)}
                                    onChange={() => handleToggle(course.id)}
                                    className="w-5 h-5 text-teal-600 focus:ring-teal-500 border-slate-400"
                                />
                                <span>{course.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">إلغاء</button>
                    <button onClick={handleSave} disabled={isSaving} className="py-2 px-4 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50">
                        {isSaving ? '...جاري الحفظ' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ classes, courses }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<{ day: DayOfWeek } | null>(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchSchedules = async () => {
            if (!selectedClassId) {
                setSchedules([]);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('academic_schedules')
                .select('*')
                .eq('class_id', selectedClassId);

            if (error) {
                console.error('Error fetching schedules:', error.message);
                showNotification(`فشل في جلب الجداول: ${error.message}`, 'error');
            } else {
                setSchedules(data || []);
            }
            setLoading(false);
        };
        fetchSchedules();
    }, [selectedClassId]);

    const schedulesByDay = useMemo(() => {
        const map = new Map<DayOfWeek, CourseSchedule[]>();
        schedules.forEach(schedule => {
            const day = schedule.day_of_week;
            if (!map.has(day)) {
                map.set(day, []);
            }
            map.get(day)!.push(schedule);
        });
        return map;
    }, [schedules]);

    const handleSaveSchedule = async (selectedCourseIds: string[]) => {
        if (!editingSchedule || !selectedClassId) return;

        const dayToEdit = editingSchedule.day;

        // Delete existing schedules for this class and day
        const { error: deleteError } = await supabase
            .from('academic_schedules')
            .delete()
            .eq('class_id', selectedClassId)
            .eq('day_of_week', dayToEdit);

        if (deleteError) {
            showNotification(`فشل في تحديث الجدول: ${deleteError.message}`, 'error');
            return;
        }

        // Insert new schedules if any are selected
        if (selectedCourseIds.length > 0) {
            const newSchedules = selectedCourseIds.map(course_id => ({
                class_id: selectedClassId,
                course_id,
                day_of_week: dayToEdit,
            }));

            const { error: insertError } = await supabase.from('academic_schedules').insert(newSchedules);
            if (insertError) {
                showNotification(`فشل في حفظ الجدول: ${insertError.message}`, 'error');
                return;
            }
        }

        // Refetch schedules for the class
        const { data } = await supabase.from('academic_schedules').select('*').eq('class_id', selectedClassId);
        setSchedules(data || []);
        showNotification('تم تحديث الجدول بنجاح.', 'success');
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <div>
                <label htmlFor="class-select-schedule" className="block text-sm font-medium text-slate-700 mb-1">اختر الفصل الدراسي لعرض أو تعديل جدوله</label>
                <select
                    id="class-select-schedule"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500"
                >
                    <option value="">-- اختر الفصل --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            
            {loading ? <div className="text-center py-8">...جاري تحميل الجدول</div> : (
                selectedClassId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY].map(day => {
                            const dailySchedules = schedulesByDay.get(day) || [];
                            return (
                                <div key={day} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-700">{DayOfWeekLabel[day]}</h4>
                                        <button onClick={() => setEditingSchedule({ day })} className="text-blue-600 hover:text-blue-800">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <ul className="space-y-1 text-sm text-slate-600">
                                        {dailySchedules.length > 0 ? (
                                            dailySchedules.map(schedule => (
                                                <li key={schedule.id}>- {courses.find(c => c.id === schedule.course_id)?.name || 'مادة محذوفة'}</li>
                                            ))
                                        ) : (
                                            <li className="text-slate-400">لا توجد مواد مجدولة.</li>
                                        )}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
            
            {editingSchedule && (
                 <ScheduleEditModal
                    isOpen={!!editingSchedule}
                    onClose={() => setEditingSchedule(null)}
                    onSave={handleSaveSchedule}
                    class_id={selectedClassId}
                    day={editingSchedule.day}
                    allCourses={courses}
                    schedulesForDay={schedulesByDay.get(editingSchedule.day) || []}
                 />
            )}

        </div>
    );
};
