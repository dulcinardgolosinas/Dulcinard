const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

export const UNIT_LABELS = {
  unidad: "Unidad",
  caja: "Caja",
  display: "Display",
  bolsa: "Bolsa",
  pack: "Pack"
};
