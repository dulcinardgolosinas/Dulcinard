import mongoose from "mongoose";

const scheduleBlockSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // ej: "Lunes a Viernes"
    hours: { type: String, required: true } // ej: "8:30 a 21 hs"
  },
  { _id: false }
);

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // ej: "Av. Belgrano"
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    primary: { type: Boolean, default: false }, // sucursal principal, se muestra primero en el slideshow del home
    schedule: {
      weekdays: { type: scheduleBlockSchema, required: true },
      saturday: { type: scheduleBlockSchema, required: true }
    },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { _id: true, timestamps: true }
);

const siteConfigSchema = new mongoose.Schema(
  {
    // Singleton: siempre habrá un único documento de configuración
    brandName: { type: String, default: "Dulcinard Tucumán" },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    // Logo de la franja blanca de arriba del menú. Vacío = se usa el logo principal.
    secondaryLogo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    favicon: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    instagram: { type: String, default: "https://instagram.com/dulcinard_golosinas" },
    facebook: { type: String, default: "https://www.facebook.com/dulcinard/" },
    whatsappNumber: { type: String, default: "3814091213" },
    whatsappMessage: {
      type: String,
      default: "¡Hola! Quiero hacer un pedido a Dulcinard."
    },

    // Configurable desde el admin porque estos montos cambian seguido
    minPurchaseAmount: { type: Number, default: 100000 },
    defaultShippingCost: { type: Number, default: 3500 },
    freeShippingFrom: { type: Number, default: 0 }, // 0 = deshabilitado
    deliveryEtaHours: { type: Number, default: 24 },
    deliveryEtaMaxHours: { type: Number, default: 48 },

    branches: { type: [branchSchema], default: [] },

    // Cartel de promociones que se abre al entrar a la tienda (se prende y apaga desde Promociones).
    promoPopupEnabled: { type: Boolean, default: true },

    // Carrusel: segundos máximos que se muestra un video antes de pasar al siguiente
    // (si el video es más corto, pasa cuando termina).
    heroVideoMaxSeconds: { type: Number, default: 20, min: 5, max: 120 },

    // Textos editables de la tienda (Quiénes somos, Envíos y Contacto). "" = se usa
    // el texto por defecto de frontend/src/lib/siteContent.js.
    content: {
      aboutIntro: { type: String, default: "" },
      aboutStoryTitle: { type: String, default: "" },
      aboutStory: { type: String, default: "" },
      aboutQuote: { type: String, default: "" },
      aboutQuoteNote: { type: String, default: "" },
      value1Title: { type: String, default: "" },
      value1Text: { type: String, default: "" },
      value2Title: { type: String, default: "" },
      value2Text: { type: String, default: "" },
      value3Title: { type: String, default: "" },
      value3Text: { type: String, default: "" },
      shippingIntro: { type: String, default: "" },
      shippingInfo: { type: String, default: "" },
      contactTitle: { type: String, default: "" },
      contactText: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
      contactEmail: { type: String, default: "" },
      contactHours: { type: String, default: "" }
    },

    // Descuento automático en la primera compra de cada cliente registrado.
    firstPurchaseDiscount: {
      enabled: { type: Boolean, default: true },
      percent: { type: Number, default: 20, min: 1, max: 90 }
    },

    // Datos que ve el cliente cuando elige pagar por transferencia. Sin alias
    // ni CBU, la transferencia no se ofrece en el checkout.
    bankTransfer: {
      alias: { type: String, default: "" },
      cbu: { type: String, default: "" },
      holder: { type: String, default: "" },
      bankName: { type: String, default: "" }
    },

    // Paleta editable desde el admin (hex "#rrggbb"). Vacío = se usa el color
    // por defecto definido en frontend/src/index.css.
    theme: {
      primary: { type: String, default: "" },
      secondary: { type: String, default: "" },
      accent: { type: String, default: "" },
      background: { type: String, default: "" },
      text: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

export default mongoose.model("SiteConfig", siteConfigSchema);
