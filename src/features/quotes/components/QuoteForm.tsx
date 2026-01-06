"use client";

import { useState } from "react";
import { QuoteLineEditor } from "./QuoteLineEditor";
import { QuoteCreateInput } from "@/core/quotes/quoteSchemas";

type QuoteFormProps = {
  initial?: QuoteCreateInput;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

export function QuoteForm({ initial, action, submitLabel }: QuoteFormProps) {
  const [includeGst, setIncludeGst] = useState<boolean>(initial?.includeGst ?? true);
  const [scopeText, setScopeText] = useState<string>(
    (initial?.scopeBullets ?? []).join("\n")
  );
  const [exclusionsText, setExclusionsText] = useState<string>(
    (initial?.exclusions ?? []).join("\n")
  );

  const scopeBullets = scopeText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const exclusions = exclusionsText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800">Customer name</label>
          <input
            name="customerName"
            defaultValue={initial?.customerName}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="Customer name"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Customer email</label>
            <input
              name="customerEmail"
              type="email"
              defaultValue={initial?.customerEmail ?? ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="name@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Site address</label>
            <input
              name="siteAddress"
              defaultValue={initial?.siteAddress ?? ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="Address"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800">Job description</label>
          <textarea
            name="jobDescriptionRaw"
            defaultValue={initial?.jobDescriptionRaw}
            required
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="What is the job about?"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Trade</label>
            <input
              name="trade"
              defaultValue={initial?.trade}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="Trade"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Job type</label>
            <input
              name="jobType"
              defaultValue={initial?.jobType}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="Job type"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="includeGst"
            checked={includeGst}
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
            onChange={(e) => setIncludeGst(e.target.checked)}
          />
          <label className="text-sm font-medium text-gray-800">Include GST (10%)</label>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">Deposit %</label>
            <input
              type="number"
              name="depositPercent"
              min="0"
              max="100"
              defaultValue={initial?.terms?.depositPercent ?? 50}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">Validity (days)</label>
            <input
              type="number"
              name="validityDays"
              min="1"
              defaultValue={initial?.terms?.validityDays ?? 14}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">Terms notes</label>
            <input
              name="termsNotes"
              defaultValue={initial?.terms?.notes ?? ""}
              placeholder="Optional notes"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-800">Scope</label>
            <span className="text-xs text-gray-500">One bullet per line</span>
          </div>
          <textarea
            name="scopeText"
            rows={5}
            value={scopeText}
            onChange={(e) => setScopeText(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="- Demo scope line"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-800">Exclusions</label>
            <span className="text-xs text-gray-500">One bullet per line</span>
          </div>
          <textarea
            name="exclusionsText"
            rows={5}
            value={exclusionsText}
            onChange={(e) => setExclusionsText(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="- Demo exclusion line"
          />
        </div>
      </div>

      <QuoteLineEditor initialLines={initial?.lines} includeGst={includeGst} />

      <input
        type="hidden"
        name="scopeBullets"
        value={JSON.stringify(scopeBullets)}
      />
      <input
        type="hidden"
        name="exclusions"
        value={JSON.stringify(exclusions)}
      />

      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
