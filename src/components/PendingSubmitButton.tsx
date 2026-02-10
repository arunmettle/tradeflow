"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";

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
  const [locked, setLocked] = useState(false);
  const clickedRef = useRef(false);
  const disabled = pending || locked;

  // If the server action errors and the form becomes idle again, re-enable.
  useEffect(() => {
    if (!pending) {
      setLocked(false);
      clickedRef.current = false;
    }
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={disabled}
      className={className}
      style={style}
      aria-busy={disabled}
      aria-live="polite"
      onClick={(e) => {
        // Prevent double-submits, but don't block the initial submit.
        if (clickedRef.current) {
          e.preventDefault();
          return;
        }
        clickedRef.current = true;
        // Defer disabling until after the browser has a chance to submit.
        window.setTimeout(() => setLocked(true), 0);
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
