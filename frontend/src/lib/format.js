// Montos enteros sin decimales ($ 3.200); con centavos, siempre 2 ($ 1.428,30).
const wholeFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const centsFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });

export function formatCurrency(value) {
  const amount = Math.round((Number(value) || 0) * 100) / 100;
  return (Number.isInteger(amount) ? wholeFormatter : centsFormatter).format(amount);
}

export const UNIT_LABELS = {
  unidad: "Unidad",
  caja: "Caja",
  display: "Display",
  bolsa: "Bolsa",
  pack: "Pack"
};

export const PAYMENT_METHOD_LABELS = {
  mercado_pago: "Mercado Pago",
  efectivo: "Efectivo",
  transferencia: "Transferencia"
};

export const PAYMENT_STATUS_LABELS = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado"
};

export const PAYMENT_STATUS_TONES = {
  pendiente: "warning",
  aprobado: "success",
  rechazado: "danger"
};

// Estados en los que el pedido ya tiene el stock descontado (mismo criterio que
// STOCK_HOLDING_STATUSES del backend): requieren el pago confirmado.
export const CONFIRMED_ORDER_STATUSES = ["confirmado", "en_preparacion", "enviado", "entregado"];

// Mismo criterio que el backend: stock en o por debajo del mínimo.
export function needsRestock(product) {
  return product.stock <= (product.minStock ?? 0);
}

// Precio que se cobra (con la promo vigente, calculada por el backend).
export function finalPriceOf(product) {
  return product.finalPrice ?? product.price;
}
