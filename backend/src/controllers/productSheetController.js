import { randomBytes } from "crypto";
import mongoose from "mongoose";
import slugify from "slugify";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { readRecords, normalizeHeader, parseAmount } from "../utils/spreadsheet.js";
import { buildWorkbook, formatArDate, sendWorkbook } from "../utils/excelExport.js";
import { nameKey } from "../utils/query.js";
import { ALPHANUMERIC_TEXT_REGEX, SKU_REGEX } from "../utils/validationPatterns.js";

// Planilla única de productos: Código/ID, Producto, Precio, Categoría, Stock.
// Se descarga, se edita y se vuelve a subir eligiendo qué columnas actualizar
// y si los productos que no existen se crean o se ignoran. Nunca borra nada.

export const SHEET_FIELDS = ["name", "price", "category", "stock"];
const FIELD_LABELS = { name: "Producto", price: "Precio", category: "Categoría", stock: "Stock" };
const MAX_ROWS = 5000;
const MAX_PRICE = 100_000_000;
const MAX_STOCK = 10_000_000;

const HEADERS = {
  code: ["codigo_id", "codigo", "cod", "sku", "code", "id", "codigo_articulo", "cod_articulo"],
  name: ["producto", "productos", "nombre", "descripcion", "articulo", "detalle", "name", "product"],
  price: ["precio", "precio", "precio_unitario", "precio_mayorista", "price", "importe"],
  category: ["categoria", "categorias", "rubro", "category"],
  stock: ["stock", "stock_actual", "existencia", "existencias", "cantidad", "unidades"]
};

function detectColumns(records) {
  for (let i = 0; i < Math.min(records.length, 30); i++) {
    const headers = (records[i] || []).map(normalizeHeader);
    const col = (key) => headers.findIndex((h) => HEADERS[key].includes(h) || HEADERS[key].some((x) => h.startsWith(`${x}_`)));
    const found = { code: col("code"), name: col("name"), price: col("price"), category: col("category"), stock: col("stock") };
    if (found.code !== -1 || found.name !== -1) return { ...found, firstDataIndex: i + 1 };
  }
  return null;
}

const isEmptyRecord = (record) => !record || record.every((v) => v === "" || v == null);
const cell = (record, index) => (index === -1 ? "" : String(record[index] ?? "").trim());

// GET /products/export/sheet
export const exportProductSheet = asyncHandler(async (req, res) => {
  const products = await Product.find().select("name sku price stock category").populate("category", "name").lean();
  products.sort(
    (a, b) => (a.category?.name || "").localeCompare(b.category?.name || "", "es") || a.name.localeCompare(b.name, "es")
  );
  const buffer = buildWorkbook([
    {
      name: "Productos",
      columns: [
        { header: "Código/ID", width: 26 },
        { header: "Producto", width: 46 },
        { header: "Precio", width: 14, format: "money" },
        { header: "Categoría", width: 22 },
        { header: "Stock", width: 10, format: "int" }
      ],
      // Si el producto no tiene código propio se usa su ID interno, así cada fila se reconoce al volver a subirla.
      rows: products.map((p) => [p.sku || p._id.toString(), p.name, p.price, p.category?.name || "", p.stock])
    }
  ]);
  const today = formatArDate(new Date(), { withTime: false }).split("/").reverse().join("-");
  sendWorkbook(res, buffer, `productos_${today}.xlsx`);
});

/** Lee y valida el valor de una columna. Devuelve { value } o { error }. */
function readField(field, raw, categoriesByKey) {
  if (raw === "") return { error: `Falta ${FIELD_LABELS[field].toLowerCase()}` };
  if (field === "price") {
    const price = parseAmount(raw);
    if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) return { error: `Precio inválido: "${raw}". Tiene que ser un número` };
    return { value: Math.round(price * 100) / 100 };
  }
  if (field === "stock") {
    const stock = parseAmount(raw);
    if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) return { error: `Stock inválido: "${raw}". Tiene que ser un número entero, 0 o más` };
    return { value: stock };
  }
  if (field === "category") {
    const category = categoriesByKey.get(nameKey(raw));
    if (!category) return { error: `La categoría "${raw}" no existe. Creala primero en Categorías o corregí el nombre` };
    return { value: category };
  }
  // name
  if (raw.length < 2 || raw.length > 150) return { error: "El nombre tiene que tener entre 2 y 150 caracteres" };
  if (!ALPHANUMERIC_TEXT_REGEX.test(raw)) return { error: "El nombre tiene caracteres no permitidos" };
  return { value: raw };
}

