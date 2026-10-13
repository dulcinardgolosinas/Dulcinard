import Promotion from "../models/Promotion.js";

// Precio final de los productos según las promociones vigentes. Se calcula
// siempre en el servidor: el carrito y el pedido usan este valor, nunca el
// precio que mande el navegador.
//
// Regla: una promoción activa y dentro de sus fechas aplica a los productos
// que lista y a los de sus categorías. Si a un producto le tocan varias, se
// usa el mayor descuento (no se acumulan). Una promo sin productos ni
// categorías es solo informativa (banner) y no descuenta nada.

export async function getActivePromotions() {
  const now = new Date();
  return Promotion.find({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    discountPercent: { $gt: 0 }
  })
    .select("discountPercent products categories")
    .lean();
}

const idOf = (value) => String(value?._id ?? value ?? "");

/** Mayor descuento (%) que corresponde al producto entre las promociones dadas. */
export function discountFor(product, promotions) {
  const productId = idOf(product);
  const categoryId = idOf(product.category);
  let best = 0;
  for (const promo of promotions) {
    const applies =
      promo.products?.some((id) => idOf(id) === productId) || promo.categories?.some((id) => idOf(id) === categoryId);
    if (applies && promo.discountPercent > best) best = promo.discountPercent;
  }
  return Math.min(100, best);
}

export function discountedPrice(price, discountPercent) {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

/**
 * Producto listo para responder: el `price` de lista queda igual (es lo que
 * edita el admin) y se agregan `discountPercent` y `finalPrice`.
 */
export function withPricing(product, promotions) {
  const json = typeof product.toJSON === "function" ? product.toJSON() : product;
  const discountPercent = discountFor(product, promotions);
  return { ...json, discountPercent, finalPrice: discountedPrice(product.price, discountPercent) };
}
