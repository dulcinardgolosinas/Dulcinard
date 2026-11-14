import mongoose from "mongoose";
import { PROMO_TYPE_KEYS, OCCASION_KEYS, PROMO_SCOPES } from "../utils/promotionTypes.js";

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    banner: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },

    // Tipo de promoción (ver utils/promotionTypes.js): hoy, porcentaje de descuento.
    type: { type: String, enum: PROMO_TYPE_KEYS, default: "percent" },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },

    // Ocasión: promoción general o una fecha especial (Navidad, Día del Niño, ...).
    occasion: { type: String, enum: OCCASION_KEYS, default: "general" },
    occasionName: { type: String, default: "", trim: true }, // si occasion = "otra"

    // Alcance: toda la tienda, algunas categorías o algunos productos. Sin valor
    // por defecto: en las promos viejas se deduce de sus listas (ver scopeOf).
    scope: { type: String, enum: PROMO_SCOPES },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    // Precio para mostrar en el cartel (ej: "3 alfajores por $5.000") y el normal tachado.
    // Es solo informativo: lo que se cobra sale del tipo de promoción.
    price: { type: Number, min: 0, default: null },
    regularPrice: { type: Number, min: 0, default: null },
    // Si aparece en el cartel que se abre al entrar a la tienda.
    showInPopup: { type: Boolean, default: true },

    // Vigencia (fecha y hora). Se activa y se termina sola; "active" es la pausa manual.
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

promotionSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return this.active && this.startDate <= now && this.endDate >= now;
});

promotionSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Promotion", promotionSchema);
