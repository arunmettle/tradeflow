"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./ToastProvider";

function removeKeysFromQueryString(query: string, keys: string[]) {
  const params = new URLSearchParams(query);
  for (const key of keys) params.delete(key);
  const next = params.toString();
  return next.length > 0 ? `?${next}` : "";
}

export function ToastListener() {
  const { pushToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastHandledRef = useRef<string>("");

  useEffect(() => {
    const query = searchParams.toString();
    const signature = `${pathname}?${query}`;
    if (signature === lastHandledRef.current) return;
    lastHandledRef.current = signature;

    const toastKey = searchParams.get("toast");
    const saved = searchParams.get("saved");
    const created = searchParams.get("created");
    const deleted = searchParams.get("deleted");
    const error = searchParams.get("error");

    if (!toastKey && !saved && !created && !deleted && !error) return;

    if (error) {
      pushToast({ title: "Something went wrong", description: error, variant: "error" });
    } else if (toastKey === "profile_saved") {
      pushToast({ title: "Profile saved", variant: "success" });
    } else if (toastKey === "quote_link_ready") {
      pushToast({ title: "Share link ready", variant: "success" });
    } else if (toastKey === "message_sent") {
      pushToast({ title: "Message sent", variant: "success" });
    } else if (saved === "1") {
      pushToast({ title: "Saved", variant: "success" });
    } else if (created === "1") {
      pushToast({ title: "Created", variant: "success" });
    } else if (deleted === "1") {
      pushToast({ title: "Deleted", variant: "success" });
    } else {
      // fallback
      pushToast({ title: "Done", variant: "success" });
    }

    const cleaned = removeKeysFromQueryString(query, ["toast", "saved", "created", "deleted", "error"]);
    router.replace(`${pathname}${cleaned}`, { scroll: false });
  }, [pathname, pushToast, router, searchParams]);

  return null;
}

