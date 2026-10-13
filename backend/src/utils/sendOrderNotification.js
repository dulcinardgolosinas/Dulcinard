import { transporter, mailerConfigured } from "../config/mailer.js";
import SiteConfig from "../models/SiteConfig.js";

const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || "marilamas02@gmail.com";

// Los clientes de mail no soportan variables CSS: se usa el color primario
// elegido en el admin (SiteConfig.theme.primary) o estos valores por defecto,
// que replican --color-brand-600 y --color-ink-50 de frontend/src/index.css.
const DEFAULT_BRAND_COLOR = "#b81830";
const MUTED_BG = "#f6f5f5";

const PAYMENT_METHOD_LABELS = {
  mercado_pago: "Mercado Pago",
  efectivo: "Efectivo",
  transferencia: "Transferencia"
};

function formatCurrency(value) {
  const amount = Math.round((Number(value) || 0) * 100) / 100;
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
}

// Los datos que carga el cliente (nombre, dirección, notas) se escapan: si no,
// alguien podría meter HTML (links, imágenes) en el mail que recibe el dueño.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function orderCode(order) {
  return order._id.toString().slice(-6).toUpperCase();
}

function buildEmailHtml(order, user, { pendingCash = false, brandColor: BRAND_COLOR = DEFAULT_BRAND_COLOR } = {}) {
  const title = pendingCash ? "Nuevo pedido en efectivo (pendiente de pago)" : "Pedido confirmado";
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(i.name)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.subtotal)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:${BRAND_COLOR}">${title} #${orderCode(order)}</h2>
      <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-AR")}</p>

      <h3 style="color:${BRAND_COLOR};margin-top:20px;margin-bottom:6px;font-size:15px">Datos del cliente</h3>
      <p style="margin:2px 0"><strong>Nombre:</strong> ${escapeHtml(user.name)}</p>
      ${user.businessName ? `<p style="margin:2px 0"><strong>Negocio:</strong> ${escapeHtml(user.businessName)}</p>` : ""}
      <p style="margin:2px 0"><strong>Email:</strong> ${escapeHtml(user.email)}</p>
      <p style="margin:2px 0"><strong>Teléfono de contacto:</strong> ${escapeHtml(order.shippingAddress?.phone || user.phone || "-")}</p>

      <h3 style="color:${BRAND_COLOR};margin-top:20px;margin-bottom:6px;font-size:15px">Entrega</h3>
      <p style="margin:2px 0"><strong>Dirección:</strong> ${escapeHtml(order.shippingAddress?.street || "-")}, ${escapeHtml(order.shippingAddress?.city || "-")}</p>
      ${order.shippingAddress?.zone?.name ? `<p style="margin:2px 0"><strong>Zona de envío:</strong> ${escapeHtml(order.shippingAddress.zone.name)}</p>` : ""}
      ${order.shippingAddress?.notes ? `<p style="margin:2px 0"><strong>Notas del cliente:</strong> ${escapeHtml(order.shippingAddress.notes)}</p>` : ""}

      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead>
          <tr style="background:${MUTED_BG}">
            <th style="padding:6px 10px;text-align:left">Producto</th>
            <th style="padding:6px 10px">Cant.</th>
            <th style="padding:6px 10px;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:12px"><strong>Envío:</strong> ${formatCurrency(order.shippingCost)}</p>
      <p style="font-size:18px"><strong>Total: ${formatCurrency(order.total)}</strong></p>
      <p><strong>Método de pago:</strong> ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</p>
      ${pendingCash ? `<p style="color:${BRAND_COLOR}"><strong>Confirmá el pago desde el panel admin cuando lo cobres.</strong></p>` : ""}
    </div>
  `;
}

function emailSubjectPrefix(order, { pendingCash = false } = {}) {
  if (pendingCash) return "Nuevo pedido en efectivo";
  if (order.paymentMethod === "efectivo") return "Pago en efectivo confirmado";
  return "Nuevo pedido";
}

// Envía la notificación al dueño y nunca lanza: un fallo de mail no debe
// romper la confirmación del pedido para el cliente.
export async function sendOrderNotification(order, user, options = {}) {
  if (!mailerConfigured) {
    console.warn("[mailer] SMTP no configurado, se omite la notificación de pedido");
    return;
  }
  try {
    const config = await SiteConfig.findOne().select("theme").lean();
    const brandColor = config?.theme?.primary || DEFAULT_BRAND_COLOR;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Dulcinard" <${process.env.SMTP_USER}>`,
      to: OWNER_EMAIL,
      subject: `${emailSubjectPrefix(order, options)} #${orderCode(order)} - ${formatCurrency(order.total)}`,
      html: buildEmailHtml(order, user, { ...options, brandColor })
    });
  } catch (err) {
    console.error("[mailer] No se pudo enviar la notificación de pedido:", err.message);
  }
}
