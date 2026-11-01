import Order, { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, STOCK_HOLDING_STATUSES } from "../models/Order.js";
import Product from "../models/Product.js";
import SiteConfig from "../models/SiteConfig.js";
import ShippingZone from "../models/ShippingZone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mpPreference, mpPayment } from "../config/mercadoPago.js";
import { sendOrderNotification } from "../utils/sendOrderNotification.js";
import { approveOrderPayment, syncStockForStatus } from "../utils/orderStock.js";
import { parsePagination, paginatedResponse } from "../utils/query.js";
import { getActivePromotions, discountFor, discountedPrice } from "../utils/pricing.js";
import { buildWorkbook, formatArDate, sendWorkbook } from "../utils/excelExport.js";

// Recalcula el pedido en el servidor a partir de precios reales de la DB:
// nunca confiamos en el precio que venga del carrito del cliente.
async function buildOrderItems(cartItems) {
  // Si el mismo producto viene repetido en varias líneas se suma en una sola:
  // si no, cada línea pasaría por separado el chequeo de stock y de mínimo.
  const quantities = new Map();
  for (const { productId, quantity } of cartItems) {
    quantities.set(String(productId), (quantities.get(String(productId)) || 0) + Number(quantity));
  }

  const [products, promotions] = await Promise.all([
    Product.find({ _id: { $in: [...quantities.keys()] }, active: true }),
    getActivePromotions()
  ]);
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  for (const [productId, quantity] of quantities) {
    const product = productMap.get(productId);
    if (!product) throw Object.assign(new Error("Un producto del carrito ya no está disponible"), { status: 400 });
    if (quantity < product.minOrderQty) {
      throw Object.assign(
        new Error(`${product.name} requiere un mínimo de ${product.minOrderQty} ${product.unit}(s)`),
        { status: 400 }
      );
    }
    // Chequeo preventivo: el descuento real (atómico) se hace al confirmar el
    // pago, en utils/orderStock.js.
    if (product.stock < quantity) {
      throw Object.assign(new Error(`Stock insuficiente para ${product.name}`), { status: 400 });
    }

    // Precio con la promo vigente, calculado acá (nunca el que mande el carrito).
    const discountPercent = discountFor(product, promotions);
    const unitPrice = discountedPrice(product.price, discountPercent);
    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    items.push({
      product: product._id,
      name: product.name,
      unit: product.unit,
      listPrice: product.price,
      discountPercent,
      unitPrice,
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
    // Una zona inexistente o desactivada (ej: una más barata que ya no se usa)
    // no puede elegirse mandando su ID a mano.
    const zone = await ShippingZone.findOne({ _id: shippingAddress.zone, active: true });
    if (!zone) return res.status(400).json({ message: "La zona de envío elegida no está disponible" });
    minPurchase = zone.minPurchaseAmount;
    shippingCost = zone.cost;
    freeShippingFrom = zone.freeShippingFrom;
  }

  if (itemsTotal < minPurchase) {
    return res.status(400).json({ message: `El monto mínimo de compra es $${minPurchase}` });
  }
  if (freeShippingFrom > 0 && itemsTotal >= freeShippingFrom) shippingCost = 0;

  if (req.body.paymentMethod === "transferencia" && !(config?.bankTransfer?.alias || config?.bankTransfer?.cbu)) {
    return res.status(400).json({ message: "El pago por transferencia no está disponible en este momento" });
  }

  const order = await Order.create({
    user: req.user._id,
    items,
    itemsTotal,
    shippingCost,
    total: itemsTotal + shippingCost,
    // Solo los campos de entrega conocidos, nunca el objeto tal cual vino.
    shippingAddress: {
      street: shippingAddress.street,
      city: shippingAddress.city,
      zone: shippingAddress.zone || undefined,
      notes: shippingAddress.notes || "",
      phone: shippingAddress.phone
    },
    paymentMethod: req.body.paymentMethod || "mercado_pago"
  });

  // El stock no se descuenta acá sino cuando se confirma el pago: el pedido
  // queda "pendiente de pago". Se avisa al dueño de todos los pedidos nuevos;
  // si el mail falla, el pedido igual queda guardado (sendOrderNotification no lanza).
  await order.populate("shippingAddress.zone");
  sendOrderNotification(order, req.user, { isNew: true });

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
  if (order.paymentMethod !== "mercado_pago") {
    return res.status(400).json({ message: "Este pedido no se paga con Mercado Pago" });
  }
  if (order.paymentStatus === "aprobado" || order.status === "cancelado") {
    return res.status(400).json({ message: "Este pedido ya no admite pagos" });
  }

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
async function applyPaymentToOrder(order, payment) {
  if (payment.status === "approved") {
    // Defensa extra: el pago tiene que cubrir el total del pedido y estar en
    // pesos. Si no coincide no se aprueba (queda para revisión manual).
    const paidEnough = Number(payment.transaction_amount) + 0.01 >= order.total && payment.currency_id === "ARS";
    if (!paidEnough) {
      console.error(
        `[pagos] Pago ${payment.id} no coincide con el pedido ${order._id}: ${payment.transaction_amount} ${payment.currency_id} vs ${order.total} ARS`
      );
      return false;
    }
    order.mercadoPago.paymentId = String(payment.id);
    return approveOrderPayment(order);
  }
  order.mercadoPago.paymentId = String(payment.id);
  if (payment.status === "rejected" && order.paymentStatus !== "aprobado") order.paymentStatus = "rechazado";
  return false;
}

export const mercadoPagoWebhook = asyncHandler(async (req, res) => {
  const paymentId = req.query["data.id"] || req.body?.data?.id;
  const type = req.query.type || req.body?.type;

  if (type === "payment" && paymentId) {
    const payment = await mpPayment.get({ id: paymentId });
    const order = await Order.findById(payment.external_reference).populate("user").populate("shippingAddress.zone");
    if (order) {
      const justApproved = await applyPaymentToOrder(order, payment);
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

  const justApproved = await applyPaymentToOrder(order, payment);
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

// Fecha "YYYY-MM-DD" -> Date. endOfDay incluye el día completo en el rango "hasta".
function parseDateParam(value, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-03:00`); // hora de Argentina
  return Number.isNaN(date.getTime()) ? null : date;
}

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, paymentMethod, paymentStatus, from, to } = req.query;
  const filter = {};
  if (ORDER_STATUSES.includes(status)) filter.status = status;
  if (PAYMENT_METHODS.includes(paymentMethod)) filter.paymentMethod = paymentMethod;
  if (PAYMENT_STATUSES.includes(paymentStatus)) filter.paymentStatus = paymentStatus;

  const fromDate = parseDateParam(from);
  const toDate = parseDateParam(to, true);
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) filter.createdAt.$lte = toDate;
  }

  const pagination = parsePagination(req.query, 20);

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email businessName phone")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Order.countDocuments(filter)
  ]);

  res.json(paginatedResponse(items, total, pagination));
});

const MAX_EXPORT_ORDERS = 10000;
const PAYMENT_LABELS = { mercado_pago: "Mercado Pago", efectivo: "Efectivo", transferencia: "Transferencia bancaria" };
const UNIT_LABELS = { unidad: "Unidad", caja: "Caja", display: "Display", bolsa: "Bolsa", pack: "Pack" };

const deliveredAt = (order) =>
  [...(order.statusHistory || [])].reverse().find((h) => h.status === "entregado")?.date || order.updatedAt;

// GET /orders/export/delivered?from=AAAA-MM-DD&to=AAAA-MM-DD
// Excel de los pedidos entregados, filtrados por la fecha en que se entregaron.
export const exportDeliveredOrders = asyncHandler(async (req, res) => {
  const fromDate = parseDateParam(req.query.from);
  const toDate = parseDateParam(req.query.to, true);
  const filter = { status: "entregado" };
  if (fromDate || toDate) {
    const date = {};
    if (fromDate) date.$gte = fromDate;
    if (toDate) date.$lte = toDate;
    filter.statusHistory = { $elemMatch: { status: "entregado", date } };
  }

  const orders = await Order.find(filter)
    .populate("user", "name email businessName phone")
    .populate("shippingAddress.zone", "name")
    .sort({ createdAt: 1 })
    .limit(MAX_EXPORT_ORDERS + 1)
    .lean();
  if (orders.length > MAX_EXPORT_ORDERS) {
    return res.status(400).json({ message: "Son demasiados pedidos para un solo archivo. Elegí un rango de fechas más corto." });
  }
  orders.sort((a, b) => deliveredAt(a) - deliveredAt(b));

  const code = (o) => "#" + o._id.toString().slice(-6).toUpperCase();
  const orderRows = orders.map((o) => [
    code(o),
    formatArDate(o.createdAt),
    formatArDate(deliveredAt(o)),
    o.user?.name || "",
    o.user?.businessName || "",
    o.user?.email || "",
    o.shippingAddress?.phone || o.user?.phone || "",
    [o.shippingAddress?.street, o.shippingAddress?.city].filter(Boolean).join(", "),
    o.shippingAddress?.zone?.name || "",
    o.items.map((i) => `${i.quantity} x ${i.name}`).join("\n"),
    o.items.reduce((sum, i) => sum + i.quantity, 0),
    o.itemsTotal,
    o.shippingCost,
    o.total,
    PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod
  ]);
  if (orders.length) {
    orderRows.push([
      "TOTAL", "", "", "", "", "", "", "", "", `${orders.length} pedido(s)`,
      orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
      orders.reduce((s, o) => s + o.itemsTotal, 0),
      orders.reduce((s, o) => s + o.shippingCost, 0),
      orders.reduce((s, o) => s + o.total, 0),
      ""
    ]);
  }
  const itemRows = orders.flatMap((o) =>
    o.items.map((i) => [code(o), formatArDate(deliveredAt(o), { withTime: false }), o.user?.name || "", o.user?.businessName || "", i.name, i.quantity, UNIT_LABELS[i.unit] || i.unit, i.unitPrice, i.subtotal])
  );

  const buffer = buildWorkbook([
    {
      name: "Pedidos entregados",
      columns: [
        { header: "Pedido", width: 10 },
        { header: "Fecha del pedido", width: 18 },
        { header: "Fecha de entrega", width: 18 },
        { header: "Cliente", width: 24 },
        { header: "Negocio", width: 22 },
        { header: "Email", width: 28 },
        { header: "Teléfono", width: 14 },
        { header: "Dirección", width: 32 },
        { header: "Zona", width: 16 },
        { header: "Productos", width: 50 },
        { header: "Cantidad total", format: "int" },
        { header: "Productos ($)", width: 14, format: "money" },
        { header: "Envío ($)", width: 12, format: "money" },
        { header: "Total ($)", width: 14, format: "money" },
        { header: "Forma de pago", width: 22 }
      ],
      rows: orderRows
    },
    {
      name: "Detalle por producto",
      columns: [
        { header: "Pedido", width: 10 },
        { header: "Fecha de entrega", width: 16 },
        { header: "Cliente", width: 24 },
        { header: "Negocio", width: 22 },
        { header: "Producto", width: 40 },
        { header: "Cantidad", format: "int" },
        { header: "Unidad" },
        { header: "Precio unitario ($)", width: 18, format: "money" },
        { header: "Subtotal ($)", width: 14, format: "money" }
      ],
      rows: itemRows
    }
  ]);

  const range = [req.query.from, req.query.to].filter(Boolean).join("_a_") || "todos";
  sendWorkbook(res, buffer, `pedidos-entregados_${range}.xlsx`);
});

const ADMIN_ORDER_POPULATE = [
  { path: "user", select: "name email businessName phone" },
  { path: "paymentConfirmedBy", select: "name email" }
];

export const getOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(ADMIN_ORDER_POPULATE);
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate(ADMIN_ORDER_POPULATE);
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

  if (STOCK_HOLDING_STATUSES.includes(status) && order.paymentStatus !== "aprobado") {
    return res.status(400).json({ message: "Confirmá el pago del pedido antes de avanzarlo" });
  }

  // Confirmar descuenta stock (409 si no alcanza); cancelar o volver a
  // "pendiente" lo devuelve.
  await syncStockForStatus(order, status);
  if (STOCK_HOLDING_STATUSES.includes(status)) order.stockIssue = "";

  order.status = status;
  await order.save();
  res.json(order);
});

// Confirmación manual del pago (pensada para efectivo, sirve también si el
// webhook de Mercado Pago no llegó). Sigue el mismo flujo que un pago online.
export const confirmOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(ADMIN_ORDER_POPULATE).populate("shippingAddress.zone");
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
  if (order.status === "cancelado") {
    return res.status(400).json({ message: "No se puede confirmar el pago de un pedido cancelado" });
  }
  if (order.paymentStatus === "aprobado") {
    return res.status(400).json({ message: "El pago de este pedido ya estaba confirmado" });
  }

  const justApproved = await approveOrderPayment(order, { strictStock: true, confirmedBy: req.user._id });
  await order.save();
  if (justApproved) sendOrderNotification(order, order.user);

  await order.populate(ADMIN_ORDER_POPULATE);
  res.json(order);
});