const display = (field, value) => (field === "category" ? value?.name || "" : value);

// POST /products/import/sheet  (multipart, campo "file")
// Query: fields=price,stock,... (columnas a actualizar), createMissing=true|false, dryRun=true|false
export const importProductSheet = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Elegí la planilla de productos" });
  if (!/\.(xlsx|xls|ods|csv|pdf)$/i.test(req.file.originalname)) {
    return res.status(400).json({ message: "Subí la planilla en Excel (.xlsx o .xls), LibreOffice (.ods), CSV o PDF" });
  }
  const dryRun = req.query.dryRun === "true";
  const createMissing = req.query.createMissing === "true";
  const fields = String(req.query.fields || "")
    .split(",")
    .filter((f) => SHEET_FIELDS.includes(f));
  if (!fields.length && !createMissing) {
    return res.status(400).json({ message: "Elegí al menos una columna para actualizar o la opción de crear los productos nuevos" });
  }

  let records;
  try {
    records = await readRecords(req.file);
  } catch {
    return res.status(400).json({ message: "No pudimos leer el archivo. Verificá que sea un Excel válido" });
  }
  const columns = detectColumns(records);
  if (!columns) {
    return res.status(400).json({ message: "No encontramos las columnas. Usá la planilla que se descarga en \"Descargar planilla de productos\"." });
  }
  const missingColumns = fields.filter((f) => columns[f] === -1).map((f) => FIELD_LABELS[f]);
  if (missingColumns.length) {
    return res.status(400).json({ message: `Elegiste actualizar ${missingColumns.join(", ")}, pero el archivo no tiene esa columna` });
  }

  const dataRecords = [];
  for (let i = columns.firstDataIndex; i < records.length; i++) {
    if (!isEmptyRecord(records[i])) dataRecords.push({ row: i + 1, record: records[i] });
  }
  if (!dataRecords.length) return res.status(400).json({ message: "La planilla no tiene productos" });
  if (dataRecords.length > MAX_ROWS) return res.status(400).json({ message: `La planilla tiene ${dataRecords.length} filas; el máximo es ${MAX_ROWS}` });

  const [products, categories] = await Promise.all([
    Product.find().select("name sku price stock category").populate("category", "name").lean(),
    Category.find().select("name").lean()
  ]);
  const categoriesByKey = new Map(categories.map((c) => [nameKey(c.name), c]));
  const byCode = new Map();
  for (const p of products) {
    byCode.set(p._id.toString(), p);
    if (p.sku) byCode.set(p.sku.toLowerCase(), p);
  }
  const byName = new Map();
  for (const p of products) {
    const key = nameKey(p.name);
    byName.set(key, byName.has(key) ? null : p); // null = dos productos con el mismo nombre
  }

  const toUpdate = [];
  const toCreate = [];
  const ignored = [];
  const errors = [];
  const seen = new Map(); // producto (o nombre nuevo) -> fila donde apareció
  let unchanged = 0;

  for (const { row, record } of dataRecords) {
    const code = cell(record, columns.code);
    const name = cell(record, columns.name);
    const label = name || code;
    if (!code && !name) {
      errors.push({ row, name: "(fila sin código ni nombre)", message: "La fila no tiene código ni nombre de producto" });
      continue;
    }

    const nameMatch = name ? byName.get(nameKey(name)) : undefined;
    const product = (code && byCode.get(code.toLowerCase())) || nameMatch;

    if (!product) {
      if (nameMatch === null) {
        errors.push({ row, name: label, message: "Hay más de un producto con este nombre: agregale el código para diferenciarlos" });
        continue;
      }
      if (!createMissing) {
        ignored.push({ row, name: label });
        continue;
      }
      // Producto nuevo: necesita nombre, precio y categoría (el stock, si falta, es 0).
      const values = {};
      const rowErrors = [];
      for (const field of ["name", "price", "category"]) {
        if (columns[field] === -1) rowErrors.push(`Para crear el producto falta la columna ${FIELD_LABELS[field]}`);
        else {
          const r = readField(field, cell(record, columns[field]), categoriesByKey);
          if (r.error) rowErrors.push(r.error);
          else values[field] = r.value;
        }
      }
      const rawStock = cell(record, columns.stock);
      if (rawStock !== "") {
        const r = readField("stock", rawStock, categoriesByKey);
        if (r.error) rowErrors.push(r.error);
        else values.stock = r.value;
      }
      const newKey = `new:${nameKey(name)}`;
      if (!rowErrors.length && seen.has(newKey)) rowErrors.push(`El producto aparece repetido (ya está en la fila ${seen.get(newKey)})`);
      if (rowErrors.length) {
        errors.push({ row, name: label, message: rowErrors.join(". ") });
        continue;
      }
      seen.set(newKey, row);
      const sku = code && !mongoose.isValidObjectId(code) && SKU_REGEX.test(code) ? code : "";
      toCreate.push({ row, sku, name: values.name, price: values.price, category: values.category, stock: values.stock ?? 0 });
      continue;
    }

    const id = product._id.toString();
    if (seen.has(id)) {
      errors.push({ row, name: product.name, message: `El producto aparece repetido (ya está en la fila ${seen.get(id)}); se usa esa fila` });
      continue;
    }
    seen.set(id, row);

    // Solo las columnas elegidas: las demás no se tocan aunque vengan en el archivo.
    const changes = [];
    const rowErrors = [];
    for (const field of fields) {
      const r = readField(field, cell(record, columns[field]), categoriesByKey);
      if (r.error) {
        rowErrors.push(r.error);
        continue;
      }
      const before = field === "category" ? product.category : product[field];
      const same = field === "category" ? before?._id?.toString() === r.value._id.toString() : before === r.value;
      if (!same) changes.push({ field, before: display(field, before), after: display(field, r.value), value: r.value });
    }
    if (rowErrors.length) {
      errors.push({ row, name: product.name, message: rowErrors.join(". ") });
      continue;
    }
    if (!changes.length) unchanged++;
    else toUpdate.push({ row, productId: product._id, code: product.sku || id, name: product.name, changes });
  }

  let created = 0;
  if (!dryRun) {
    if (toUpdate.length) {
      await Product.bulkWrite(
        toUpdate.map((u) => ({
          updateOne: {
            filter: { _id: u.productId },
            update: {
              $set: Object.fromEntries(u.changes.map((c) => [c.field, c.field === "category" ? c.value._id : c.value]))
            }
          }
        }))
      );
    }
    if (toCreate.length) created = await createProducts(toCreate, errors);
  }

  res.json({
    dryRun,
    fields,
    createMissing,
    totalRows: dataRecords.length,
    toUpdate: toUpdate.map(({ productId, changes, ...rest }) => ({
      ...rest,
      changes: changes.map(({ value, ...c }) => ({ ...c, label: FIELD_LABELS[c.field] }))
    })),
    toCreate: toCreate.map((c) => ({ ...c, category: c.category.name })),
    ignored,
    unchanged,
    errors: errors.sort((a, b) => a.row - b.row),
    created: dryRun ? 0 : created
  });
});

// Alta en bloque. El slug lleva un sufijo aleatorio para que nunca choquen entre sí.
async function createProducts(items, errors) {
  const docs = items.map((item) => ({
    name: item.name,
    slug: `${slugify(item.name, { lower: true, strict: true, locale: "es" })}-${randomBytes(3).toString("hex")}`,
    sku: item.sku || undefined,
    category: item.category._id,
    price: item.price,
    stock: item.stock,
    active: true
  }));
  try {
    await Product.insertMany(docs, { ordered: false });
    return items.length;
  } catch (err) {
    if (!err.writeErrors) throw err;
    const failed = new Set(err.writeErrors.map((e) => e.index ?? e.err?.index));
    items.forEach((item, i) => {
      if (failed.has(i)) errors.push({ row: item.row, name: item.name, message: "No se pudo crear (¿el código ya lo usa otro producto?)" });
    });
    return items.length - failed.size;
  }
}
