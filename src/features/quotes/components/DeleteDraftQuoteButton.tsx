"use client";

import { useState } from "react";
import { deleteDraftQuoteActionAsync } from "@/features/quotes/actions/quoteActions";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

type DeleteDraftQuoteButtonProps = {
  quoteId: string;
  returnTo?: string;
  className?: string;
};

export function DeleteDraftQuoteButton({
  quoteId,
  returnTo = "/quotes",
  className,
}: DeleteDraftQuoteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
        }
      >
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-quote-title-${quoteId}`}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id={`delete-quote-title-${quoteId}`}
              className="text-base font-semibold text-slate-900"
            >
              Delete draft quote?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes the draft quote permanently. This action cannot be undone.
            </p>

            <form action={deleteDraftQuoteActionAsync} className="mt-4 flex justify-end gap-2">
              <input type="hidden" name="quoteId" value={quoteId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <PendingSubmitButton
                label="Delete"
                pendingLabel="Deleting..."
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
