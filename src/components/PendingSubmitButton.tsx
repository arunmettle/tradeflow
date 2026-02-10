"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";

type PendingSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className?: string;
  style?: React.CSSProperties;
  showSpinner?: boolean;
};

export function PendingSubmitButton({
  label,
  pendingLabel,
  className,
  style,
  showSpinner = true,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const clickedRef = useRef(false);
  // Reset click-guard when the form is idle again (after submit completes/errors).
  useEffect(() => {
    if (!pending) clickedRef.current = false;
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={style}
      aria-busy={pending}
      aria-live="polite"
      onClick={(e) => {
        // Prevent double-click submits before `pending` flips true.
        if (pending || clickedRef.current) {
          e.preventDefault();
          return;
        }
        clickedRef.current = true;
      }}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && showSpinner ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
        ) : null}
        <span>{pending ? pendingLabel : label}</span>
      </span>
    </button>
  );
}
