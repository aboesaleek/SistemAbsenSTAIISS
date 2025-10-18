import React, { useState, useEffect } from 'react';
import { AppMode, AppRole } from '../types';
import { ModeToggle } from '../components/ModeToggle';
import { UserIcon } from '../components/icons/UserIcon';
import { LockIcon } from '../components/icons/LockIcon';
import { Logo } from '../components/icons/Logo';
import { supabase } from '../supabaseClient';

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
    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300">
      {icon}
    </span>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white placeholder-slate-300 py-3 pr-4 pl-12 transition-colors duration-300 focus:outline-none"
      required
    />
  </div>
);

// A curated list of high-quality, Islamic-themed backgrounds from Pexels.
const ISLAMIC_BACKGROUNDS = [
  "https://images.pexels.com/photos/4139818/pexels-photo-4139818.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Nabawi Mosque
  "https://images.pexels.com/photos/8643936/pexels-photo-8643936.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Interior Blue Mosque
  "https://images.pexels.com/photos/4038863/pexels-photo-4038863.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Sheikh Zayed Grand Mosque
  "https://images.pexels.com/photos/1359325/pexels-photo-1359325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Person praying in mosque
  "https://images.pexels.com/photos/5095753/pexels-photo-5095753.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Mosque silhouette sunset
  "https://images.pexels.com/photos/8038520/pexels-photo-8038520.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Ornate mosque interior
  "https://images.pexels.com/photos/7437593/pexels-photo-7437593.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Kaaba
  "https://images.pexels.com/photos/4607198/pexels-photo-4607198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Person reading Quran
  "https://images.pexels.com/photos/1317712/pexels-photo-1317712.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Mosque exterior at night
  "https://images.pexels.com/photos/7281983/pexels-photo-7281983.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Islamic architecture detail
];

// Select a new background image deterministically based on the day of the year.
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 0);
const diff = now.getTime() - startOfYear.getTime();
const oneDay = 1000 * 60 * 60 * 24;
const dayOfYear = Math.floor(diff / oneDay);
const backgroundUrl = ISLAMIC_BACKGROUNDS[dayOfYear % ISLAMIC_BACKGROUNDS.length];


export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.ACADEMIC);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setErrorMessage(authError?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      return;
    }

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
        
        let canAccess = false;
        if (userRole === AppRole.SUPER_ADMIN) {
            canAccess = true;
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
        supabase.auth.signOut();
    } finally {
        setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen bg-cover bg-center text-white flex flex-col items-center justify-center p-4 transition-all duration-1000"
      style={{ 
        backgroundImage: `url('${backgroundUrl}')`
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <Logo className="mx-auto text-white h-14 w-14 sm:h-20 sm:w-20" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300 drop-shadow-lg">
            نظام كشف الغياب والأذونات
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-slate-200 drop-shadow-md">
            جامعة الإمام الشافعي
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/20 shadow-2xl space-y-4 sm:space-y-6">
          <ModeToggle currentMode={mode} onModeChange={setMode} />
          
          <form className="space-y-4 sm:space-y-6" onSubmit={handleFormSubmit}>
            {errorMessage && (
                <div className="bg-red-500/30 border border-red-400/50 text-white px-4 py-3 rounded-lg text-center" role="alert">
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
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 focus:ring-offset-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...جاري التحقق' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
        
      </div>
    </main>
  );
}