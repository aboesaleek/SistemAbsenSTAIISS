import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DAILY_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1582657599026-89a03ac3347a?q=80&w=2070&auto=format&fit=crop", // Islamic Architecture
  "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop", // Desert Landscape at sunset
  "https://images.unsplash.com/photo-1560026333-c82057a525b2?q=80&w=1974&auto=format&fit=crop", // Mosque Interior
  "https://images.unsplash.com/photo-1444044205806-38f376274213?q=80&w=2070&auto=format&fit=crop", // Green Valley
  "https://images.unsplash.com/photo-1533130097349-105b4e357530?q=80&w=1938&auto=format&fit=crop", // Blue Mosque
  "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2050&auto=format&fit=crop", // Stars/Galaxy
  "https://images.unsplash.com/photo-1590184102213-1581c10c4957?q=80&w=1949&auto=format&fit=crop", // Kaaba
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2175&auto=format&fit=crop", // Mountain Lake
  "https://images.unsplash.com/photo-1600121852433-2224d8687a5f?q=80&w=1974&auto=format&fit=crop", // Calligraphy
  "https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=1974&auto=format&fit=crop", // Forest path
];

const getDailyBackground = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return DAILY_BACKGROUNDS[dayOfYear % DAILY_BACKGROUNDS.length];
};

interface BackgroundContextState {
  backgroundUrl: string;
  loading: boolean;
}

const BackgroundContext = createContext<BackgroundContextState | undefined>(undefined);

const BUCKET_NAME = 'public_assets';
const FILE_NAME = 'login_background';

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBackground = async () => {
            setLoading(true);
            const supabaseUrl = 'https://hzfzmoddonrwdlqxdwxs.supabase.co';
            const customBackgroundUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${FILE_NAME}`;

            try {
                const urlWithCacheBust = `${customBackgroundUrl}?t=${new Date().getTime()}`;
                const response = await fetch(urlWithCacheBust, { method: 'HEAD' });

                if (response.ok) {
                    setBackgroundUrl(urlWithCacheBust);
                } else {
                    setBackgroundUrl(getDailyBackground());
                }
            } catch (error: any) {
                console.error("Gagal memeriksa latar belakang kustom, kembali ke cadangan:", error.message || error);
                setBackgroundUrl(getDailyBackground());
            } finally {
                setLoading(false);
            }
        };

        fetchBackground();
    }, []);

    const value = { backgroundUrl, loading };

    return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground harus digunakan di dalam BackgroundProvider');
  }
  return context;
};