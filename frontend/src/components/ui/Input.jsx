import { forwardRef } from "react";

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
