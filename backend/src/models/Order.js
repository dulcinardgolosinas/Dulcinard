import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado"
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot al momento de compra
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },

    itemsTotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },

    shippingAddress: {
      street: String,
      city: String,
      zone: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingZone" },
      notes: String
    },

    status: { type: String, enum: ORDER_STATUSES, default: "pendiente", index: true },
    statusHistory: {
      type: [
        {
          status: { type: String, enum: ORDER_STATUSES },
          date: { type: Date, default: Date.now }
        }
      ],
      default: []
    },

    paymentMethod: { type: String, enum: ["mercado_pago", "efectivo", "transferencia"], default: "mercado_pago" },
    paymentStatus: { type: String, enum: ["pendiente", "aprobado", "rechazado"], default: "pendiente" },
    mercadoPago: {
      preferenceId: { type: String, default: "" },
      paymentId: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (this.isModified("status") || this.isNew) {
    this.statusHistory.push({ status: this.status, date: new Date() });
  }
  next();
});

export default mongoose.model("Order", orderSchema);
