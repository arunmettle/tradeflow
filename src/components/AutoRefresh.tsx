"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  intervalMs?: number;
  enabled?: boolean;
};

export function AutoRefresh({ intervalMs = 6000, enabled = true }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      // Avoid interrupting server actions (e.g. Save/Send) which can leave UI
      // stuck in a pending state if a refresh races the submission.
      if (document.querySelector('[aria-busy="true"]')) return;
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, router]);

  return null;
}
