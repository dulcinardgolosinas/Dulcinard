const styles = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-100 text-brand-700",
  accent: "bg-accent-100 text-accent-800",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700"
};

export function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]} ${className}`}>
      {children}
    </span>
  );
}

export const ORDER_STATUS_LABELS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado"
};

export const ORDER_STATUS_TONES = {
  pendiente: "warning",
  confirmado: "brand",
  en_preparacion: "accent",
  enviado: "brand",
  entregado: "success",
  cancelado: "danger"
};
