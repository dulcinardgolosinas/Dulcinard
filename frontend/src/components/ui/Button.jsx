const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  accent: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  outline: "border border-ink-200 text-ink-800 hover:border-brand-400 hover:text-brand-600 bg-white",
  ghost: "text-ink-700 hover:bg-ink-100",
  danger: "bg-danger-600 text-white hover:bg-danger-700"
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base"
};

export function Button({ variant = "primary", size = "md", className = "", as: As = "button", ...props }) {
  return (
    <As
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
