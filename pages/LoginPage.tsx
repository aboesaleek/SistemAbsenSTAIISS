import React, { useState, useEffect } from 'react';
import { AppMode, AppRole } from '../types';
import { ModeToggle } from '../components/ModeToggle';
import { UserIcon } from '../components/icons/UserIcon';
import { LockIcon } from '../components/icons/LockIcon';
import { Logo } from '../components/icons/Logo';
import { supabase } from '../supabaseClient';
import { useBackground } from '../contexts/BackgroundContext';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

interface LoginPageProps {
  onLogin: (mode: AppMode, academicYear: string, semester: number) => void;
}

const InputField: React.FC<{
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  id: string;
  onChange: () => void;
}> = ({ icon, type, placeholder, id, onChange }) => (
  <div className="relative w-full">
    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 pointer-events-none">
      {icon}
    </span>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white placeholder-slate-300 py-3 pl-4 pr-12 transition-colors duration-300 focus:outline-none"
      required
    />
  </div>
);

const SelectField: React.FC<{
  icon: React.ReactNode;
  id: string;
  children: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}> = ({ icon, id, children, value, onChange, disabled }) => (
    <div className="relative w-full">
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 pointer-events-none">
            {icon}
        </span>
        <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full appearance-none bg-transparent border-b-2 border-white/30 focus:border-white text-white py-3 pr-12 pl-4 transition-colors duration-300 focus:outline-none disabled:opacity-70"
        >
            {children}
        </select>
    </div>
);

// Helper to generate academic years
const generateAcademicYears = () => {
    const startYear = 2025;
    const years = [];
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        years.push(`${year}-${year + 1}`);
    }
    return years;
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.ACADEMIC);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState(1);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const { backgroundUrl, loading: backgroundLoading } = useBackground();
  const [showPassword, setShowPassword] = useState(false);
  
  const academicYears = generateAcademicYears();

  useEffect(() => {
      const fetchLoginDefaults = async () => {
          setLoadingDefaults(true);
          try {
              const { data, error } = await supabase.from('app_settings').select('key, value');
              if (error) throw error;

              if (data && data.length > 0) {
                const yearSetting = data.find(s => s.key === 'default_academic_year');
                const semesterSetting = data.find(s => s.key === 'default_semester');
                
                setAcademicYear(yearSetting?.value || '2025-2026');
                setSemester(semesterSetting ? parseInt(semesterSetting.value, 10) : 1);
              } else {
                console.warn("Pengaturan default tidak ditemukan, menggunakan nilai fallback.");
                setAcademicYear('2025-2026');
                setSemester(1);
              }

          } catch (error: any) {
              console.error("Gagal mengambil pengaturan default login:", error.message || error);
              // Fallback to hardcoded defaults if fetch fails
              setAcademicYear('2025-2026');
              setSemester(1);
          } finally {
              setLoadingDefaults(false);
          }
      };
      fetchLoginDefaults();
  }, []);


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
            onLogin(mode, academicYear, semester);
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
        backgroundImage: backgroundLoading ? 'none' : `url('${backgroundUrl}')`,
        backgroundColor: backgroundLoading ? '#1a202c' : 'transparent'
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
            <div className="grid grid-cols-2 gap-4">
               <SelectField
                  id="academicYear"
                  icon={<CalendarIcon className="w-5 h-5" />}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  disabled={loadingDefaults}
                >
                  {academicYears.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
                </SelectField>
                <SelectField
                  id="semester"
                  icon={<div className="w-5 h-5 flex items-center justify-center font-bold">#</div>}
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  disabled={loadingDefaults}
                >
                  <option value={1} className="text-black">الفصل الدراسي 1</option>
                  <option value={2} className="text-black">الفصل الدراسي 2</option>
                </SelectField>
            </div>
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
            <div className="relative w-full">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 pointer-events-none">
                    <LockIcon className="w-5 h-5" />
                </span>
                <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    onChange={() => setErrorMessage('')}
                    className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white placeholder-slate-300 py-3 pl-12 pr-12 transition-colors duration-300 focus:outline-none"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-300 hover:text-white"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                    {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                </button>
            </div>
            <button
              type="submit"
              disabled={loading || loadingDefaults}
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