import React, { useState } from 'react';
import { AppMode, AppRole } from '../types';
import { ModeToggle } from '../components/ModeToggle';
import { UserIcon } from '../components/icons/UserIcon';
import { LockIcon } from '../components/icons/LockIcon';
import { Logo } from '../components/icons/Logo';
import { supabase } from '../supabaseClient'; // Impor klien Supabase

interface LoginPageProps {
  onLogin: (e: React.FormEvent, mode: AppMode) => void;
}

const InputField: React.FC<{
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  id: string;
  onChange: () => void;
}> = ({ icon, type, placeholder, id, onChange }) => (
  <div className="relative w-full">
    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
      {icon}
    </span>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full bg-transparent border-b-2 border-gray-300/80 focus:border-teal-500 text-slate-700 placeholder-gray-500/70 py-3 pr-4 pl-12 transition-colors duration-300 focus:outline-none"
      required
    />
  </div>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.ACADEMIC);
  const calligraphyPattern = "url(\"data:image/svg+xml,%3csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M25 10 C40 20, 60 20, 75 10' stroke='%235eead4' stroke-width='2' fill='none' stroke-linecap='round' opacity='0.2'/%3e%3cpath d='M10 25 C20 40, 20 60, 10 75' stroke='%235eead4' stroke-width='2' fill='none' stroke-linecap='round' opacity='0.2'/%3e%3cpath d='M90 25 C80 40, 80 60, 90 75' stroke='%235eead4' stroke-width='2' fill='none' stroke-linecap='round' opacity='0.2'/%3e%3cpath d='M25 90 C40 80, 60 80, 75 90' stroke='%235eead4' stroke-width='2' fill='none' stroke-linecap='round' opacity='0.2'/%3e%3cpath d='M50 20 C40 35, 40 65, 50 80' stroke='%232dd4bf' stroke-width='1.5' fill='none' stroke-linecap='round' opacity='0.15'/%3e%3cpath d='M20 50 C35 60, 65 60, 80 50' stroke='%232dd4bf' stroke-width='1.5' fill='none' stroke-linecap='round' opacity='0.15'/%3e%3c/svg%3e\")";
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    // Step 1: Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setErrorMessage(authError?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      return;
    }

    // Step 2: Authorize user by fetching their role from 'profiles' table
    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            throw new Error("لم يتم العثور على ملف تعريف المستخدم أو ليس لديك إذن بالوصول.");
        }

        const userRole = profile.role as AppRole;
        
        // Step 3: Validate the fetched role against the selected mode
        let canAccess = false;
        if (userRole === AppRole.SUPER_ADMIN) {
            canAccess = true; // Super admin can access all modes
        } else if (userRole === AppRole.ACADEMIC_ADMIN && mode === AppMode.ACADEMIC) {
            canAccess = true;
        } else if (userRole === AppRole.DORMITORY_ADMIN && mode === AppMode.DORMITORY) {
            canAccess = true;
        }

        if (canAccess) {
            onLogin(e, mode);
        } else {
            throw new Error(`ليس لديك الإذن للوصول إلى وضع "${mode}".`);
        }

    } catch (error: any) {
        setErrorMessage(`فشل التفويض: ${error.message}`);
        supabase.auth.signOut(); // Log out the user if authorization fails
    } finally {
        setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4"
      style={{ 
        backgroundImage: calligraphyPattern,
        backgroundSize: '100px' 
      }}
    >
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <Logo className="mx-auto text-teal-500 h-14 w-14 sm:h-20 sm:w-20" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">
            نظام كشف الغياب والأذونات
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-slate-600">
            جامعة الإمام الشافعي
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-2xl space-y-4 sm:space-y-6">
          <ModeToggle currentMode={mode} onModeChange={setMode} />
          
          <form className="space-y-4 sm:space-y-6" onSubmit={handleFormSubmit}>
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center" role="alert">
                    <span className="block sm:inline">{errorMessage}</span>
                </div>
            )}
            <InputField 
              id="email"
              type="email"
              placeholder="البريد الإلكتروني"
              icon={<UserIcon className="w-5 h-5" />}
              onChange={() => setErrorMessage('')}
            />
            <InputField 
              id="password"
              type="password"
              placeholder="كلمة المرور"
              icon={<LockIcon className="w-5 h-5" />}
              onChange={() => setErrorMessage('')}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 focus:ring-offset-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...جاري التحقق' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
        
      </div>
    </main>
  );
}