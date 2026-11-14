import "dotenv/config";

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// Agrega la categoría "Alfajores" (se puede correr varias veces: si ya existe, no la duplica).
//
// Uso:  npm run seed:alfajores                (solo crea la categoría)
//       npm run seed:alfajores -- --mover     (además pasa a "Alfajores" los productos
//                                              cuyo nombre empieza con "ALF" o "ALFAJOR")
//       npm run seed:alfajores -- --mover --dry   (muestra qué productos movería, sin cambiar nada)

const move = process.argv.includes("--mover");
const dryRun = process.argv.includes("--dry");

async function run() {
  await connectDB();

  let category = await Category.findOne({ name: { $regex: /^alfajores$/i } });
  if (category) {
    if (!category.active && !dryRun) {
      category.active = true;
      await category.save();
    }
    console.log(`[alfajores] La categoría ya existía (${category._id}).`);
  } else if (dryRun) {
    console.log("[alfajores] Crearía la categoría Alfajores.");
  } else {
    category = await Category.create({ name: "Alfajores", description: "Alfajores simples, triples y en caja por mayor" });
    console.log(`[alfajores] Categoría creada (${category._id}).`);
  }

  if (move) {
    const filter = { name: { $regex: /^(ALF\.|ALF\s|ALFAJOR)/i }, ...(category ? { category: { $ne: category._id } } : {}) };
    const products = await Product.find(filter).select("name").limit(1000);
    console.log(`[alfajores] Productos para pasar a Alfajores: ${products.length}`);
    for (const p of products.slice(0, 20)) console.log("   -", p.name);
    if (products.length > 20) console.log(`   ... y ${products.length - 20} más`);
    if (!dryRun && category && products.length) {
      const res = await Product.updateMany({ _id: { $in: products.map((p) => p._id) } }, { $set: { category: category._id } });
      console.log(`[alfajores] Movidos: ${res.modifiedCount}`);
    }
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("[alfajores] Error:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
