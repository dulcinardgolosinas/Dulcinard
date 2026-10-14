import { randomBytes } from "node:crypto";
import slugify from "slugify";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { readRecords, normalizeHeader, parseAmount } from "../utils/spreadsheet.js";
import { ALPHANUMERIC_TEXT_REGEX, SKU_REGEX } from "../utils/validationPatterns.js";
import { nameKey } from "../utils/query.js";

// Carga y actualización de productos desde la lista de un proveedor (Excel, CSV
// o PDF con, como mínimo, una columna de producto y una de precio):
//   - si el producto ya existe (mismo código o mismo nombre) se actualiza su precio;
//   - si no existe y se pidió "crear los nuevos", se da de alta con ese precio.
// Así la misma lista sirve para la carga inicial y para las actualizaciones
// siguientes, sin duplicar productos. Nunca borra nada.

const MAX_ROWS = 5000;
// Productos nuevos: stock con el que se crean (se ajusta después en cada uno) y
// categoría cuando no se puede deducir del nombre.
const INITIAL_STOCK = 100;
const FALLBACK_CATEGORY_NAME = "Golosinas";
// Un cambio de precio mayor a este porcentaje se marca para revisar (ej: un
// "1,428" leído como 1.428 en vez de 1428).
const BIG_CHANGE_RATIO = 0.5;

const NAME_HEADERS = ["producto", "productos", "nombre", "descripcion", "articulo", "articulos", "detalle", "item", "name", "product"];
const SKU_HEADERS = ["sku", "codigo", "cod", "code", "cod_articulo", "codigo_articulo"];
const isPriceHeader = (h) => h === "price" || h === "importe" || h === "valor" || h.startsWith("precio") || h === "p_unit";


// Prefijo del nombre en la lista del proveedor -> palabras que se buscan en el
// nombre de las categorías, en orden de preferencia. Ej: "ALF. TOFI..." va a
// una categoría "Alfajores" si existe, si no a "Golosinas".
const CATEGORY_HINTS = {
  alf: ["alfajor", "golosina"],
  gall: ["galleti", "galleta"],
  bizc: ["bizcoch", "galleta"],
  magdalena: ["magdalena", "galleta"],
  tapitas: ["galleta"],
  trio: ["galleta"],
  choc: ["chocolate"],
  chocolatin: ["chocolate"],
  chocman: ["chocolate"],
  tab: ["chocolate"],
  bomb: ["bombon", "chocolate"],
  bomba: ["chocolate", "golosina"],
  huevo: ["chocolate"],
  obl: ["oblea", "golosina"],
  gom: ["gomita", "golosina"],
  gomitas: ["gomita", "golosina"],
  chic: ["chicle", "golosina"],
  car: ["caramelo", "golosina"],
  chup: ["chupetin", "chupete", "golosina"],
  chupetoncitos: ["chupetin", "chupete", "golosina"],
  past: ["pastilla", "golosina"],
  sugus: ["caramelo", "golosina"],
  lenguetazo: ["golosina"],
  malvavisco: ["golosina"],
  cub: ["golosina"],
  turron: ["turron"],
  barrita: ["barrita", "turron"],
  cereal: ["cereal", "barrita"],
  mantecol: ["turron"],
  nucrem: ["turron"],
  ducrem: ["chocolate"],
  mani: ["mani", "comestible"],
  pasta: ["comestible"],
  sem: ["comestible"],
  nutella: ["comestible"],
  relleno: ["comestible"],
  toddy: ["chocolate"]
};

/** Categoría sugerida según el prefijo del nombre (null si no hay una que encaje). */
export function guessCategory(productName, categories) {
  const prefix = nameKey(productName).split(" ")[0];
  for (const hint of CATEGORY_HINTS[prefix] || []) {
    const match = categories.find((c) => nameKey(c.name).includes(hint));
    if (match) return match;
  }
  return null;
}

const hasLetters = (value) => typeof value === "string" && /[a-zA-ZÀ-ÿ]{2,}/.test(value);
const isEmptyRecord = (record) => !record || record.every((v) => v === "" || v == null);

/**
 * Encuentra las columnas de nombre, precio y (opcional) código.
 * 1) Busca una fila de encabezados (PRODUCTO / PRECIO / CODIGO...) en las
 *    primeras 30 filas, aunque haya filas vacías o un título arriba.
 * 2) Si el archivo no tiene encabezados, las deduce por el contenido: la
 *    columna con más números es el precio y la con más texto, el nombre.
 */
