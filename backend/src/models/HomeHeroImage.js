import mongoose from "mongoose";

const homeHeroImageSchema = new mongoose.Schema(
  {
    // "image" = foto; "video" = video (en ese caso "image" es su miniatura).
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    },
    video: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      duration: { type: Number, default: 0 }, // segundos
      bytes: { type: Number, default: 0 }
    },
    // Texto opcional sobre la foto y adónde lleva el botón "Comprar":
    // al catálogo completo, a un producto o a una categoría.
    title: { type: String, default: "", trim: true },
    buttonText: { type: String, default: "Comprar", trim: true },
    // "promotion": lleva al listado de productos de esa promoción.
    linkType: { type: String, enum: ["catalog", "product", "category", "promotion"], default: "catalog" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", default: null },
    // Si está vinculado a una promoción: se oculta solo cuando la promo termina o se pausa.
    hideWhenPromoEnds: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("HomeHeroImage", homeHeroImageSchema);
