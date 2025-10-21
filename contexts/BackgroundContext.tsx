import React, { createContext, useContext } from 'react';

const DEFAULT_BACKGROUND_URL = "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2175&auto=format&fit=crop"; // Mountain Lake

interface BackgroundContextState {
  backgroundUrl: string;
  loading: boolean;
}

const BackgroundContext = createContext<BackgroundContextState | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // The background is now static, so we can set it directly.
    // No fetching is needed.
    const value = { 
        backgroundUrl: DEFAULT_BACKGROUND_URL, 
        loading: false 
    };

    return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground harus digunakan di dalam BackgroundProvider');
  }
  return context;
};