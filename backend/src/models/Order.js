import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado"
];

// Estados en los que el pedido tiene el stock descontado. "pendiente" (de
// pago) y "cancelado" no retienen stock.
export const STOCK_HOLDING_STATUSES = ["confirmado", "en_preparacion", "enviado", "entregado"];

export const PAYMENT_METHODS = ["mercado_pago", "efectivo", "transferencia"];
// Métodos que el cliente puede elegir en el checkout.
export const CHECKOUT_PAYMENT_METHODS = ["mercado_pago", "efectivo", "transferencia"];
export const PAYMENT_STATUSES = ["pendiente", "aprobado", "rechazado"];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot al momento de compra
    unit: { type: String, required: true },
    listPrice: { type: Number }, // precio de lista sin promo (snapshot)
    discountPercent: { type: Number, default: 0 }, // % de promo aplicado
    unitPrice: { type: Number, required: true }, // precio cobrado por unidad
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
      notes: String,
      phone: String // teléfono de contacto para este pedido puntual (puede diferir del perfil)
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

    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "mercado_pago", index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pendiente" },
    paymentConfirmedAt: { type: Date, default: null },
    // Admin que confirmó el pago a mano (ej: efectivo); null si lo confirmó Mercado Pago.
    paymentConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // true mientras el stock de los items esté descontado de los productos.
    // Lo maneja utils/orderStock.js de forma atómica: no modificar a mano.
    stockDeducted: { type: Boolean, default: false },
    // Motivo si un pago online se aprobó pero no había stock para descontar
    // (el pedido queda "pendiente" hasta que un admin lo resuelva).
    stockIssue: { type: String, default: "" },
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
