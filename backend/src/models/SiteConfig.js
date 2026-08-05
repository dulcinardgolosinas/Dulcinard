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
    brandName: { type: String, default: "Dulci-Nard Tucumán" },
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
      default: "¡Hola! Quiero hacer un pedido a Dulci-Nard."
    },
    pedidosYaUrl: { type: String, default: "" },

    // Configurable desde el admin porque estos montos cambian seguido
    minPurchaseAmount: { type: Number, default: 500 },
    defaultShippingCost: { type: Number, default: 80 },
    freeShippingFrom: { type: Number, default: 0 }, // 0 = deshabilitado
    deliveryEtaHours: { type: Number, default: 24 },

    branches: { type: [branchSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("SiteConfig", siteConfigSchema);
