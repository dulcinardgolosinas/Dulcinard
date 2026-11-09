// Textos fijos de la tienda (inicio, Quiénes somos, Contacto y pie de página).
export const DEFAULT_CONTENT = {
  homeTagline: "Distribuidora mayorista · Tucumán",
  homeSubtitle: "Cientos de productos para kioscos y comercios de Tucumán. Pedí online y lo recibís en tu local en 24 a 48 horas.",
  aboutIntro:
    "Somos DULCI NARD: venta mayorista y minorista de golosinas y comestibles en Tucumán. Trabajamos con las marcas líderes del mercado para que tu kiosco o comercio nunca le falte variedad.",
  aboutStoryTitle: "Trayectoria y compromiso de DULCI NARD",
  aboutStory: [
    "DULCI NARD nació para estar cerca de los kiosqueros y comerciantes de Tucumán. Empezamos como distribuidores mayoristas de golosinas y comestibles, y con el tiempo fuimos creciendo hasta convertirnos en un proveedor de confianza para cientos de comercios de la provincia.",
    "Hoy contamos con sucursales en San Miguel de Tucumán, Yerba Buena y Concepción, distribuidas estratégicamente para que siempre tengas un depósito cerca, y trabajamos con las marcas más importantes del país —Arcor, Georgalos, Mondelez, Bonafide, y muchas más— para ofrecerte la variedad que tu negocio necesita, al mejor precio y con la mejor atención.",
    "Creamos esta página para achicar la distancia con nuestros clientes: para que puedas ver nuestro catálogo completo, hacer tu pedido cuando quieras y resolver tus dudas sin vueltas. Como siempre, DULCI NARD está cerca tuyo."
  ].join("\n\n"),
  aboutQuote: "Facilitarle a cada kiosco y comercio de Tucumán el acceso a golosinas y productos alimenticios al mejor precio mayorista.",
  aboutQuoteNote: "Con un proceso de pedido simple por WhatsApp o desde nuestra tienda online.",
  value1Title: "Calidad",
  value1Text: "Trabajamos con las marcas líderes del rubro golosinas y alimentos.",
  value2Title: "Cercanía",
  value2Text: "Sucursales en San Miguel de Tucumán, Yerba Buena y Concepción, para que siempre tengas una a mano.",
  value3Title: "Rapidez",
  value3Text: "Pedís hoy, lo tenés en tu local en 24 a 48 hs. Sin vueltas.",
  contactTitle: "Hablemos",
  contactText: "Hacé tu pedido por WhatsApp o acercate a cualquiera de nuestras sucursales en San Miguel de Tucumán, Yerba Buena y Concepción.",
  footerText: "Distribuidora mayorista de golosinas y productos alimenticios. Pedidos por WhatsApp con entrega en 24 a 48 hs."
};

/** Textos de la tienda. */
export function useSiteContent() {
  return DEFAULT_CONTENT;
}

/** Separa un texto largo en párrafos (una línea en blanco entre párrafo y párrafo). */
export const paragraphs = (text) =>
  String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
