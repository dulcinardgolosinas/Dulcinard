import Order, { STOCK_HOLDING_STATUSES } from "../models/Order.js";
import Product from "../models/Product.js";

// Descuento / devolución de stock de un pedido, a prueba de compras simultáneas
// sin depender de transacciones (que requieren replica set):
//   1. El flag `order.stockDeducted` se cambia con un update condicional que
//      actúa como lock: si dos procesos (webhook + sync, dos admins) llegan a la
//      vez, solo uno lo gana y el otro no vuelve a descontar.
//   2. Cada producto se descuenta con `{ stock: { $gte: qty } }` + `$inc`, así
//      MongoDB nunca deja el stock por debajo de 0 aunque haya otra compra en paralelo.
//   3. Si algún item no alcanza, se revierte lo ya descontado y se libera el lock.

function insufficientStockError(itemName) {
  return Object.assign(new Error(`Stock insuficiente para ${itemName}`), { status: 409 });
}

/**
 * Descuenta del stock los items del pedido. Idempotente: si ya estaba
 * descontado no hace nada. Lanza un error 409 si no alcanza el stock de algún
 * item (y en ese caso no descuenta nada).
 * @param {import("mongoose").Document} order
 */
export async function deductOrderStock(order) {
  const lock = await Order.updateOne({ _id: order._id, stockDeducted: { $ne: true } }, { $set: { stockDeducted: true } });
  if (lock.modifiedCount === 0) {
    order.stockDeducted = true;
    return;
  }

  const deducted = [];
  try {
    for (const item of order.items) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount === 1) {
        deducted.push(item);
        continue;
      }
      // Un producto borrado del catálogo no puede bloquear el pedido: se omite.
      if (await Product.exists({ _id: item.product })) throw insufficientStockError(item.name);
    }
  } catch (err) {
    await Promise.all(deducted.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
    await Order.updateOne({ _id: order._id }, { $set: { stockDeducted: false } });
    throw err;
  }

  // Ya quedó persistido por el lock; se refleja en el documento en memoria
  // para que un order.save() posterior no lo pise.
  order.stockDeducted = true;
}

/**
 * Devuelve al stock los items del pedido si estaban descontados. Idempotente.
 * @param {import("mongoose").Document} order
 */
export async function restoreOrderStock(order) {
  const lock = await Order.updateOne({ _id: order._id, stockDeducted: true }, { $set: { stockDeducted: false } });
  order.stockDeducted = false;
  if (lock.modifiedCount === 0) return;

  await Promise.all(
    order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
  );
}

/**
 * Aplica el efecto de stock de pasar el pedido a `status`: los estados
 * confirmados descuentan, "pendiente" y "cancelado" devuelven.
 */
export async function syncStockForStatus(order, status) {
  if (STOCK_HOLDING_STATUSES.includes(status)) await deductOrderStock(order);
  else await restoreOrderStock(order);
}

/**
 * Flujo único de "pago confirmado", compartido por Mercado Pago (webhook /
 * sync) y por la confirmación manual del admin (efectivo): marca el pago
 * aprobado, descuenta stock y pasa el pedido a "confirmado".
 *
 * - strictStock = true (confirmación manual): si no hay stock lanza 409 y el
 *   pedido no se modifica, para que el admin lo resuelva antes de cobrar.
 * - strictStock = false (pago online ya cobrado): el pago queda aprobado
 *   igual, pero el pedido sigue "pendiente" con `stockIssue` para que el admin
 *   lo vea en el panel.
 *
 * No guarda el documento: el llamador hace order.save().
 * @returns {Promise<boolean>} true si el pago recién pasó a "aprobado" en esta llamada.
 */
export async function approveOrderPayment(order, { strictStock = false, confirmedBy = null } = {}) {
  if (order.paymentStatus === "aprobado") return false;

  try {
    await deductOrderStock(order);
    order.stockIssue = "";
    if (order.status === "pendiente") order.status = "confirmado";
  } catch (err) {
    if (strictStock || err.status !== 409) throw err;
    order.stockIssue = err.message;
  }

  order.paymentStatus = "aprobado";
  order.paymentConfirmedAt = new Date();
  order.paymentConfirmedBy = confirmedBy;
  return true;
}
