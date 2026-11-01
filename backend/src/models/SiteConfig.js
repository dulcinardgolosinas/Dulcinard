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

// Textos editables de la tienda (SiteConfig.content) y su largo máximo. "" =
// se usa el texto por defecto (definido en frontend/src/lib/siteContent.js).
export const CONTENT_FIELDS = {
  homeTagline: 80,
  homeSubtitle: 300,
  aboutIntro: 500,
  aboutStoryTitle: 120,
  aboutStory: 3000,
  aboutQuote: 300,
  aboutQuoteNote: 200,
  value1Title: 40,
  value1Text: 200,
  value2Title: 40,
  value2Text: 200,
  value3Title: 40,
  value3Text: 200,
  contactTitle: 80,
  contactText: 400,
  footerText: 300
};

const siteConfigSchema = new mongoose.Schema(
  {
    // Singleton: siempre habrá un único documento de configuración
    brandName: { type: String, default: "Dulcinard Tucumán" },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    favicon: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    instagram: { type: String, default: "https://instagram.com/dulcinard_golosinas" },
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

    // Datos que ve el cliente cuando elige pagar por transferencia. Sin alias
    // ni CBU, la transferencia no se ofrece en el checkout.
    // Textos editables desde el panel ("Textos de la tienda"). Vacío = se usa
    // el texto por defecto del frontend (frontend/src/lib/siteContent.js).
    content: Object.fromEntries(Object.keys(CONTENT_FIELDS).map((key) => [key, { type: String, default: "" }])),

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
