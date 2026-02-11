"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";

type ExportPdfButtonProps = {
  quoteId: string;
  label?: string;
  className?: string;
};

function extractFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const simpleMatch = disposition.match(/filename="([^"]+)"/i);
  if (simpleMatch?.[1]) return simpleMatch[1];
  return null;
}

export function ExportPdfButton({
  quoteId,
  label = "Export PDF",
  className,
}: ExportPdfButtonProps) {
  const { pushToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const href = useMemo(() => `/quotes/${quoteId}/pdf`, [quoteId]);

  const handleClickAsync = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(href, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`PDF export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        extractFilenameFromDisposition(response.headers.get("content-disposition")) ??
        `quote-${quoteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not export PDF";
      pushToast({
        title: "PDF export failed",
        description: message,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClickAsync}
        disabled={isLoading}
        aria-busy={isLoading}
        className={
          className ??
          "rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
        }
      >
        {isLoading ? "Preparing PDF..." : label}
      </button>

      {isLoading ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Preparing PDF</p>
                <p className="text-xs text-slate-600">
                  Please wait while we generate your quote document.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
