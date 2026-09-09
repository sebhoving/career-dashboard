"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "info" | "warn" | "good";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
  /** Milliseconds. Pass 0 to require a manual dismiss. */
  duration?: number;
}

interface ToastApi {
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const TONE_BAR: Record<ToastTone, string> = {
  info: "bg-signal",
  warn: "bg-warn",
  good: "bg-good",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      const duration = toast.duration ?? 6000;
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const api = React.useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-80"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-toast-in overflow-hidden rounded border border-line bg-surface"
          >
            <span aria-hidden className={cn("w-1 shrink-0", TONE_BAR[toast.tone])} />
            <div className="flex-1 px-3 py-2.5">
              <p className="text-sm font-medium leading-snug text-ink">{toast.title}</p>
              {toast.body ? <p className="mt-0.5 text-micro text-muted">{toast.body}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={`Dismiss: ${toast.title}`}
              className="px-2 text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
