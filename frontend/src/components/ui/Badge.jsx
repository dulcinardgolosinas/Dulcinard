// Paleta de marca: únicamente blanco y rojo. Los distintos "tonos" se logran
// con relleno/contorno/oscuridad, no con matices de color distintos.
const styles = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-100 text-brand-700",
  accent: "bg-white text-brand-700 border border-brand-200",
  success: "bg-brand-600 text-white",
  warning: "bg-white text-brand-700 border border-brand-300",
  danger: "bg-brand-900 text-white",
  // Alerta operativa (ej: "Reponer stock"), distinta de los estados de pedido.
  alert: "bg-danger-600 text-white"
};

export function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]} ${className}`}>
      {children}
    </span>
  );
}

export const ORDER_STATUS_LABELS = {
  pendiente: "Pendiente de pago",
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
