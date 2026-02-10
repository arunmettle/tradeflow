"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deleteQuoteActionAsync } from "@/features/quotes/actions/quoteActions";

type Props = {
  quoteId: string;
  label?: string;
  className?: string;
};

export function DeleteQuoteButton({ quoteId, label = "Delete", className }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await deleteQuoteActionAsync(quoteId);
    });
  };

  return (
    <>
      <button
        type="button"
        className={className ?? "font-semibold text-red-600 hover:underline text-sm"}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {pending ? "Deleting..." : label}
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Delete quote?</h3>
              <p className="mt-2 text-sm text-gray-600">
                This action cannot be undone. The quote and its line items will be removed.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                  onClick={handleConfirm}
                  disabled={pending}
                >
                  {pending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
