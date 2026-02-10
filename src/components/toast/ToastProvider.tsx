"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastVariant = "success" | "info" | "error";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type Toast = ToastInput & {
  id: string;
  createdAt: number;
};

type ToastContextValue = {
  pushToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function randomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const variantStyles: Record<ToastVariant, { border: string; bg: string; title: string; icon: string }> = {
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    title: "text-emerald-900",
    icon: "bg-emerald-600",
  },
  info: {
    border: "border-slate-200",
    bg: "bg-white",
    title: "text-slate-900",
    icon: "bg-slate-900",
  },
  error: {
    border: "border-red-200",
    bg: "bg-red-50",
    title: "text-red-900",
    icon: "bg-red-600",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timeoutsRef.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (input: ToastInput) => {
      const id = randomId();
      const createdAt = Date.now();
      const variant: ToastVariant = input.variant ?? "info";
      const durationMs =
        typeof input.durationMs === "number"
          ? input.durationMs
          : variant === "error"
            ? 6000
            : 3500;

      setToasts((prev) => [{ id, createdAt, variant, ...input }, ...prev].slice(0, 3));

      const handle = window.setTimeout(() => remove(id), durationMs);
      timeoutsRef.current.set(id, handle);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast viewport */}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="fixed inset-x-0 top-3 z-50 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[420px] sm:px-0"
      >
        <div className="flex flex-col gap-2">
          {toasts.map((t) => {
            const styles = variantStyles[t.variant ?? "info"];
            return (
              <div
                key={t.id}
                role="status"
                className={`rounded-xl border ${styles.border} ${styles.bg} shadow-sm`}
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="mt-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${styles.icon}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold ${styles.title}`}>{t.title}</div>
                    {t.description ? (
                      <div className="mt-0.5 text-sm text-slate-600">{t.description}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    aria-label="Dismiss notification"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider />");
  }
  return ctx;
}

