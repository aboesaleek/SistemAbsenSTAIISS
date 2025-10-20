import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AcademicPeriodContextState {
  academicYear: string;
  semester: number;
  isReady: boolean; // To indicate if values have been loaded from sessionStorage
  setAcademicPeriod: (year: string, sem: number) => void;
}

const AcademicPeriodContext = createContext<AcademicPeriodContextState | undefined>(undefined);

export const AcademicPeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedYear = sessionStorage.getItem('academicYear');
      const storedSemester = sessionStorage.getItem('semester');
      if (storedYear) setAcademicYear(storedYear);
      if (storedSemester) setSemester(parseInt(storedSemester, 10));
    } catch (e) {
      console.error("Failed to read academic period from session storage", e);
    } finally {
      setIsReady(true);
    }
  }, []);
  
  const setAcademicPeriod = useCallback((year: string, sem: number) => {
    try {
      sessionStorage.setItem('academicYear', year);
      sessionStorage.setItem('semester', sem.toString());
      setAcademicYear(year);
      setSemester(sem);
    } catch (e) {
      console.error("Failed to save academic period to session storage", e);
    }
  }, []);

  const value = {
    academicYear,
    semester,
    isReady,
    setAcademicPeriod,
  };

  return <AcademicPeriodContext.Provider value={value}>{children}</AcademicPeriodContext.Provider>;
};

export const useAcademicPeriod = () => {
  const context = useContext(AcademicPeriodContext);
  if (context === undefined) {
    throw new Error('useAcademicPeriod must be used within an AcademicPeriodProvider');
  }
  return context;
};
