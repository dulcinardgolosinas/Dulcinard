import { useState } from "react";

// Piezas de la vista previa de las cargas por Excel (planilla de productos y entregados).

/** Tarjeta con un número del resumen ("Se actualizan: 12"). */
export function SummaryCard({ label, value, tone }) {
  const tones = {
    neutral: "border-ink-100 bg-white text-ink-900",
    good: "border-brand-200 bg-brand-50 text-brand-600",
    bad: "border-danger-200 bg-danger-50 text-danger-800"
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

/** Lista que se despliega con "Ver lista" (ej: filas con errores). */
export function CollapsibleList({ title, count, tone = "neutral", children }) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  const tones = { neutral: "text-ink-800", bad: "text-danger-700" };
  return (
    <div className="mt-4 rounded-2xl border border-ink-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold ${tones[tone]}`}
      >
        {title} ({count})
        <span className="text-xs font-semibold text-brand-600">{open ? "Ocultar" : "Ver lista"}</span>
      </button>
      {open && <div className="max-h-80 overflow-y-auto border-t border-ink-50">{children}</div>}
    </div>
  );
}
