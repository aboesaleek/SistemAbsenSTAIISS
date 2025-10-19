import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationContextState {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

const NotificationPopup: React.FC<{ message: string; type: NotificationType; onClose: () => void; }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const bgColor = isSuccess ? 'bg-teal-500' : isError ? 'bg-red-500' : 'bg-blue-500';
  
  const Icon = isSuccess ?
    (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>) :
    isError ?
    (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>) :
    (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);


  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center p-4 rounded-lg text-white shadow-2xl animate-slide-in ${bgColor}`} dir="rtl">
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        [dir="rtl"] .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
      `}</style>
      <div className="w-6 h-6 ml-3 shrink-0">{Icon}</div>
      <span>{message}</span>
      <button onClick={onClose} className="mr-4 text-white/80 hover:text-white text-2xl leading-none font-bold">&times;</button>
    </div>
  );
};


export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
  }, []);

  const handleClose = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && <NotificationPopup message={notification.message} type={notification.type} onClose={handleClose} />}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
