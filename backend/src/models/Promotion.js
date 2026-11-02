import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    banner: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    // Precio de la promo (ej: "3 alfajores por $5.000") y, opcional, el precio
    // normal para mostrarlo tachado. null = la promo no tiene precio propio.
    price: { type: Number, min: 0, default: null },
    regularPrice: { type: Number, min: 0, default: null },
    // Si aparece en el cartel que se abre al entrar a la tienda.
    showInPopup: { type: Boolean, default: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
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
