import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Dormitory, Student, DormitoryPermission, DormitoryPrayerAbsence, DormitoryCeremonyAbsence, Prayer, CeremonyStatus, ceremonyStatusToLabel } from '../types';
import { useAcademicPeriod } from './AcademicPeriodContext';

interface DormitoryDataContextState {
  dormitories: Dormitory[];
  students: Student[];
  permissionRecords: DormitoryPermission[];
  prayerAbsences: DormitoryPrayerAbsence[];
  ceremonyAbsences: DormitoryCeremonyAbsence[];
  loading: boolean;
  refetchData: () => void;
}

const DormitoryDataContext = createContext<DormitoryDataContextState | undefined>(undefined);

export const DormitoryDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [permissionRecords, setPermissionRecords] = useState<DormitoryPermission[]>([]);
  const [prayerAbsences, setPrayerAbsences] = useState<DormitoryPrayerAbsence[]>([]);
  const [ceremonyAbsences, setCeremonyAbsences] = useState<DormitoryCeremonyAbsence[]>([]);
  const { academicYear, semester, isReady } = useAcademicPeriod();

  const fetchData = useCallback(async () => {
    if (!isReady) return; // Don't fetch until academic period is ready

    setLoading(true);
    try {
      const [
        { data: dormsData, error: dormsError },
        { data: studentsData, error: studentsError },
        { data: permissionsData, error: permissionsError },
        { data: prayerData, error: prayerError },
        { data: ceremonyData, error: ceremonyError },
      ] = await Promise.all([
        supabase.from('dormitories').select('*'),
        supabase.from('students').select('*').not('dormitory_id', 'is', null),
        supabase.from('dormitory_permissions').select('*').eq('academic_year', academicYear).eq('semester', semester),
        supabase.from('dormitory_prayer_absences').select('*').eq('academic_year', academicYear).eq('semester', semester),
        supabase.from('dormitory_ceremony_absences').select('*').eq('academic_year', academicYear).eq('semester', semester),
      ]);

      if (dormsError || studentsError || permissionsError || prayerError || ceremonyError) {
        throw new Error('Gagal memuat satu atau lebih sumber data asrama.');
      }
      
      const safeDorms = dormsData || [];
      const safeStudents = studentsData || [];

      setDormitories(safeDorms);
      setStudents(safeStudents);
      setPermissionRecords(permissionsData || []);
      
      const studentsMap = new Map<string, Student>(safeStudents.map(s => [s.id, s]));
      const dormsMap = new Map<string, string>(safeDorms.map(d => [d.id, d.name]));

      const mappedPrayer: DormitoryPrayerAbsence[] = (prayerData || []).map((p: any) => {
        const student = studentsMap.get(p.student_id);
        return {
          id: p.id,
          studentId: p.student_id,
          date: p.date,
          prayer: p.prayer as Prayer,
          status: p.status as CeremonyStatus,
          studentName: student?.name || 'N/A',
          dormitoryId: student?.dormitory_id || '',
          dormitoryName: student?.dormitory_id ? dormsMap.get(student.dormitory_id) || 'N/A' : 'N/A',
        }
      });

      const mappedCeremony: DormitoryCeremonyAbsence[] = (ceremonyData || []).map((c: any) => {
        const student = studentsMap.get(c.student_id);
        return {
          id: c.id,
          studentId: c.student_id,
          date: c.date,
          status: c.status as CeremonyStatus,
          studentName: student?.name || 'N/A',
          dormitoryId: student?.dormitory_id || '',
          dormitoryName: student?.dormitory_id ? dormsMap.get(student.dormitory_id) || 'N/A' : 'N/A',
        }
      });

      setPrayerAbsences(mappedPrayer);
      setCeremonyAbsences(mappedCeremony);

    } catch (error: any) {
      console.error(`Gagal memuat data asrama terpusat: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester, isReady]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = {
    dormitories,
    students,
    permissionRecords,
    prayerAbsences,
    ceremonyAbsences,
    loading: loading || !isReady, // Show loading if context isn't ready
    refetchData: fetchData,
  };

  return <DormitoryDataContext.Provider value={value}>{children}</DormitoryDataContext.Provider>;
};

export const useDormitoryData = () => {
  const context = useContext(DormitoryDataContext);
  if (context === undefined) {
    throw new Error('useDormitoryData harus digunakan di dalam DormitoryDataProvider');
  }
  return context;
};