function detectColumns(records) {
  for (let i = 0; i < Math.min(records.length, 30); i++) {
    const headers = (records[i] || []).map(normalizeHeader);
    const nameCol = headers.findIndex((h) => NAME_HEADERS.includes(h));
    const priceCol = headers.findIndex((h) => isPriceHeader(h));
    if (nameCol !== -1 && priceCol !== -1) {
      const skuCol = headers.findIndex((h) => SKU_HEADERS.includes(h));
      return { nameCol, priceCol, skuCol, firstDataIndex: i + 1 };
    }
  }

  const sample = records.filter((r) => !isEmptyRecord(r)).slice(0, 100);
  const width = Math.max(0, ...sample.map((r) => r.length));
  const numeric = Array(width).fill(0);
  const textual = Array(width).fill(0);
  for (const record of sample) {
    record.forEach((value, col) => {
      if (hasLetters(value)) textual[col]++;
      else if (value !== "" && Number.isFinite(parseAmount(value))) numeric[col]++;
    });
  }
  const priceCol = numeric.indexOf(Math.max(...numeric));
  const nameCol = textual.indexOf(Math.max(...textual));
  const enough = (count) => count >= Math.max(1, sample.length * 0.5);
  if (priceCol === -1 || nameCol === -1 || priceCol === nameCol || !enough(numeric[priceCol]) || !enough(textual[nameCol])) {
    return null;
  }
  return { nameCol, priceCol, skuCol: -1, firstDataIndex: 0 };
}

// POST /products/import/prices  (multipart, campo "file")
// ?dryRun=true muestra qué cambiaría sin guardar nada.
export const updatePricesFromFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Elegí un archivo Excel, CSV o PDF" });
  const dryRun = req.query.dryRun === "true";

  let records;
  try {
    records = await readRecords(req.file);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    return res.status(400).json({ message: "No pudimos leer el archivo. Verificá que sea un Excel, CSV o PDF válido" });
  }

  const columns = detectColumns(records);
  if (!columns) {
    return res.status(400).json({
      message: "No encontramos las columnas de producto y precio. Asegurate de que el archivo tenga una columna PRODUCTO y una PRECIO."
    });
  }

  const dataRecords = [];
  for (let i = columns.firstDataIndex; i < records.length; i++) {
    if (!isEmptyRecord(records[i])) dataRecords.push({ rowNumber: i + 1, record: records[i] });
  }
  if (dataRecords.length === 0) {
    const isPdf = /\.pdf$/i.test(req.file.originalname);
    return res.status(400).json({
      message: isPdf
        ? "No encontramos renglones con precio en el PDF. Si es una imagen escaneada no se puede leer: pedí la lista en Excel o PDF con texto."
        : "El archivo no tiene productos"
    });
  }
  if (dataRecords.length > MAX_ROWS) {
    return res.status(400).json({ message: `El archivo tiene ${dataRecords.length} filas; el máximo es ${MAX_ROWS}` });
  }

  // Todos los productos (también los inactivos) para buscar por código y por nombre.
  const products = await Product.find().select("name sku price").lean();
  const bySku = new Map(products.filter((p) => p.sku).map((p) => [p.sku.toLowerCase(), p]));
  const byName = new Map();
  for (const p of products) {
    const key = nameKey(p.name);
    byName.set(key, byName.has(key) ? null : p); // null = dos productos con el mismo nombre
  }

  // Los productos nuevos van a la categoría que se deduce del nombre; si no se
  // puede, a "Golosinas" (que se crea si todavía no existe).
  const categories = await Category.find({ active: true }).select("name").lean();
  const fallbackCategory = categories.find((c) => nameKey(c.name) === nameKey(FALLBACK_CATEGORY_NAME)) || {
    _id: null,
    name: FALLBACK_CATEGORY_NAME
  };

  const changed = [];
  const toCreate = [];
  const errors = [];
  let unchanged = 0;
  const seen = new Map(); // productId -> { row, price }
  const seenNew = new Map(); // nameKey -> { row, price } de productos que no existen

  for (const { rowNumber, record } of dataRecords) {
    const fileName = String(record[columns.nameCol] ?? "").trim();
    const sku = columns.skuCol !== -1 ? String(record[columns.skuCol] ?? "").trim() : "";
    const rawPrice = record[columns.priceCol];
    if (!fileName && !sku) continue;

    const price = Math.round(parseAmount(rawPrice) * 100) / 100;
    if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
      errors.push({ row: rowNumber, name: fileName, message: `Precio inválido: "${rawPrice}"` });
      continue;
    }

    const nameMatch = byName.get(nameKey(fileName));
    const product = (sku && bySku.get(sku.toLowerCase())) || nameMatch;
    if (nameMatch === null && !product) {
      errors.push({ row: rowNumber, name: fileName, message: "Hay más de un producto con este nombre: cargale un código (SKU) para diferenciarlos" });
      continue;
    }
    if (!product) {
      // Una misma línea repetida en la lista se toma una sola vez.
      const key = nameKey(fileName);
      const previousNew = seenNew.get(key);
      if (previousNew) {
        if (previousNew.price !== price) {
          errors.push({
            row: rowNumber,
            name: fileName,
            message: `Aparece repetido con otro precio (fila ${previousNew.row}: $${previousNew.price}); se usa el de la fila ${previousNew.row}`
          });
        }
        continue;
      }
      seenNew.set(key, { row: rowNumber, price });

      const nameError = validateNewName(fileName);
      if (nameError) {
        errors.push({ row: rowNumber, name: fileName, message: nameError });
        continue;
      }
      const category = guessCategory(fileName, categories) || fallbackCategory;
      toCreate.push({ row: rowNumber, name: fileName, price, sku, category });
      continue;
    }

    const id = String(product._id);
    const previous = seen.get(id);
    if (previous) {
      // La misma línea repetida con el mismo precio no es un problema.
      if (previous.price !== price) {
        errors.push({
          row: rowNumber,
          name: fileName,
          message: `Aparece repetido con otro precio (fila ${previous.row}: $${previous.price}); se usa el de la fila ${previous.row}`
        });
      }
      continue;
    }
    seen.set(id, { row: rowNumber, price });

    if (product.price === price) {
      unchanged++;
      continue;
    }
    const bigChange = product.price > 0 && Math.abs(price - product.price) / product.price > BIG_CHANGE_RATIO;
    changed.push({ row: rowNumber, productId: id, name: product.name, oldPrice: product.price, newPrice: price, bigChange });
  }

  if (!dryRun && changed.length) {
    await Product.bulkWrite(
      changed.map((c) => ({ updateOne: { filter: { _id: c.productId }, update: { $set: { price: c.newPrice } } } }))
    );
  }

  let created = toCreate;
  if (!dryRun && toCreate.length) {
    if (!fallbackCategory._id && toCreate.some((item) => item.category === fallbackCategory)) {
      // Upsert: si dos cargas corren a la vez, no se crean dos "Golosinas".
      const category = await Category.findOneAndUpdate(
        { name: FALLBACK_CATEGORY_NAME },
        { $setOnInsert: { name: FALLBACK_CATEGORY_NAME, slug: slugify(FALLBACK_CATEGORY_NAME, { lower: true, strict: true }) } },
        { upsert: true, new: true }
      );
      fallbackCategory._id = category._id;
    }
    created = await createProducts(toCreate, INITIAL_STOCK, errors);
  }

  res.json({
    dryRun,
    totalRows: dataRecords.length,
    changed: changed.map(({ productId, ...rest }) => rest),
    unchanged,
    created: created.map((c) => ({ row: c.row, name: c.name, price: c.price, category: c.category.name })),
    errors: errors.sort((a, b) => a.row - b.row)
  });
});

