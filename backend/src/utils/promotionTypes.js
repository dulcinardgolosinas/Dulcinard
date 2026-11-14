// Tipos de promoción. Hoy hay uno solo: porcentaje de descuento. Para sumar
// otro más adelante: agregarlo acá (etiqueta y cómo calcula el beneficio), en
// frontend/src/lib/promotionTypes.js y, si necesita un valor propio, en el modelo.
//
// Cada tipo sabe:
//   label(promo)                       -> etiqueta corta para el badge ("-20%")
//   lineDiscount(promo, product, qty)  -> cuántos $ se descuentan en una línea del pedido
//   unitPrice(promo, product)          -> precio por unidad con la promo
// Todo se calcula en el servidor: nunca se usa el precio que manda el navegador.

const round2 = (n) => Math.round(n * 100) / 100;
const idOf = (value) => String(value?._id ?? value ?? "");

export const PROMO_TYPES = {
  percent: {
    // Sin porcentaje (promos viejas que solo mostraban un precio en el cartel): sin etiqueta.
    label: (p) => (p.discountPercent > 0 ? `-${p.discountPercent}%` : ""),
    unitPrice: (p, product) => round2(product.price * (1 - (p.discountPercent || 0) / 100)),
    lineDiscount: (p, product, qty) => round2(product.price * qty * ((p.discountPercent || 0) / 100))
  }
};
export const PROMO_TYPE_KEYS = Object.keys(PROMO_TYPES);

// Ocasión: promoción común o fecha especial.
export const OCCASIONS = {
  general: "",
  navidad: "Navidad",
  dia_del_nino: "Día del Niño",
  dia_de_la_madre: "Día de la Madre",
  pascuas: "Pascuas",
  halloween: "Halloween",
  black_friday: "Black Friday",
  hot_sale: "Hot Sale",
  otra: "" // usa occasionName
};
export const OCCASION_KEYS = Object.keys(OCCASIONS);

export const PROMO_SCOPES = ["all", "categories", "products"];

/** Alcance de la promo (las promos viejas no lo tienen guardado: se deduce). */
export function scopeOf(promo) {
  if (PROMO_SCOPES.includes(promo.scope)) return promo.scope;
  if (promo.products?.length) return "products";
  if (promo.categories?.length) return "categories";
  return "none"; // promos viejas sin productos ni categorías: solo informativas
}

/** ¿La promo alcanza a este producto? */
export function promoAppliesTo(promo, product) {
  const scope = scopeOf(promo);
  if (scope === "all") return true;
  if (scope === "products") return promo.products?.some((id) => idOf(id) === idOf(product)) ?? false;
  if (scope === "categories") return promo.categories?.some((id) => idOf(id) === idOf(product.category)) ?? false;
  return false;
}

export function promoLabel(promo) {
  return (PROMO_TYPES[promo.type] || PROMO_TYPES.percent).label(promo) || "";
}

export function occasionLabel(promo) {
  if (!promo.occasion || promo.occasion === "general") return "";
  return promo.occasion === "otra" ? promo.occasionName || "" : OCCASIONS[promo.occasion] || "";
}
