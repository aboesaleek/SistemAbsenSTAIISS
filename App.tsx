import React, { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AcademicDashboard } from './pages/AcademicDashboard';
import { AppMode } from './types';
import { DormitoryDashboard } from './pages/DormitoryDashboard';
import { supabase } from './supabaseClient';

function App() {
  const [loggedInRole, setLoggedInRole] = useState<AppMode | null>(null);

  const handleLogin = (e: React.FormEvent, mode: AppMode) => {
    e.preventDefault();
    // Logika otentikasi dan otorisasi sekarang ditangani sepenuhnya di dalam LoginPage.
    // Fungsi ini hanya mengatur state UI setelah login berhasil.
    setLoggedInRole(mode);
  };

  const handleLogout = async () => {
    // Memanggil signOut dari Supabase untuk mengakhiri sesi pengguna.
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    }
    // Mengatur ulang state aplikasi ke halaman login.
    setLoggedInRole(null);
  };

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