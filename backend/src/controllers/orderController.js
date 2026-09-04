import Order from "../models/Order.js";
import Product from "../models/Product.js";
import SiteConfig from "../models/SiteConfig.js";
import ShippingZone from "../models/ShippingZone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mpPreference, mpPayment } from "../config/mercadoPago.js";
import { sendOrderNotification } from "../utils/sendOrderNotification.js";

// Recalcula el pedido en el servidor a partir de precios reales de la DB:
// nunca confiamos en el precio que venga del carrito del cliente.
async function buildOrderItems(cartItems) {
  const ids = cartItems.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, active: true });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  for (const { productId, quantity } of cartItems) {
    const product = productMap.get(productId);
    if (!product) throw Object.assign(new Error("Un producto del carrito ya no está disponible"), { status: 400 });
    if (quantity < product.minOrderQty) {
      throw Object.assign(
        new Error(`${product.name} requiere un mínimo de ${product.minOrderQty} ${product.unit}(s)`),
        { status: 400 }
      );
    }
    if (product.stock < quantity) {
      throw Object.assign(new Error(`Stock insuficiente para ${product.name}`), { status: 400 });
    }

    const subtotal = product.price * quantity;
    items.push({
      product: product._id,
      name: product.name,
      unit: product.unit,
      unitPrice: product.price,
      quantity,
      subtotal
    });
  }
  return items;
}

export const createOrder = asyncHandler(async (req, res) => {
  const { items: cartItems, shippingAddress } = req.body;
  if (!cartItems?.length) return res.status(400).json({ message: "El carrito está vacío" });

  const items = await buildOrderItems(cartItems);
  const itemsTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  const config = await SiteConfig.findOne();
  let minPurchase = config?.minPurchaseAmount ?? 0;
  let shippingCost = config?.defaultShippingCost ?? 0;
  let freeShippingFrom = config?.freeShippingFrom ?? 0;

  if (shippingAddress?.zone) {
    const zone = await ShippingZone.findById(shippingAddress.zone);
    if (zone) {
      minPurchase = zone.minPurchaseAmount;
      shippingCost = zone.cost;
      freeShippingFrom = zone.freeShippingFrom;
    }
  }

  if (itemsTotal < minPurchase) {
    return res.status(400).json({ message: `El monto mínimo de compra es $${minPurchase}` });
  }
  if (freeShippingFrom > 0 && itemsTotal >= freeShippingFrom) shippingCost = 0;

  const order = await Order.create({
    user: req.user._id,
    items,
    itemsTotal,
    shippingCost,
    total: itemsTotal + shippingCost,
    shippingAddress,
    paymentMethod: req.body.paymentMethod || "mercado_pago"
  });

  // Descontar stock reservado
  await Promise.all(items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity } })));

  res.status(201).json(order);
});

// Mercado Pago rechaza auto_return si las back_urls no son públicamente
// accesibles (devuelve "auto_return invalid. back_url.success must be
// defined" incluso cuando la URL está definida) — típico en desarrollo local.
function isPublicUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

export const createPaymentPreference = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

  const clientUrl = process.env.CLIENT_URL || "";
  const preference = await mpPreference.create({
    body: {
      items: [
        ...order.items.map((i) => ({
          title: i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          currency_id: "ARS"
        })),
        ...(order.shippingCost > 0
          ? [{ title: "Envío", quantity: 1, unit_price: order.shippingCost, currency_id: "ARS" }]
          : [])
      ],
      external_reference: order._id.toString(),
      back_urls: {
        success: `${clientUrl}/pedidos/${order._id}?pago=exito`,
        failure: `${clientUrl}/pedidos/${order._id}?pago=error`,
        pending: `${clientUrl}/pedidos/${order._id}?pago=pendiente`
      },
      ...(isPublicUrl(clientUrl) ? { auto_return: "approved" } : {}),
      notification_url: `${process.env.SERVER_URL || ""}/api/orders/mercadopago/webhook`
    }
  });

  order.mercadoPago.preferenceId = preference.id;
  await order.save();

  // Con credenciales de prueba (TEST-...) el checkout de producción rechaza a
  // los usuarios de prueba con un error genérico; hay que redirigir a
  // sandbox_init_point en ese caso.
  const isTestCredential = (process.env.MP_ACCESS_TOKEN || "").startsWith("TEST-");
  const initPoint = isTestCredential ? preference.sandbox_init_point : preference.init_point;

  res.json({ preferenceId: preference.id, initPoint });
});

// Devuelve true si el pago recién pasó a "aprobado" en esta llamada, para
// no reenviar la notificación por mail si el pedido ya estaba confirmado.
function applyPaymentToOrder(order, payment) {
  const wasApproved = order.paymentStatus === "aprobado";
  order.mercadoPago.paymentId = String(payment.id);
  if (payment.status === "approved") {
    order.paymentStatus = "aprobado";
    order.status = "confirmado";
  } else if (payment.status === "rejected") {
    order.paymentStatus = "rechazado";
  }
  return !wasApproved && order.paymentStatus === "aprobado";
}

export const mercadoPagoWebhook = asyncHandler(async (req, res) => {
  const paymentId = req.query["data.id"] || req.body?.data?.id;
  const type = req.query.type || req.body?.type;

  if (type === "payment" && paymentId) {
    const payment = await mpPayment.get({ id: paymentId });
    const order = await Order.findById(payment.external_reference).populate("user").populate("shippingAddress.zone");
    if (order) {
      const justApproved = applyPaymentToOrder(order, payment);
      await order.save();
      // No bloquea la respuesta al webhook si el mail falla.
      if (justApproved) sendOrderNotification(order, order.user);
    }
  }

  res.sendStatus(200);
});

// El webhook de Mercado Pago no puede llegar a un SERVER_URL local (localhost);
// como respaldo, cuando el usuario vuelve del checkout con éxito, el frontend
// llama a este endpoint con el payment_id que Mercado Pago agrega a la URL de
// retorno, para sincronizar el estado del pedido sin depender del webhook.
export const syncOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate("shippingAddress.zone");
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

  const paymentId = req.query.paymentId;
  if (!paymentId) return res.status(400).json({ message: "Falta el paymentId" });

  const payment = await mpPayment.get({ id: paymentId });
  if (payment.external_reference !== order._id.toString()) {
    return res.status(400).json({ message: "El pago no corresponde a este pedido" });
  }

  const justApproved = applyPaymentToOrder(order, payment);
  await order.save();
  // No bloquea la respuesta al cliente si el mail falla.
  if (justApproved) sendOrderNotification(order, req.user);

  res.json(order);
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
  res.json(order);
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email businessName phone")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter)
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 });
});

export const getOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email businessName phone");
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

  order.status = status;
  await order.save();
  res.json(order);
});
