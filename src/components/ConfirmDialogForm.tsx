"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

type FormAction = ((formData: FormData) => void | Promise<void>) | string;

type Props = {
  action: FormAction;
  title: string;
  description?: string;
  triggerLabel: string;
  triggerClassName?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  cancelLabel?: string;
};

export function ConfirmDialogForm({
  action,
  title,
  description,
  triggerLabel,
  triggerClassName,
  confirmLabel = "Confirm",
  confirmClassName = "bg-red-600 hover:bg-red-700 text-white",
  cancelLabel = "Cancel",
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="p-4">
              <div id={titleId} className="text-sm font-semibold text-slate-900">
                {title}
              </div>
              {description ? (
                <div className="mt-1 text-sm text-slate-600">{description}</div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                onClick={() => setOpen(false)}
              >
                {cancelLabel}
              </button>

              <form action={action} className="w-full sm:w-auto">
                <PendingSubmitButton
                  label={confirmLabel}
                  pendingLabel="Working..."
                  className={`w-full rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-60 sm:w-auto ${confirmClassName}`}
                />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

