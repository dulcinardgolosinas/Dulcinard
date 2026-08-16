import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);
