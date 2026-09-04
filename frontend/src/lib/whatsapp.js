import { formatCurrency, UNIT_LABELS } from "./format";

// Normaliza cualquier número (con o sin código de país/característica) al
// formato que espera wa.me para Argentina: 54 9 <código de área><número>.
function toWhatsappNumber(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  return `549${digits.slice(-10)}`;
}

function orderLabel(order) {
  return `#${order._id.slice(-6).toUpperCase()}`;
}

function itemsSummary(order) {
  return order.items.map((i) => `- ${i.name} x${i.quantity} ${UNIT_LABELS[i.unit] || i.unit}`).join("\n");
}

// Cliente -> le escribe al WhatsApp de la tienda para coordinar su propio pedido.
export function buildCustomerOrderWhatsappHref(order, storeNumber) {
  const number = toWhatsappNumber(storeNumber) || "5493814091213";
  const message = [
    `¡Hola! Quiero coordinar mi pedido ${orderLabel(order)} de Dulcinard.`,
    `Total: ${formatCurrency(order.total)}`,
    "Productos:",
    itemsSummary(order)
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Admin -> le escribe al cliente para coordinar la entrega de un pedido puntual.
// Devuelve null si el pedido no tiene ningún teléfono cargado.
export function buildAdminOrderWhatsappHref(order) {
  const phone = order.shippingAddress?.phone || order.user?.phone;
  const number = toWhatsappNumber(phone);
  if (!number) return null;

  const customerName = order.user?.name || "";
  const message = [
    `¡Hola${customerName ? ` ${customerName}` : ""}! Te escribimos de Dulcinard por tu pedido ${orderLabel(order)}.`,
    `Total: ${formatCurrency(order.total)}`,
    "Productos:",
    itemsSummary(order),
    `Entrega: ${order.shippingAddress?.street || "-"}, ${order.shippingAddress?.city || "-"}`,
    "Te escribimos para coordinar la entrega."
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
