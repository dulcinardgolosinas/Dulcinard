import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: "" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.pre("validate", function (next) {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: "es" });
  }
  next();
});

export default mongoose.model("Category", categorySchema);
