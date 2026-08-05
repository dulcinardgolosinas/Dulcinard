import { forwardRef, useState } from "react";

export const Input = forwardRef(function Input({ label, error, className = "", ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-300 ${
          error ? "border-red-400 focus:border-red-500" : "border-ink-200 focus:border-brand-500"
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const PasswordInput = forwardRef(function PasswordInput({ label, error, className = "", ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm outline-none transition-colors placeholder:text-ink-300 ${
            error ? "border-red-400 focus:border-red-500" : "border-ink-200 focus:border-brand-500"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-400 hover:text-ink-700"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {visible ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.4 5.3A9.9 9.9 0 0 1 12 5c5 0 9 4 10 7-.32.9-.86 1.86-1.6 2.76M6.6 6.6C4.6 8 3.2 9.9 2 12c1 3 5 7 10 7 1.2 0 2.3-.22 3.35-.6" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ label, error, className = "", children, ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <select
        ref={ref}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors ${
          error ? "border-red-400" : "border-ink-200 focus:border-brand-500"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className = "", ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <textarea
        ref={ref}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-300 ${
          error ? "border-red-400" : "border-ink-200 focus:border-brand-500"
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});
