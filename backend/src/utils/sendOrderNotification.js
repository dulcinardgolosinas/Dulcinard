import { transporter, mailerConfigured } from "../config/mailer.js";

const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || "marilamas02@gmail.com";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

function buildEmailHtml(order, user) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.subtotal)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#b81830">Pedido confirmado #${order._id.toString().slice(-6).toUpperCase()}</h2>
      <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-AR")}</p>

      <h3 style="color:#b81830;margin-top:20px;margin-bottom:6px;font-size:15px">Datos del cliente</h3>
      <p style="margin:2px 0"><strong>Nombre:</strong> ${user.name}</p>
      ${user.businessName ? `<p style="margin:2px 0"><strong>Negocio:</strong> ${user.businessName}</p>` : ""}
      <p style="margin:2px 0"><strong>Email:</strong> ${user.email}</p>
      <p style="margin:2px 0"><strong>Teléfono de contacto:</strong> ${order.shippingAddress?.phone || user.phone || "-"}</p>

      <h3 style="color:#b81830;margin-top:20px;margin-bottom:6px;font-size:15px">Entrega</h3>
      <p style="margin:2px 0"><strong>Dirección:</strong> ${order.shippingAddress?.street || "-"}, ${order.shippingAddress?.city || "-"}</p>
      ${order.shippingAddress?.zone?.name ? `<p style="margin:2px 0"><strong>Zona de envío:</strong> ${order.shippingAddress.zone.name}</p>` : ""}
      ${order.shippingAddress?.notes ? `<p style="margin:2px 0"><strong>Notas del cliente:</strong> ${order.shippingAddress.notes}</p>` : ""}

      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead>
          <tr style="background:#f6f5f5">
            <th style="padding:6px 10px;text-align:left">Producto</th>
            <th style="padding:6px 10px">Cant.</th>
            <th style="padding:6px 10px;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:12px"><strong>Envío:</strong> ${formatCurrency(order.shippingCost)}</p>
      <p style="font-size:18px"><strong>Total: ${formatCurrency(order.total)}</strong></p>
      <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
    </div>
  `;
}

// Envía la notificación al dueño y nunca lanza: un fallo de mail no debe
// romper la confirmación del pedido para el cliente.
export async function sendOrderNotification(order, user) {
  if (!mailerConfigured) {
    console.warn("[mailer] SMTP no configurado, se omite la notificación de pedido");
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Dulcinard" <${process.env.SMTP_USER}>`,
      to: OWNER_EMAIL,
      subject: `Nuevo pedido #${order._id.toString().slice(-6).toUpperCase()} - ${formatCurrency(order.total)}`,
      html: buildEmailHtml(order, user)
    });
  } catch (err) {
    console.error("[mailer] No se pudo enviar la notificación de pedido:", err.message);
  }
}
