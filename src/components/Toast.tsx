'use client';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
type ToastCtx = { toast: (msg: string, type?: 'success' | 'error' | 'info') => void };
const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

let nextId = 0;
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'error') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white max-w-sm animate-slide-up ${t.type === 'success' ? 'bg-red-600' : t.type === 'info' ? 'bg-blue-600' : 'bg-red-600'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
