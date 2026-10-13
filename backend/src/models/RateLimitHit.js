import mongoose from "mongoose";

// Contador de intentos por IP y ventana de tiempo para el rate limit
// (middleware/security.js). Se guarda en Mongo para que el límite sea el mismo
// en todas las instancias serverless de Vercel. MongoDB borra solo cada
// registro cuando vence su ventana (índice TTL sobre expiresAt).
const rateLimitHitSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "<limitador>:<ip>:<inicio de ventana>"
    hits: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { versionKey: false }
);

rateLimitHitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RateLimitHit", rateLimitHitSchema);
