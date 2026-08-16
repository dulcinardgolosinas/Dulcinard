import mongoose from "mongoose";

const homeHeroImageSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("HomeHeroImage", homeHeroImageSchema);
