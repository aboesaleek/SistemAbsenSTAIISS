import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_BACKGROUND_URL = "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2175&auto=format&fit=crop"; // Mountain Lake

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
                    setBackgroundUrl(DEFAULT_BACKGROUND_URL);
                }
            } catch (error: any) {
                console.error("Gagal memeriksa latar belakang kustom, kembali ke cadangan:", error.message || error);
                setBackgroundUrl(DEFAULT_BACKGROUND_URL);
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
