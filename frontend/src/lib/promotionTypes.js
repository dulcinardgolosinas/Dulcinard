// Promociones: un porcentaje de descuento, para una fecha especial (Navidad,
// Día del Niño...) o común. Mismos valores que backend/src/utils/promotionTypes.js.

export const OCCASIONS = {
  general: "Promoción común",
  navidad: "Navidad",
  dia_del_nino: "Día del Niño",
  dia_de_la_madre: "Día de la Madre",
  pascuas: "Pascuas",
  halloween: "Halloween",
  black_friday: "Black Friday",
  hot_sale: "Hot Sale",
  otra: "Otra fecha especial"
};

export const SCOPES = {
  all: "Toda la tienda",
  categories: "Algunas categorías",
  products: "Algunos productos"
};

// Para filtrar: fechas especiales o promociones comunes.
export const PROMO_KINDS = [
  { value: "special", label: "Fechas especiales" },
  { value: "general", label: "Promociones" }
];
export const promoKind = (promo) => (promo?.occasion && promo.occasion !== "general" ? "special" : "general");

/** Etiqueta corta del badge: "-20%". */
export function promoLabel(promo) {
  if (!promo) return "";
  if (promo.label !== undefined) return promo.label;
  return promo.discountPercent > 0 ? `-${promo.discountPercent}%` : "";
}

/** Nombre de la fecha especial ("Navidad"), o "" si es una promoción común. */
export function occasionLabel(promo) {
  if (!promo) return "";
  if (promo.occasionLabel !== undefined) return promo.occasionLabel;
  if (!promo.occasion || promo.occasion === "general") return "";
  return promo.occasion === "otra" ? promo.occasionName || "" : OCCASIONS[promo.occasion] || "";
}
