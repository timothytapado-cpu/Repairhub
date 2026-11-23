"use client";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button for forms that run a server action. While the action runs it shows a spinner and
 * "Working…", and every button in the form is disabled so nothing is sent twice.
 */
export function SubmitButton({ children, pendingText = "Working…", className = "btn-primary", onClick, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    if (!pending) setClicked(false);
  }, [pending]);
  return (
    <button
      {...rest}
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending && clicked}
      onClick={(e) => {
        setClicked(true);
        onClick?.(e);
      }}
      className={className}
    >
      {pending && clicked ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
