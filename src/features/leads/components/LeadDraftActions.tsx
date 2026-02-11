"use client";

import { useState } from "react";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import {
  generateDraftQuoteActionAsync,
  regenerateDraftQuoteActionAsync,
} from "@/features/leads/actions/quoteDraftActions";

type LeadDraftActionsProps = {
  leadId: string;
  hasQuote?: boolean;
};

export function LeadDraftActions({ leadId, hasQuote }: LeadDraftActionsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!hasQuote) {
    return (
      <form action={generateDraftQuoteActionAsync.bind(null, leadId)}>
        <PendingSubmitButton
          label="Generate draft quote"
          pendingLabel="Generating..."
          className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-100 disabled:opacity-70"
        />
      </form>
    );
  }

  return (
    <>
      <form action={regenerateDraftQuoteActionAsync.bind(null, leadId)} className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowConfirmDialog(true)}
          className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100"
        >
          Regenerate
        </button>

        {showConfirmDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`regen-title-${leadId}`}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id={`regen-title-${leadId}`} className="text-base font-semibold text-slate-900">
                Regenerate draft quote?
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                This generates a fresh draft quote from the lead details.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <PendingSubmitButton
                  label="Regenerate"
                  pendingLabel="Regenerating..."
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
}
