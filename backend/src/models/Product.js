import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // secure_url de Cloudinary
    publicId: { type: String, required: true }
  },
  { _id: false }
);

export const SALE_UNITS = ["unidad", "caja", "display", "bolsa", "pack"];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: "" },
    brand: { type: String, default: "", trim: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    sku: { type: String, unique: true, sparse: true, trim: true },

    price: { type: Number, required: true, min: 0 }, // precio mayorista
    unit: { type: String, enum: SALE_UNITS, default: "unidad" }, // unidad de venta
    unitsPerPack: { type: Number, default: 1, min: 1 }, // ej: display x24

    stock: { type: Number, required: true, default: 0, min: 0 },
    minOrderQty: { type: Number, default: 1, min: 1 },

    images: { type: [imageSchema], default: [] },

    featured: { type: Boolean, default: false }, // "destacado" en home
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text" });

productSchema.pre("validate", function (next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = `${slugify(this.name, { lower: true, strict: true, locale: "es" })}-${Date.now()
      .toString(36)
      .slice(-4)}`;
  }
  next();
});

export default mongoose.model("Product", productSchema);
