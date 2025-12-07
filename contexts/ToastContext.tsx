
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ICONS } from '../constants';

interface ToastMessage {
  message: string;
  type: 'success' | 'alert';
}

interface ToastContextType {
  notify: (message: string, type?: 'success' | 'alert') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'alert' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-bold animate-fade-in-up z-[9999] flex items-center gap-2 ${toast.type === 'alert' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'alert' ? <ICONS.Alert size={20} /> : <ICONS.CheckCircle size={20} />}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
