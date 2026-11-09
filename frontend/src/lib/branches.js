// Link de Google Maps de una sucursal: el que se cargó en el panel o, si no hay,
// uno armado con la dirección (así todas tienen "Cómo llegar").
export function branchMapUrl(branch) {
  if (branch?.mapUrl) return branch.mapUrl;
  if (!branch?.address) return null;
  // "S.M.T." se escribe completo para que Google Maps la encuentre bien, y se
  // agrega la provincia si la dirección no la tiene.
  let place = branch.address.replace(/\bS\.?\s?M\.?\s?T\.?/i, "San Miguel de Tucumán");
  if (!/tucum[aá]n/i.test(place)) place += ", Tucumán";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Argentina`)}`;
}
