import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { readRecords, normalizeHeader } from "../utils/spreadsheet.js";
import { buildWorkbook, formatArDate, sendWorkbook } from "../utils/excelExport.js";
import { syncStockForStatus } from "../utils/orderStock.js";

// Marcar pedidos como entregados desde un Excel, en vez de uno por uno:
//   1. se descarga la planilla con los pedidos pagados que faltan entregar;
//   2. se completa la columna "Entregado" (SI) y, si se quiere, la fecha;
//   3. se sube: primero se ve qué pasa con cada fila y después se confirma.

const MAX_ROWS = 5000;
const PENDING_DELIVERY_STATUSES = ["confirmado", "en_preparacion", "enviado"];
const STATUS_LABELS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado"
};
const ORDER_HEADERS = ["pedido", "n_pedido", "nro_pedido", "numero_de_pedido", "numero_pedido", "codigo", "codigo_pedido", "order"];
const DELIVERED_HEADERS = ["entregado", "entregada", "entrega", "delivered"];
const DATE_HEADERS = ["fecha_de_entrega", "fecha_entrega", "fecha", "entregado_el"];
const YES = new Set(["si", "sí", "s", "x", "1", "true", "ok", "entregado", "yes"]);

const orderCode = (order) => order._id.toString().slice(-6).toUpperCase();

// GET /orders/export/pending-delivery
export const exportPendingDelivery = asyncHandler(async (req, res) => {
  const orders = await Order.find({ status: { $in: PENDING_DELIVERY_STATUSES }, paymentStatus: "aprobado" })
    .populate("user", "name businessName phone")
    .populate("shippingAddress.zone", "name")
    .sort({ createdAt: 1 })
    .lean();

  const buffer = buildWorkbook([
    {
      name: "Pedidos a entregar",
      columns: [
        { header: "Pedido", width: 10 },
        { header: "Entregado", width: 11 },
        { header: "Fecha de entrega", width: 17 },
        { header: "Fecha del pedido", width: 18 },
        { header: "Estado actual", width: 15 },
        { header: "Cliente", width: 24 },
        { header: "Negocio", width: 22 },
        { header: "Teléfono", width: 14 },
        { header: "Dirección", width: 32 },
        { header: "Zona", width: 16 },
        { header: "Productos", width: 50 },
        { header: "Total ($)", width: 14, format: "money" }
      ],
      rows: orders.map((o) => [
        "#" + orderCode(o),
        "",
        "",
        formatArDate(o.createdAt),
        STATUS_LABELS[o.status],
        o.user?.name || "",
        o.user?.businessName || "",
        o.shippingAddress?.phone || o.user?.phone || "",
        [o.shippingAddress?.street, o.shippingAddress?.city].filter(Boolean).join(", "),
        o.shippingAddress?.zone?.name || "",
        o.items.map((i) => `${i.quantity} x ${i.name}`).join("\n"),
        o.total
      ])
    }
  ]);
  sendWorkbook(res, buffer, "pedidos-a-entregar.xlsx");
});

function detectColumns(records) {
  for (let i = 0; i < Math.min(records.length, 30); i++) {
    const headers = (records[i] || []).map(normalizeHeader);
    const orderCol = headers.findIndex((h) => ORDER_HEADERS.includes(h));
    if (orderCol !== -1) {
      return {
        orderCol,
        deliveredCol: headers.findIndex((h) => DELIVERED_HEADERS.includes(h)),
        dateCol: headers.findIndex((h) => DATE_HEADERS.includes(h)),
        firstDataIndex: i + 1
      };
    }
  }
  return null;
}

// Fecha de una celda de Excel (número de serie o texto "dd/mm/aaaa [hh:mm]"),
// tomada como hora de Argentina. undefined = celda vacía; null = no se entiende.
function parseCellDate(value) {
  if (value === "" || value == null) return undefined;
  let y, m, d, hh = 12, mm = 0;
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400000));
    if (Number.isNaN(date.getTime())) return null;
    [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    if (value % 1) [hh, mm] = [date.getUTCHours(), date.getUTCMinutes()];
  } else {
    const match = String(value).trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (y < 100) y += 2000;
    if (match[4]) [hh, mm] = [Number(match[4]), Number(match[5])];
  }
  // Descarta fechas que no existen (ej: 31/02).
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d || hh > 23 || mm > 59) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return new Date(`${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00-03:00`);
}

