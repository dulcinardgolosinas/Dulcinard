import mongoose from "mongoose";

const homeHeroImageSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    },
    // Texto opcional sobre la foto y adónde lleva el botón "Comprar":
    // al catálogo completo, a un producto o a una categoría.
    title: { type: String, default: "", trim: true },
    buttonText: { type: String, default: "Comprar", trim: true },
    linkType: { type: String, enum: ["catalog", "product", "category"], default: "catalog" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("HomeHeroImage", homeHeroImageSchema);
