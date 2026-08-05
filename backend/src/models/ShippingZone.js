import mongoose from "mongoose";

const shippingZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // ej: "San Miguel de Tucumán"
    cost: { type: Number, required: true, default: 80 },
    minPurchaseAmount: { type: Number, default: 500 },
    freeShippingFrom: { type: Number, default: 0 }, // 0 = deshabilitado
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("ShippingZone", shippingZoneSchema);
