import "dotenv/config";

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Migración única para el nuevo manejo de stock (correr una sola vez, es idempotente):
//
// Antes el stock se descontaba al CREAR el pedido; ahora se descuenta al
// CONFIRMAR el pago y se devuelve al cancelar. Para que los pedidos viejos
// queden consistentes:
//   - pendiente sin pago aprobado -> se devuelve el stock (se volverá a
//     descontar si se confirma el pago) y stockDeducted = false
//   - confirmado / en preparación / enviado / entregado, o pendiente ya
//     pagado -> stockDeducted = true (su stock ya está descontado)
//   - cancelado -> stockDeducted = false. Su stock se descontó y nunca se
//     devolvió: el script solo lo informa, revisalo a mano si hace falta.
// Además completa minStock = 0 en los productos que no lo tienen.
//
// Uso:  npm run migrate:stock            (aplica los cambios)
//       npm run migrate:stock -- --dry   (solo muestra qué haría)

const dryRun = process.argv.includes("--dry");

async function run() {
  await connectDB();

  const legacyOrders = await Order.find({ stockDeducted: { $exists: false } });
  const summary = { restored: 0, markedDeducted: 0, cancelled: [] };

  for (const order of legacyOrders) {
    const unpaidPending = order.status === "pendiente" && order.paymentStatus !== "aprobado";

    if (order.status === "cancelado") {
      summary.cancelled.push(`#${order._id.toString().slice(-6).toUpperCase()}`);
      if (!dryRun) await Order.updateOne({ _id: order._id }, { $set: { stockDeducted: false } });
    } else if (unpaidPending) {
      summary.restored++;
      if (!dryRun) {
        // Primero el flag (si el script se corta a la mitad, no devuelve dos veces).
        const lock = await Order.updateOne(
          { _id: order._id, stockDeducted: { $exists: false } },
          { $set: { stockDeducted: false } }
        );
        if (lock.modifiedCount === 1) {
          await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
        }
      }
    } else {
      summary.markedDeducted++;
      if (!dryRun) await Order.updateOne({ _id: order._id }, { $set: { stockDeducted: true } });
    }
  }

  const productsWithoutMinStock = await Product.countDocuments({ minStock: { $exists: false } });
  if (!dryRun) await Product.updateMany({ minStock: { $exists: false } }, { $set: { minStock: 0 } });

  console.log(dryRun ? "[migrate] MODO PRUEBA: no se guardó nada" : "[migrate] Migración aplicada");
  console.log(`[migrate] Pedidos sin migrar encontrados: ${legacyOrders.length}`);
  console.log(`[migrate]   pendientes sin pago (stock devuelto): ${summary.restored}`);
  console.log(`[migrate]   confirmados/pagados (marcados con stock descontado): ${summary.markedDeducted}`);
  console.log(`[migrate]   cancelados (stock NO devuelto, revisar a mano): ${summary.cancelled.length}`);
  if (summary.cancelled.length) console.log(`[migrate]     ${summary.cancelled.join(", ")}`);
  console.log(`[migrate] Productos con minStock = 0 agregado: ${productsWithoutMinStock}`);
}

run()
  .catch((err) => {
    console.error("[migrate] Error:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
