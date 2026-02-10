"use client";

import { ToastProvider } from "@/components/toast/ToastProvider";
import { ToastListener } from "@/components/toast/ToastListener";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ToastListener />
      {children}
    </ToastProvider>
  );
}

