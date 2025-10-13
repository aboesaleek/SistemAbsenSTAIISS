import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Class, Student, Course, AttendanceRecord, RecapStatus } from '../types';

interface AcademicDataContextState {
  classes: Class[];
  students: Student[];
  courses: Course[];
  records: AttendanceRecord[];
  loading: boolean;
  refetchData: () => void;
}

const AcademicDataContext = createContext<AcademicDataContextState | undefined>(undefined);

export const AcademicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: classesData, error: classesError },
        { data: studentsData, error: studentsError },
        { data: coursesData, error: coursesError },
        { data: permissionsData, error: permissionsError },
        { data: absencesData, error: absencesError },
      ] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('students').select('*').not('class_id', 'is', null),
        supabase.from('courses').select('*'),
        supabase.from('academic_permissions').select('*'),
        supabase.from('academic_absences').select('*'),
      ]);

      if (classesError || studentsError || coursesError || permissionsError || absencesError) {
        throw new Error(
          classesError?.message || studentsError?.message || coursesError?.message || permissionsError?.message || absencesError?.message
        );
      }

      const safeClasses = classesData || [];
      const safeStudents = studentsData || [];
      const safeCourses = coursesData || [];
      
      setClasses(safeClasses);
      setStudents(safeStudents);
      setCourses(safeCourses);

      const studentsMap = new Map<string, Student>(safeStudents.map(s => [s.id, s]));
      const classesMap = new Map<string, Class>(safeClasses.map(c => [c.id, c]));
      const coursesMap = new Map<string, Course>(safeCourses.map(c => [c.id, c]));

      const combined: AttendanceRecord[] = [];

      (permissionsData || []).forEach((p: any) => {
          const student = studentsMap.get(p.student_id);
          if (!student) return;
          const studentClass = classesMap.get(student.class_id!);
          combined.push({
              id: `p-${p.id}`,
              studentId: p.student_id,
              studentName: student.name,
              classId: student.class_id || '',
              className: studentClass?.name || 'N/A',
              date: p.date,
              status: p.type === 'sakit' ? RecapStatus.SICK : RecapStatus.PERMISSION,
          });
      });

      (absencesData || []).forEach((a: any) => {
          const student = studentsMap.get(a.student_id);
          if (!student) return;
          const studentClass = classesMap.get(student.class_id!);
          const course = coursesMap.get(a.course_id);
          combined.push({
              id: `a-${a.id}`,
              studentId: a.student_id,
              studentName: student.name,
              classId: student.class_id || '',
              className: studentClass?.name || 'N/A',
              date: a.date,
              status: RecapStatus.ABSENT,
              courseName: course?.name,
          });
      });
      
      setRecords(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (error: any) {
      console.error(`Gagal memuat data akademik terpusat: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = {
    classes,
    students,
    courses,
    records,
    loading,
    refetchData: fetchData,
  };

  return <AcademicDataContext.Provider value={value}>{children}</AcademicDataContext.Provider>;
};

export const useAcademicData = () => {
  const context = useContext(AcademicDataContext);
  if (context === undefined) {
    throw new Error('useAcademicData harus digunakan di dalam AcademicDataProvider');
  }
  return context;
};
