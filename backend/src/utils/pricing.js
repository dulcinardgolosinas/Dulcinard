import Promotion from "../models/Promotion.js";
import { PROMO_TYPES, promoAppliesTo, promoLabel, occasionLabel } from "./promotionTypes.js";

// Precio final de los productos según las promociones vigentes. Se calcula
// siempre en el servidor: el listado, el carrito, el pedido y Mercado Pago
// usan este valor, nunca el precio que mande el navegador.
//
// Reglas:
//   - una promo vale si está publicada (no pausada) y dentro de su fecha y hora;
//   - si a un producto le tocan varias, se usa la que más le conviene al
//     cliente (no se acumulan).

const round2 = (n) => Math.round(n * 100) / 100;
const typeOf = (promo) => PROMO_TYPES[promo.type] || PROMO_TYPES.percent;

export async function getActivePromotions() {
  const now = new Date();
  return Promotion.find({ active: true, startDate: { $lte: now }, endDate: { $gte: now } })
    .select("title type discountPercent occasion occasionName scope products categories")
    .lean();
}

const summary = (promo) => ({
  _id: promo._id,
  title: promo.title,
  type: promo.type || "percent",
  label: promoLabel(promo),
  occasion: occasionLabel(promo)
});

/** Mejor promo para una línea (producto + cantidad). Devuelve { promo, discount } o null. */
export function bestPromotionFor(product, promotions, quantity = 1) {
  let best = null;
  for (const promo of promotions) {
    if (!promoAppliesTo(promo, product)) continue;
    const discount = typeOf(promo).lineDiscount(promo, product, quantity);
    if (discount > 0 && (!best || discount > best.discount)) best = { promo, discount };
  }
  return best;
}

/** Precio de una línea del pedido con la mejor promo. */
export function priceLine(product, quantity, promotions) {
  const gross = round2(product.price * quantity);
  const best = bestPromotionFor(product, promotions, quantity);
  const discount = best ? Math.min(best.discount, gross) : 0;
  return {
    listPrice: product.price,
    unitPrice: best ? typeOf(best.promo).unitPrice(best.promo, product) : product.price,
    discountPercent: best?.promo.discountPercent || 0,
    promoDiscount: discount,
    promotion: best ? summary(best.promo) : null,
    quantity,
    subtotal: round2(gross - discount)
  };
}

/**
 * Producto listo para responder: el `price` de lista queda igual (es lo que
 * edita el admin) y se agregan `finalPrice` (por unidad), `discountPercent` y
 * `promo` (la promo que le toca, para el badge).
 */
export function withPricing(product, promotions) {
  const json = typeof product.toJSON === "function" ? product.toJSON() : product;
  const best = bestPromotionFor(product, promotions, 1);
  const finalPrice = best ? typeOf(best.promo).unitPrice(best.promo, product) : product.price;
  const discountPercent = product.price > 0 && finalPrice < product.price ? Math.round((1 - finalPrice / product.price) * 100) : 0;
  return { ...json, finalPrice, discountPercent, promo: best ? summary(best.promo) : null };
}

export function discountedPrice(price, discountPercent) {
  return round2(price * (1 - discountPercent / 100));
}
