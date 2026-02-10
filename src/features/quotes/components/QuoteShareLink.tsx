"use client";

import { useState } from "react";

type Props = {
  url: string;
};

export function QuoteShareLink({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        readOnly
        value={url}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800"
        aria-label="Share link"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
