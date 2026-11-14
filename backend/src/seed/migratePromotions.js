import "dotenv/config";

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Promotion from "../models/Promotion.js";

// Completa los campos nuevos de las promociones que ya existían (se puede
// correr varias veces: solo toca las que no los tienen):
//   - type: "percent" (las promos viejas eran todas de porcentaje)
//   - occasion: "general"
//   - scope: "products" o "categories" según lo que tenga cargado. Las que no
//     tienen ni productos ni categorías eran solo informativas: quedan sin
//     alcance (no descuentan) hasta que se editen desde el panel.
//
// Uso:  npm run migrate:promos            (aplica los cambios)
//       npm run migrate:promos -- --dry   (solo muestra qué haría)

const dryRun = process.argv.includes("--dry");

async function run() {
  await connectDB();
  const promos = await Promotion.find({ $or: [{ type: { $exists: false } }, { scope: { $exists: false } }, { occasion: { $exists: false } }] }).lean();
  console.log(`[promos] Promociones para completar: ${promos.length}`);

  for (const p of promos) {
    const set = {};
    if (!p.type) set.type = "percent";
    if (!p.occasion) set.occasion = "general";
    if (!p.scope) {
      if (p.products?.length) set.scope = "products";
      else if (p.categories?.length) set.scope = "categories";
    }
    const scopeText = set.scope || p.scope || "sin alcance (no descuenta: editala desde el panel)";
    console.log(`   - ${p.title}: tipo ${set.type || p.type}, alcance ${scopeText}`);
    if (!dryRun && Object.keys(set).length) await Promotion.updateOne({ _id: p._id }, { $set: set });
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("[promos] Error:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