function validateNewName(name) {
  if (name.length < 2 || name.length > 150) return "El nombre debe tener entre 2 y 150 caracteres para crear el producto";
  if (!ALPHANUMERIC_TEXT_REGEX.test(name)) return "El nombre tiene caracteres no permitidos para crear el producto";
  return null;
}

// Alta en bloque (una sola operación a la base, rápido aunque sean cientos).
// El slug se arma acá con un sufijo aleatorio para que nunca choquen entre sí.
async function createProducts(items, initialStock, errors) {
  const docs = items.map((item) => ({
    name: item.name,
    slug: `${slugify(item.name, { lower: true, strict: true, locale: "es" })}-${randomBytes(3).toString("hex")}`,
    sku: item.sku && SKU_REGEX.test(item.sku) ? item.sku : undefined,
    category: item.category._id,
    price: item.price,
    stock: initialStock,
    active: true
  }));
  try {
    await Product.insertMany(docs, { ordered: false });
    return items;
  } catch (err) {
    // Con ordered: false se guardan todos los que se pueden; se informa el resto.
    const failed = new Set((err.writeErrors || []).map((e) => e.index ?? e.err?.index));
    items.forEach((item, i) => {
      if (failed.has(i)) errors.push({ row: item.row, name: item.name, message: "No se pudo crear (¿código SKU repetido?)" });
    });
    if (!err.writeErrors) throw err;
    return items.filter((_, i) => !failed.has(i));
  }
}
