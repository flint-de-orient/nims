"use client";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastContextType {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-xl shadow-lg border px-4 py-3 flex items-start gap-3 animate-in slide-in-from-bottom-2"
            style={{
              backgroundColor: t.variant === "destructive" ? "#FFF1F0" : t.variant === "success" ? "#F0FDFA" : "#ffffff",
              borderColor: t.variant === "destructive" ? "#F97066" : t.variant === "success" ? "#0F766E" : "#E2E8F0",
            }}
          >
            <div className="flex-1">
              <div className="font-medium text-sm" style={{ color: "#0F172A" }}>{t.title}</div>
              {t.description && <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{t.description}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: return a no-op toast if context not available
    return {
      toast: (t: Omit<Toast, "id">) => console.log("Toast:", t.title),
      toasts: [],
      dismiss: () => {},
    };
  }
  return ctx;
}