// POST /orders/import/delivered  (multipart, campo "file")
// ?dryRun=true devuelve la vista previa sin cambiar nada.
export const importDeliveredOrders = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Elegí un archivo Excel" });
  if (!/\.(xlsx|xls|ods|csv)$/i.test(req.file.originalname)) {
    return res.status(400).json({ message: "Subí un archivo Excel (.xlsx o .xls), LibreOffice (.ods) o CSV" });
  }
  const dryRun = req.query.dryRun === "true";

  let records;
  try {
    records = await readRecords(req.file);
  } catch {
    return res.status(400).json({ message: "No pudimos leer el archivo. Verificá que sea un Excel válido" });
  }

  const columns = detectColumns(records);
  if (!columns) {
    return res.status(400).json({
      message: 'No encontramos la columna "Pedido". Usá la planilla de "Descargar pedidos a entregar" o una con una columna PEDIDO con el número (ej: #A1B2C3).'
    });
  }

  const rows = [];
  for (let i = columns.firstDataIndex; i < records.length; i++) {
    const code = String(records[i]?.[columns.orderCol] ?? "").trim().replace(/^#/, "").toUpperCase();
    if (code) rows.push({ row: i + 1, record: records[i], code });
  }
  if (!rows.length) return res.status(400).json({ message: "El archivo no tiene pedidos" });
  if (rows.length > MAX_ROWS) return res.status(400).json({ message: `El archivo tiene ${rows.length} filas; el máximo es ${MAX_ROWS}` });

  // El número de pedido son los últimos 6 caracteres del id.
  const orders = await Order.find().select("_id status paymentStatus createdAt total user").populate("user", "name businessName").lean();
  const byCode = new Map();
  for (const o of orders) {
    const code = orderCode(o);
    byCode.set(code, byCode.has(code) ? null : o); // null = dos pedidos con el mismo número (muy raro)
  }

  const now = new Date();
  const toDeliver = [];
  const alreadyDelivered = [];
  const errors = [];
  let skipped = 0;
  const seen = new Set();

  for (const { row, record, code } of rows) {
    if (columns.deliveredCol !== -1) {
      const mark = String(record[columns.deliveredCol] ?? "").trim().toLowerCase();
      if (!YES.has(mark)) {
        skipped++; // sin "SI": todavía no se entregó
        continue;
      }
    }
    const label = `#${code}`;
    if (!/^[0-9A-F]{6}$/.test(code)) {
      errors.push({ row, code: label, message: "El número de pedido no es válido (son 6 letras y números, ej: #A1B2C3)" });
      continue;
    }
    const order = byCode.get(code);
    if (order === undefined) {
      errors.push({ row, code: label, message: "No existe un pedido con ese número" });
      continue;
    }
    if (order === null) {
      errors.push({ row, code: label, message: "Hay más de un pedido con ese número: marcalo a mano desde el pedido" });
      continue;
    }
    if (seen.has(code)) {
      errors.push({ row, code: label, message: "El pedido aparece repetido en el archivo; se usa la primera fila" });
      continue;
    }
    seen.add(code);

    const customer = order.user?.businessName || order.user?.name || "";
    if (order.status === "entregado") {
      alreadyDelivered.push({ row, code: label, customer });
      continue;
    }
    if (order.status === "cancelado") {
      errors.push({ row, code: label, customer, message: "El pedido está cancelado" });
      continue;
    }
    if (order.paymentStatus !== "aprobado") {
      errors.push({ row, code: label, customer, message: "Falta confirmar el pago: marcalo como pagado antes de entregarlo" });
      continue;
    }

    let deliveredAt = now;
    if (columns.dateCol !== -1) {
      const parsed = parseCellDate(record[columns.dateCol]);
      if (parsed === null) {
        errors.push({ row, code: label, customer, message: `La fecha de entrega no se entiende: "${record[columns.dateCol]}" (usá dd/mm/aaaa)` });
        continue;
      }
      if (parsed) {
        if (parsed > new Date(now.getTime() + 86400000)) {
          errors.push({ row, code: label, customer, message: "La fecha de entrega es futura" });
          continue;
        }
        if (parsed < new Date(new Date(order.createdAt).getTime() - 86400000)) {
          errors.push({ row, code: label, customer, message: "La fecha de entrega es anterior al pedido" });
          continue;
        }
        deliveredAt = parsed;
      }
    }
    toDeliver.push({ row, id: order._id, code: label, customer, total: order.total, from: STATUS_LABELS[order.status], deliveredAt });
  }

  let delivered = 0;
  if (!dryRun) {
    for (const item of toDeliver) {
      const order = await Order.findById(item.id);
      if (!order || order.status === "entregado" || order.status === "cancelado" || order.paymentStatus !== "aprobado") continue;
      try {
        // Mismo camino que el cambio de estado a mano (el stock ya está descontado al pagar).
        await syncStockForStatus(order, "entregado");
        order.stockIssue = "";
        order.status = "entregado";
        await order.save();
        // El historial guarda la fecha real de entrega que vino en el archivo.
        await Order.updateOne(
          { _id: order._id, "statusHistory._id": order.statusHistory.at(-1)._id },
          { $set: { "statusHistory.$.date": item.deliveredAt } }
        );
        delivered++;
      } catch (err) {
        errors.push({ row: item.row, code: item.code, customer: item.customer, message: err.message || "No se pudo marcar como entregado" });
      }
    }
  }

  res.json({
    dryRun,
    totalRows: rows.length,
    toDeliver: toDeliver.map(({ id, deliveredAt, ...rest }) => ({ ...rest, deliveredAt: formatArDate(deliveredAt, { withTime: false }) })),
    delivered,
    alreadyDelivered,
    skipped,
    errors: errors.sort((a, b) => a.row - b.row)
  });
});
