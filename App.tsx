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
    // This listener handles session restoration on page load and all auth events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // A user is logged in. Determine which dashboard to show.
        // We prioritize the mode the user explicitly logged into, which is stored in sessionStorage.
        const lastMode = sessionStorage.getItem('appMode') as AppMode;

        // Fetch the user's role for validation and fallback.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          console.error("Could not fetch user profile, signing out.", error);
          await supabase.auth.signOut();
          setLoggedInRole(null);
        } else {
            const userRole = profile.role as AppRole;
            let finalMode: AppMode | null = null;
            
            // Validate if the last used mode is accessible by the user's role.
            let isLastModeValid = false;
            if (lastMode) {
                 if (userRole === AppRole.SUPER_ADMIN) isLastModeValid = true;
                 else if (userRole === AppRole.ACADEMIC_ADMIN && lastMode === AppMode.ACADEMIC) isLastModeValid = true;
                 else if (userRole === AppRole.DORMITORY_ADMIN && lastMode === AppMode.DORMITORY) isLastModeValid = true;
                 // FIX: The following line was removed as it was redundant and caused a TypeScript error.
                 // The first `if` condition correctly handles all cases for a SUPER_ADMIN.
            }

            if (isLastModeValid) {
                finalMode = lastMode;
            } else {
                // If no valid last mode, determine a default dashboard from their role.
                switch (userRole) {
                    case AppRole.SUPER_ADMIN: finalMode = AppMode.ADMIN; break;
                    case AppRole.ACADEMIC_ADMIN: finalMode = AppMode.ACADEMIC; break;
                    case AppRole.DORMITORY_ADMIN: finalMode = AppMode.DORMITORY; break;
                }
                if (finalMode) {
                    sessionStorage.setItem('appMode', finalMode);
                }
            }
            setLoggedInRole(finalMode);
        }

      } else {
        // The user is not logged in.
        setLoggedInRole(null);
        sessionStorage.removeItem('appMode');
      }
      setLoading(false);
    });

    // Cleanup the subscription when the component unmounts.
    return () => {
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