import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Principal" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingZone", default: null },
    notes: { type: String, default: "" }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    businessName: { type: String, default: "", trim: true }, // razón social del kiosco/negocio
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["cliente", "admin"], default: "cliente" },
    addresses: { type: [addressSchema], default: [] },
    active: { type: Boolean, default: true },
    // Se incrementa al cambiar la contraseña: invalida todos los tokens emitidos antes.
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
