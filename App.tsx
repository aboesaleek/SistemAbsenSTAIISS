import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AcademicDashboard } from './pages/AcademicDashboard';
import { AppMode, AppRole } from './types';
import { DormitoryDashboard } from './pages/DormitoryDashboard';
import { supabase } from './supabaseClient';
import { useAcademicPeriod } from './contexts/AcademicPeriodContext';

function App() {
  const [loggedInRole, setLoggedInRole] = useState<AppMode | null>(null);
  const [loading, setLoading] = useState(true);
  const { setAcademicPeriod } = useAcademicPeriod();

  useEffect(() => {
    // Function to check the session on initial load
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;
          if (!profile) throw new Error("Profil pengguna tidak ditemukan.");
          
          const lastMode = sessionStorage.getItem('appMode') as AppMode;
          // Retrieve academic period from session storage
          const lastYear = sessionStorage.getItem('academicYear');
          const lastSemester = sessionStorage.getItem('semester');
          
          if (lastYear && lastSemester) {
            setAcademicPeriod(lastYear, parseInt(lastSemester, 10));
          }

          const userRole = profile.role as AppRole;
          let finalMode: AppMode | null = null;
          
          let isLastModeValid = false;
          if (lastMode) {
               if (userRole === AppRole.SUPER_ADMIN) isLastModeValid = true;
               else if (userRole === AppRole.ACADEMIC_ADMIN && lastMode === AppMode.ACADEMIC) isLastModeValid = true;
               else if (userRole === AppRole.DORMITORY_ADMIN && lastMode === AppMode.DORMITORY) isLastModeValid = true;
          }

          if (isLastModeValid) {
              finalMode = lastMode;
          } else {
              switch (userRole) {
                  case AppRole.SUPER_ADMIN: finalMode = AppMode.ADMIN; break;
                  case AppRole.ACADEMIC_ADMIN: finalMode = AppMode.ACADEMIC; break;
                  case AppRole.DORMITORY_ADMIN: finalMode = AppMode.DORMITORY; break;
              }
              if (finalMode) sessionStorage.setItem('appMode', finalMode);
          }
          setLoggedInRole(finalMode);
        } else {
          setLoggedInRole(null);
          sessionStorage.removeItem('appMode');
          sessionStorage.removeItem('academicYear');
          sessionStorage.removeItem('semester');
        }
      } catch (error: any) {
        console.error("Gagal memverifikasi sesi, keluar:", error.message);
        setLoggedInRole(null);
        sessionStorage.removeItem('appMode');
        sessionStorage.removeItem('academicYear');
        sessionStorage.removeItem('semester');
      } finally {
        // This is critical: ensure loading is set to false after the initial check.
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (e.g., logout from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setLoggedInRole(null);
        sessionStorage.removeItem('appMode');
        sessionStorage.removeItem('academicYear');
        sessionStorage.removeItem('semester');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLogin = (mode: AppMode, academicYear: string, semester: number) => {
    // This function is called from LoginPage AFTER a successful Supabase sign-in.
    setAcademicPeriod(academicYear, semester);
    sessionStorage.setItem('appMode', mode);
    setLoggedInRole(mode); // Set state immediately for a smooth transition.
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    }
    // The onAuthStateChange listener will clear the state and sessionStorage.
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
            <div className="loader"></div>
            <div className="text-lg font-semibold text-slate-600">...جاري تحميل التطبيق</div>
        </div>
    );
  }

  const renderDashboard = () => {
    switch (loggedInRole) {
      case AppMode.ADMIN:
        return <AdminDashboard onLogout={handleLogout} />;
      case AppMode.ACADEMIC:
        return <AcademicDashboard onLogout={handleLogout} />;
      case AppMode.DORMITORY:
        return <DormitoryDashboard onLogout={handleLogout} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return <>{renderDashboard()}</>;
}

export default App;