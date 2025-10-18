import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AcademicDashboard } from './pages/AcademicDashboard';
import { AppMode, AppRole } from './types';
import { DormitoryDashboard } from './pages/DormitoryDashboard';
import { supabase } from './supabaseClient';

function App() {
  const [loggedInRole, setLoggedInRole] = useState<AppMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const setAppModeFromSession = async (session: any) => {
      if (!isMounted) return;
      
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
              console.error("Gagal mengambil profil (kemungkinan masalah RLS):", profileError.message);
              throw profileError;
          }

          if (!profile) {
            throw new Error("Profil pengguna tidak ditemukan. Keluar.");
          }

          const lastMode = sessionStorage.getItem('appMode') as AppMode;
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
          if (isMounted) setLoggedInRole(finalMode);

        } catch (error: any) {
          console.error("Terjadi kesalahan saat memeriksa sesi, keluar:", error.message);
          await supabase.auth.signOut();
          if (isMounted) {
            setLoggedInRole(null);
            sessionStorage.removeItem('appMode');
          }
        }
      } else {
        if (isMounted) {
            setLoggedInRole(null);
            sessionStorage.removeItem('appMode');
        }
      }
    };

    // Check initial session state quickly, then remove loader.
    supabase.auth.getSession().then(({ data: { session } }) => {
        setAppModeFromSession(session).finally(() => {
            if(isMounted) {
                setLoading(false);
            }
        });
    });

    // Listen for subsequent auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted) {
            await setAppModeFromSession(session);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLogin = (e: React.FormEvent, mode: AppMode) => {
    e.preventDefault();
    // This function is called from LoginPage AFTER a successful Supabase sign-in.
    // The onAuthStateChange listener above will handle setting the state,
    // but we set sessionStorage here to remember the user's chosen mode for subsequent visits.
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
