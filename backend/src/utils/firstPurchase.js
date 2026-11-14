import Order, { STOCK_HOLDING_STATUSES } from "../models/Order.js";
import User from "../models/User.js";

// Descuento de primera compra: un % sobre los productos en el primer pedido
// de cada cliente registrado. Se acumula con las promos (es la única excepción).
//
// Le corresponde si:
//   - el beneficio está activado en el panel;
//   - el cliente inició sesión (sin cuenta no hay forma de saber si es la primera);
//   - no tiene pedidos pagados o confirmados (ni la marca firstPurchaseDiscountUsed);
//   - su teléfono no lo usó ya otra cuenta (evita abrir cuentas nuevas para repetirlo).
// La marca se pone cuando se aprueba el pago (utils/orderStock.js), no al crear
// el pedido: si el pago falla, el descuento no se pierde.

const REASONS = {
  off: "",
  guest: "Registrate y obtené {percent}% en tu primera compra",
  used: "",
  phone: ""
};

/** Devuelve { eligible, percent, reason, message }. */
export async function firstPurchaseFor(user, config) {
  const settings = config?.firstPurchaseDiscount;
  const percent = settings?.enabled === false ? 0 : Number(settings?.percent ?? 20);
  const result = (eligible, reason) => ({
    eligible,
    percent: eligible || reason === "guest" ? percent : 0,
    reason,
    message: (REASONS[reason] || "").replace("{percent}", percent)
  });

  if (!(percent > 0)) return result(false, "off");
  if (!user) return result(false, "guest");
  if (user.role === "admin") return result(false, "used");
  if (user.firstPurchaseDiscountUsed) return result(false, "used");

  const previous = await Order.exists({
    user: user._id,
    $or: [{ paymentStatus: "aprobado" }, { status: { $in: STOCK_HOLDING_STATUSES } }]
  });
  if (previous) return result(false, "used");

  const phone = String(user.phone || "").replace(/\D/g, "");
  if (phone.length >= 6) {
    const samePhoneUsed = await User.exists({ _id: { $ne: user._id }, phone: user.phone, firstPurchaseDiscountUsed: true });
    if (samePhoneUsed) return result(false, "phone");
  }
  return result(true, "eligible");
}

export function firstPurchaseAmount(itemsTotal, percent) {
  return Math.round(itemsTotal * (percent / 100) * 100) / 100;
}
