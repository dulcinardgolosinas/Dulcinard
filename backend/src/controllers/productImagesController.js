import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";
import { nameKey } from "../utils/query.js";

// Subida masiva de fotos: cada archivo se asigna al producto cuyo nombre (o
// código) coincide con el nombre del archivo. Ej: "ALF. TOFI TRIPLE X 78 GR
// NEGRO.jpg" -> producto "ALF. TOFI TRIPLE X 78 GR NEGRO".

const MAX_FILES = 2000; // ~120KB de nombres: entra holgado en el límite de 200KB del body

// Windows no permite / \ : * ? " < > | en nombres de archivo.
const toFileName = (name) => name.replace(/[/\\:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();

// Además de la clave normal se compara sin espacios, para que "V-FRU", "V FRU"
// y "VFRU" encuentren igual a "V/FRU".
const compactKey = (text) => nameKey(text).replace(/ /g, "");

function stripExtension(fileName) {
  return String(fileName).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/\s*\(\d+\)$/, ""); // "foto (1).jpg" -> "foto"
}

// GET /products/images/missing — productos sin foto, con el nombre que debería
// tener cada archivo (para preparar las fotos).
export const listProductsWithoutImages = asyncHandler(async (req, res) => {
  const products = await Product.find({ $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] })
    .select("name sku")
    .sort({ name: 1 })
    .lean();
  res.json(products.map((p) => ({ _id: p._id, name: p.name, sku: p.sku || "", fileName: toFileName(p.name) })));
});

// POST /products/images/match  { fileNames: string[] }
// Dice a qué producto va cada archivo, antes de subir nada.
export const matchImageFiles = asyncHandler(async (req, res) => {
  const { fileNames } = req.body;
  if (!Array.isArray(fileNames) || fileNames.length === 0) {
    return res.status(400).json({ message: "No llegó ninguna foto" });
  }
  if (fileNames.length > MAX_FILES) {
    return res.status(400).json({ message: `Podés subir hasta ${MAX_FILES} fotos por vez` });
  }

  const products = await Product.find().select("name sku images").lean();
  const index = new Map(); // clave -> producto (null si hay más de uno con esa clave)
  const add = (key, product) => {
    if (!key) return;
    const current = index.get(key);
    if (current === undefined) index.set(key, product);
    else if (current && String(current._id) !== String(product._id)) index.set(key, null);
  };
  for (const p of products) {
    add(`n:${nameKey(p.name)}`, p);
    add(`c:${compactKey(p.name)}`, p);
    if (p.sku) {
      add(`n:${nameKey(p.sku)}`, p);
      add(`c:${compactKey(p.sku)}`, p);
    }
  }

  const usedBy = new Map(); // productId -> fileName (dos fotos para el mismo producto)
  const results = fileNames.map((fileName) => {
    if (typeof fileName !== "string" || !fileName.trim()) return { fileName: String(fileName), status: "error", message: "Nombre inválido" };
    const base = stripExtension(fileName);
    const exact = index.get(`n:${nameKey(base)}`);
    const product = exact !== undefined ? exact : index.get(`c:${compactKey(base)}`);

    if (product === null) {
      return { fileName, status: "error", message: "Hay más de un producto con este nombre: usá el código (SKU) como nombre del archivo" };
    }
    if (!product) return { fileName, status: "unmatched", message: "Ningún producto se llama así" };

    const id = String(product._id);
    if (usedBy.has(id)) {
      return { fileName, status: "error", message: `Ya hay otra foto para este producto (${usedBy.get(id)})` };
    }
    usedBy.set(id, fileName);
    return {
      fileName,
      status: "matched",
      productId: id,
      productName: product.name,
      replacesImage: (product.images?.length || 0) > 0
    };
  });

  res.json({
    matched: results.filter((r) => r.status === "matched").length,
    unmatched: results.filter((r) => r.status === "unmatched").length,
    errors: results.filter((r) => r.status === "error").length,
    results
  });
});

