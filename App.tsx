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
    let isMounted = true; // Handle component unmounting during async operations

    const checkUserSession = async () => {
      try {
        // First, get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user && isMounted) {
          // If there's a session, fetch the user's profile to get their role
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
            // This case is rare but means profile doesn't exist for a logged-in user.
            // Treat it as an error and sign out.
            throw new Error("Profil pengguna tidak ditemukan. Keluar.");
          }

          if (isMounted) {
            // Profile fetched successfully, determine the correct dashboard mode
            const lastMode = sessionStorage.getItem('appMode') as AppMode;
            const userRole = profile.role as AppRole;
            let finalMode: AppMode | null = null;
            
            // Validate lastMode against user's actual role
            let isLastModeValid = false;
            if (lastMode) {
                 if (userRole === AppRole.SUPER_ADMIN) isLastModeValid = true;
                 else if (userRole === AppRole.ACADEMIC_ADMIN && lastMode === AppMode.ACADEMIC) isLastModeValid = true;
                 else if (userRole === AppRole.DORMITORY_ADMIN && lastMode === AppMode.DORMITORY) isLastModeValid = true;
            }

            if (isLastModeValid) {
                finalMode = lastMode;
            } else {
                // Fallback to a default mode based on role
                switch (userRole) {
                    case AppRole.SUPER_ADMIN: finalMode = AppMode.ADMIN; break;
                    case AppRole.ACADEMIC_ADMIN: finalMode = AppMode.ACADEMIC; break;
                    case AppRole.DORMITORY_ADMIN: finalMode = AppMode.DORMITORY; break;
                }
                if (finalMode) sessionStorage.setItem('appMode', finalMode);
            }
            setLoggedInRole(finalMode);
          }
        } else {
          // No session, user is logged out
          setLoggedInRole(null);
          sessionStorage.removeItem('appMode');
        }
      } catch (error: any) {
        console.error("Terjadi kesalahan saat pemeriksaan sesi:", error.message);
        // On any error (session check, profile fetch), sign out and show login page
        await supabase.auth.signOut();
        if (isMounted) {
          setLoggedInRole(null);
          sessionStorage.removeItem('appMode');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUserSession();

    // Listen for auth changes (specifically logout) that happen after the initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If the session is gone, it means the user logged out.
      if (!session && isMounted) {
        setLoggedInRole(null);
        sessionStorage.removeItem('appMode');
      }
    });

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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="text-xl font-semibold text-slate-600">...جاري تحميل التطبيق</div>
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
