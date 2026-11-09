import { transporter, mailerConfigured } from "../config/mailer.js";
import SiteConfig from "../models/SiteConfig.js";

const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || "dulcinardgolosinas@gmail.com";

// Los clientes de mail no soportan variables CSS: se usa el color primario
// elegido en el admin (SiteConfig.theme.primary) o estos valores por defecto,
// que replican --color-brand-600 y --color-ink-50 de frontend/src/index.css.
const DEFAULT_BRAND_COLOR = "#c80219";
const MUTED_BG = "#f6f5f5";

const PAYMENT_METHOD_LABELS = {
  mercado_pago: "Mercado Pago",
  efectivo: "Efectivo",
  transferencia: "Transferencia bancaria"
};

// Qué tiene que hacer el dueño con un pedido nuevo, según cómo paga el cliente.
const NEW_ORDER_NEXT_STEP = {
  efectivo: "Coordiná el cobro con el cliente y marcá el pedido como pagado desde el panel.",
  transferencia: "Esperá el comprobante de la transferencia y marcá el pedido como pagado desde el panel."
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

function infoRow(label, value) {
  return `<tr><td style="padding:3px 0;color:#6b6b6b;width:150px;vertical-align:top">${label}</td><td style="padding:3px 0;color:#1a1a1a">${value}</td></tr>`;
}

function section(title, brandColor, content) {
  return `
    <h3 style="margin:24px 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:${brandColor}">${title}</h3>
    ${content}`;
}

function buildEmailHtml(order, user, { isNew = false, brandColor = DEFAULT_BRAND_COLOR } = {}) {
  const title = isNew ? "Nuevo pedido" : "Pago confirmado";
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
  const paid = order.paymentStatus === "aprobado";
  const nextStep = isNew ? NEW_ORDER_NEXT_STEP[order.paymentMethod] : "El stock ya se descontó. Podés preparar el pedido.";
  const address = order.shippingAddress || {};

  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(i.name)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatCurrency(i.unitPrice)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatCurrency(i.subtotal)}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="background:${MUTED_BG};padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
      <div style="background:${brandColor};color:#ffffff;padding:20px 24px">
        <div style="font-size:12px;letter-spacing:.2em;font-weight:bold">DULCINARD</div>
        <div style="font-size:22px;font-weight:bold;margin-top:4px">${title} #${orderCode(order)}</div>
        <div style="font-size:13px;opacity:.9;margin-top:4px">${new Date(order.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</div>
      </div>
      <div style="padding:8px 24px 24px">
        ${section(
          "Cliente",
          brandColor,
          `<table style="width:100%;border-collapse:collapse;font-size:14px">
            ${infoRow("Nombre", escapeHtml(user.name))}
            ${user.businessName ? infoRow("Negocio", escapeHtml(user.businessName)) : ""}
            ${infoRow("Email", escapeHtml(user.email))}
            ${infoRow("Teléfono", escapeHtml(address.phone || user.phone || "-"))}
          </table>`
        )}
        ${section(
          "Entrega",
          brandColor,
          `<table style="width:100%;border-collapse:collapse;font-size:14px">
            ${infoRow("Dirección", `${escapeHtml(address.street || "-")}, ${escapeHtml(address.city || "-")}`)}
            ${address.zone?.name ? infoRow("Zona de envío", escapeHtml(address.zone.name)) : ""}
            ${address.notes ? infoRow("Notas", escapeHtml(address.notes)) : ""}
          </table>`
        )}
        ${section(
          "Productos",
          brandColor,
          `<table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:${MUTED_BG}">
                <th style="padding:10px;text-align:left">Producto</th>
                <th style="padding:10px">Cant.</th>
                <th style="padding:10px;text-align:right">Precio</th>
                <th style="padding:10px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px">
            ${infoRow("Productos", formatCurrency(order.itemsTotal))}
            ${infoRow("Envío", order.shippingCost ? formatCurrency(order.shippingCost) : "Gratis")}
            <tr><td style="padding:8px 0 0;font-size:18px;font-weight:bold">Total</td><td style="padding:8px 0 0;font-size:18px;font-weight:bold;color:${brandColor}">${formatCurrency(order.total)}</td></tr>
          </table>`
        )}
        ${section(
          "Pago",
          brandColor,
          `<table style="width:100%;border-collapse:collapse;font-size:14px">
            ${infoRow("Método", paymentLabel)}
            ${infoRow("Estado", paid ? "Pagado" : "Pendiente de pago")}
          </table>`
        )}
        ${nextStep ? `<p style="margin:20px 0 0;padding:12px 14px;border-left:4px solid ${brandColor};background:${MUTED_BG};font-size:14px">${nextStep}</p>` : ""}
      </div>
    </div>
  </div>`;
}

// Envía la notificación al dueño y nunca lanza: un fallo de mail no debe
// romper el pedido. isNew = pedido recién hecho (todavía sin pagar); si no,
// es el aviso de que el pago se confirmó.
export async function sendOrderNotification(order, user, options = {}) {
  if (!mailerConfigured) {
    console.warn("[mailer] SMTP no configurado, se omite la notificación de pedido");
    return;
  }
  try {
    const config = await SiteConfig.findOne().select("theme").lean();
    const brandColor = config?.theme?.primary || DEFAULT_BRAND_COLOR;
    const prefix = options.isNew ? `Nuevo pedido (${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod})` : "Pago confirmado";
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Dulcinard" <${process.env.SMTP_USER}>`,
      to: OWNER_EMAIL,
      // "Responder" en el mail le escribe directo al cliente que hizo el pedido.
      replyTo: user?.email || undefined,
      subject: `${prefix} #${orderCode(order)} - ${formatCurrency(order.total)}`,
      html: buildEmailHtml(order, user, { ...options, brandColor })
    });
  } catch (err) {
    console.error("[mailer] No se pudo enviar la notificación de pedido:", err.message);
  }
}
