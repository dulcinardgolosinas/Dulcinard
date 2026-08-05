import Order from "../models/Order.js";
import Product from "../models/Product.js";
import SiteConfig from "../models/SiteConfig.js";
import ShippingZone from "../models/ShippingZone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mpPreference, mpPayment } from "../config/mercadoPago.js";

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

export const createPaymentPreference = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

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
        success: `${process.env.CLIENT_URL}/pedidos/${order._id}?pago=exito`,
        failure: `${process.env.CLIENT_URL}/pedidos/${order._id}?pago=error`,
        pending: `${process.env.CLIENT_URL}/pedidos/${order._id}?pago=pendiente`
      },
      auto_return: "approved",
      notification_url: `${process.env.SERVER_URL || ""}/api/orders/mercadopago/webhook`
    }
  });

  order.mercadoPago.preferenceId = preference.id;
  await order.save();

  res.json({ preferenceId: preference.id, initPoint: preference.init_point });
});

export const mercadoPagoWebhook = asyncHandler(async (req, res) => {
  const paymentId = req.query["data.id"] || req.body?.data?.id;
  const type = req.query.type || req.body?.type;

  if (type === "payment" && paymentId) {
    const payment = await mpPayment.get({ id: paymentId });
    const orderId = payment.external_reference;
    const order = await Order.findById(orderId);

    if (order) {
      order.mercadoPago.paymentId = String(paymentId);
      if (payment.status === "approved") {
        order.paymentStatus = "aprobado";
        order.status = "confirmado";
      } else if (payment.status === "rejected") {
        order.paymentStatus = "rechazado";
      }
      await order.save();
    }
  }

  res.sendStatus(200);
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
      .populate("user", "name email businessName")
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
