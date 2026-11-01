import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { readRecords, normalizeHeader, parseAmount } from "../utils/spreadsheet.js";
import { buildWorkbook, formatArDate, sendWorkbook } from "../utils/excelExport.js";
import { nameKey } from "../utils/query.js";

// Stock en Excel: se descarga la planilla con el stock actual, se corrige y se
// vuelve a subir. Solo actualiza el stock de productos que ya existen (nunca
// crea ni borra productos).

const MAX_ROWS = 5000;
const MAX_STOCK = 10_000_000;
const NAME_HEADERS = ["producto", "productos", "nombre", "descripcion", "articulo", "articulos", "detalle", "item", "name", "product"];
const SKU_HEADERS = ["codigo", "cod", "sku", "code", "codigo_articulo", "cod_articulo"];
const STOCK_HEADERS = ["stock", "stock_actual", "existencia", "existencias", "cantidad", "unidades", "stock_nuevo"];

// GET /products/export/stock
export const exportStock = asyncHandler(async (req, res) => {
  const products = await Product.find().select("name sku price stock minStock active category").populate("category", "name").lean();
  products.sort(
    (a, b) => (a.category?.name || "").localeCompare(b.category?.name || "", "es") || a.name.localeCompare(b.name, "es")
  );

  const buffer = buildWorkbook([
    {
      name: "Stock",
      columns: [
        { header: "Código", width: 14 },
        { header: "Producto", width: 44 },
        { header: "Categoría", width: 22 },
        { header: "Precio ($)", width: 14, format: "money" },
        { header: "Stock", width: 10, format: "int" },
        { header: "Stock mínimo", width: 14, format: "int" },
        { header: "Visible en la tienda", width: 20 }
      ],
      rows: products.map((p) => [p.sku || "", p.name, p.category?.name || "", p.price, p.stock, p.minStock || 0, p.active ? "Sí" : "No"])
    }
  ]);
  const today = formatArDate(new Date(), { withTime: false }).split("/").reverse().join("-");
  sendWorkbook(res, buffer, `stock_${today}.xlsx`);
});

function detectStockColumns(records) {
  for (let i = 0; i < Math.min(records.length, 30); i++) {
    const headers = (records[i] || []).map(normalizeHeader);
    const nameCol = headers.findIndex((h) => NAME_HEADERS.includes(h));
    const skuCol = headers.findIndex((h) => SKU_HEADERS.includes(h));
    const stockCol = headers.findIndex((h) => STOCK_HEADERS.includes(h));
    if (stockCol !== -1 && (nameCol !== -1 || skuCol !== -1)) return { nameCol, skuCol, stockCol, firstDataIndex: i + 1 };
  }
  return null;
}

const isEmptyRecord = (record) => !record || record.every((v) => v === "" || v == null);

// POST /products/import/stock  (multipart, campo "file")
// ?dryRun=true devuelve la vista previa sin guardar nada.
export const importStockFromFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Elegí un archivo Excel" });
  if (!/\.(xlsx|xls|ods|csv)$/i.test(req.file.originalname)) {
    return res.status(400).json({ message: "Para el stock subí un archivo Excel (.xlsx o .xls), LibreOffice (.ods) o CSV" });
  }
  const dryRun = req.query.dryRun === "true";

  let records;
  try {
    records = await readRecords(req.file);
  } catch {
    return res.status(400).json({ message: "No pudimos leer el archivo. Verificá que sea un Excel válido" });
  }

  const columns = detectStockColumns(records);
  if (!columns) {
    return res.status(400).json({
      message: "No encontramos las columnas. El archivo tiene que tener una columna STOCK y una PRODUCTO o CÓDIGO (como el Excel que se descarga en \"Descargar stock\")."
    });
  }

  const dataRecords = [];
  for (let i = columns.firstDataIndex; i < records.length; i++) {
    if (!isEmptyRecord(records[i])) dataRecords.push({ row: i + 1, record: records[i] });
  }
  if (!dataRecords.length) return res.status(400).json({ message: "El archivo no tiene productos" });
  if (dataRecords.length > MAX_ROWS) {
    return res.status(400).json({ message: `El archivo tiene ${dataRecords.length} filas; el máximo es ${MAX_ROWS}` });
  }

  const products = await Product.find().select("name sku stock").lean();
  const bySku = new Map(products.filter((p) => p.sku).map((p) => [p.sku.toLowerCase(), p]));
  const byName = new Map();
  for (const p of products) {
    const key = nameKey(p.name);
    byName.set(key, byName.has(key) ? null : p); // null = dos productos con el mismo nombre
  }

  const changed = [];
  const notFound = [];
  const errors = [];
  const seen = new Map(); // productId -> fila donde apareció
  let unchanged = 0;

  for (const { row, record } of dataRecords) {
    const name = columns.nameCol !== -1 ? String(record[columns.nameCol] ?? "").trim() : "";
    const sku = columns.skuCol !== -1 ? String(record[columns.skuCol] ?? "").trim() : "";
    const rawStock = record[columns.stockCol];
    if (!name && !sku) continue;

    if (rawStock === "" || rawStock == null) {
      errors.push({ row, name: name || sku, message: "Falta el stock" });
      continue;
    }
    const stock = parseAmount(rawStock);
    if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
      errors.push({ row, name: name || sku, message: `Stock inválido: "${rawStock}". Tiene que ser un número entero, 0 o más` });
      continue;
    }

    const nameMatch = name ? byName.get(nameKey(name)) : undefined;
    const product = (sku && bySku.get(sku.toLowerCase())) || nameMatch;
    if (!product) {
      if (nameMatch === null) errors.push({ row, name, message: "Hay más de un producto con este nombre: agregale el código para diferenciarlos" });
      else notFound.push({ row, name: name || sku });
      continue;
    }
    const id = product._id.toString();
    if (seen.has(id)) {
      errors.push({ row, name: product.name, message: `El producto aparece repetido (ya está en la fila ${seen.get(id)}); se usa esa fila` });
      continue;
    }
    seen.set(id, row);

    if (product.stock === stock) unchanged++;
    else changed.push({ row, productId: product._id, name: product.name, sku: product.sku || "", before: product.stock, after: stock });
  }

  if (!dryRun && changed.length) {
    await Product.bulkWrite(
      changed.map((c) => ({ updateOne: { filter: { _id: c.productId }, update: { $set: { stock: c.after } } } }))
    );
  }

  res.json({
    dryRun,
    totalRows: dataRecords.length,
    changed: changed.map(({ productId, ...rest }) => rest),
    unchanged,
    notFound,
    errors: errors.sort((a, b) => a.row - b.row)
  });
});