// ---- Fotos sacadas de un catálogo PDF ----
// El navegador recorta cada foto del PDF y manda los textos que tiene cerca
// (debajo, al lado). Acá se busca el producto que mejor coincide, por palabras
// en común: en el catálogo el nombre puede estar escrito un poco distinto.

const MAX_CATALOG_PHOTOS = 3000;
const MIN_SCORE = 0.5;

const tokensOf = (text) => nameKey(text).split(" ").filter((t) => t.length > 1 || /\d/.test(t));

// Coeficiente de Dice sobre palabras (0 a 1), con más peso para números y
// medidas ("78", "700gr"), que son lo que distingue variantes de un producto.
function similarity(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const weight = (t) => (/\d/.test(t) ? 2 : 1);
  const bSet = new Set(bTokens);
  const aSet = new Set(aTokens);
  let common = 0;
  for (const t of aSet) if (bSet.has(t)) common += weight(t);
  const total = [...aSet].reduce((s, t) => s + weight(t), 0) + [...bSet].reduce((s, t) => s + weight(t), 0);
  const score = (2 * common) / total;

  // Si los dos tienen números/medidas y no coinciden ("NRO 5" vs "NRO 6",
  // "700GR" vs "1KG"), son productos distintos aunque el resto sea igual.
  const aNums = [...aSet].filter((t) => /\d/.test(t));
  const bNums = [...bSet].filter((t) => /\d/.test(t));
  if (aNums.length && bNums.length && (aNums.some((t) => !bSet.has(t)) || bNums.some((t) => !aSet.has(t)))) {
    return score * 0.4;
  }
  return score;
}

// GET /products/images/options — id y nombre de todos los productos (para
// corregir a mano a qué producto va una foto).
export const listProductOptions = asyncHandler(async (req, res) => {
  const products = await Product.find().select("name images").sort({ name: 1 }).lean();
  res.json(products.map((p) => ({ _id: p._id, name: p.name, hasImage: (p.images?.length || 0) > 0 })));
});

// POST /products/images/suggest  { photos: [{ texts: string[] }] }
export const suggestProductsForPhotos = asyncHandler(async (req, res) => {
  const { photos } = req.body;
  if (!Array.isArray(photos) || photos.length === 0) return res.status(400).json({ message: "No llegó ninguna foto" });
  if (photos.length > MAX_CATALOG_PHOTOS) {
    return res.status(400).json({ message: `El catálogo tiene demasiadas fotos (máximo ${MAX_CATALOG_PHOTOS})` });
  }

  const products = (await Product.find().select("name sku images").lean()).map((p) => ({
    _id: String(p._id),
    name: p.name,
    tokens: tokensOf(p.name),
    sku: p.sku ? nameKey(p.sku) : "",
    hasImage: (p.images?.length || 0) > 0
  }));

  const suggestions = photos.map((photo) => {
    const texts = (Array.isArray(photo?.texts) ? photo.texts : [])
      .filter((t) => typeof t === "string")
      .slice(0, 6)
      .map((t) => t.slice(0, 300));
    let best = null;
    for (const text of texts) {
      const key = nameKey(text);
      const tokens = tokensOf(text);
      for (const p of products) {
        const score = p.sku && key.split(" ").includes(p.sku) ? 1 : similarity(tokens, p.tokens);
        if (!best || score > best.score) best = { productId: p._id, productName: p.name, hasImage: p.hasImage, score, text };
      }
    }
    if (!best || best.score < MIN_SCORE) return { productId: null, score: best?.score || 0, text: texts[0] || "" };
    return { ...best, score: Math.round(best.score * 100) / 100 };
  });

  res.json({ suggestions });
});

// PUT /products/:id/main-image  (multipart, campo "image")
// La foto pasa a ser la principal del producto. Si ya tenía una principal, la
// reemplaza (y la borra de Cloudinary): volver a subir no duplica fotos.
export const setMainImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Falta la foto" });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  const uploaded = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.products);
  const previous = product.images[0];
  product.images = [uploaded, ...product.images.slice(1)];
  await product.save();
  if (previous?.publicId) await deleteImage(previous.publicId);

  res.json({ _id: product._id, name: product.name, image: uploaded });
});
