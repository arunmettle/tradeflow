"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { deleteLeadActionAsync } from "@/features/leads/actions/leadActions";

type Props = {
  leadId: string;
  triggerLabel?: string;
  triggerClassName?: string;
  confirmLabel?: string;
  description?: string;
};

export function DeleteLeadButton({
  leadId,
  triggerLabel = "Delete",
  triggerClassName = "text-sm font-semibold text-red-600 hover:text-red-700",
  confirmLabel = "Delete lead",
  description = "This removes the lead from your list. Any existing quotes will be kept.",
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
                Delete lead?
              </div>
              <div className="mt-1 text-sm text-slate-600">{description}</div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <form action={deleteLeadActionAsync} className="w-full sm:w-auto">
                <input type="hidden" name="leadId" value={leadId} />
                <PendingSubmitButton
                  label={confirmLabel}
                  pendingLabel="Deleting..."
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

