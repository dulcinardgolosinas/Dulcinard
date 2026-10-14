import Product, { LOW_STOCK_FILTER } from "../models/Product.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMany, deleteMany } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";
import { parsePagination, paginatedResponse, searchRegex, queryString } from "../utils/query.js";
import { isAdmin } from "../middleware/auth.js";
import { getActivePromotions, withPricing } from "../utils/pricing.js";

const MISC_CATEGORY_NAME = "Artículos Varios";

// stockStatus del filtro del panel admin
const STOCK_STATUS_FILTERS = {
  ok: { $expr: { $gt: ["$stock", { $ifNull: ["$minStock", 0] }] } }, // por encima del mínimo
  low: LOW_STOCK_FILTER, // en o por debajo del mínimo: "Reponer stock"
  out: { stock: { $lte: 0 } } // sin stock
};

// Únicos ordenamientos aceptados desde la query (evita ordenar por campos internos).
const SORT_OPTIONS = ["-createdAt", "createdAt", "price", "-price", "name", "-name", "stock", "-stock"];
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const listProducts = asyncHandler(async (req, res) => {
  // Todos los filtros se leen como texto plano: un ?brand[$regex]=... armado
  // desde la consola se descarta en vez de llegar a Mongo como operador.
  const q = queryString(req.query.q);
  const search = queryString(req.query.search);
  const category = queryString(req.query.category);
  const brand = queryString(req.query.brand);
  const unit = queryString(req.query.unit);
  const stockStatus = queryString(req.query.stockStatus);
  const sort = SORT_OPTIONS.includes(req.query.sort) ? req.query.sort : "-createdAt";
  const ids = queryString(req.query.ids)
    .split(",")
    .filter((id) => OBJECT_ID_REGEX.test(id))
    .slice(0, 100);

  // Los productos inactivos y el filtro de stock solo los ve un admin.
  const admin = isAdmin(req);
  const filter = admin && req.query.all === "true" ? {} : { active: true };

  if (q) filter.$text = { $search: q };
  // Búsqueda parcial (ej: "choco" encuentra "Chocolate"), usada por el panel admin.
  if (search) {
    const regex = searchRegex(search);
    filter.$or = [{ name: regex }, { sku: regex }, { brand: regex }];
  }
  // Carrito: refresca precio/stock de productos puntuales.
  if (req.query.ids !== undefined) filter._id = { $in: ids };
  if (admin && STOCK_STATUS_FILTERS[stockStatus]) Object.assign(filter, STOCK_STATUS_FILTERS[stockStatus]);
  if (category) {
    if (!OBJECT_ID_REGEX.test(category)) return res.json(paginatedResponse([], 0, parsePagination(req.query, 24)));
    // "Artículos Varios" es una vidriera: en vez de requerir que se etiqueten
    // productos ahí a mano, muestra una mezcla del resto de las categorías.
    const categoryDoc = await Category.findById(category).select("name");
    filter.category = categoryDoc?.name === MISC_CATEGORY_NAME ? { $ne: category } : category;
  }
  if (brand) filter.brand = brand;
  if (unit) filter.unit = unit;
  if (req.query.featured === "true") filter.featured = true;
  const { minPrice, maxPrice } = req.query;
  const min = Number.parseFloat(minPrice);
  const max = Number.parseFloat(maxPrice);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    filter.price = {};
    if (Number.isFinite(min)) filter.price.$gte = min;
    if (Number.isFinite(max)) filter.price.$lte = max;
  }

  const pagination = parsePagination(req.query, 24);

  const [items, total, promotions] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit),
    Product.countDocuments(filter),
    getActivePromotions()
  ]);

  res.json(paginatedResponse(items.map((p) => withPricing(p, promotions)), total, pagination));
});

export const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = OBJECT_ID_REGEX.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  // Un producto desactivado no se puede ver por URL directa (salvo un admin).
  if (!isAdmin(req)) query.active = true;
  const product = await Product.findOne(query).populate("category", "name slug");
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(withPricing(product, await getActivePromotions()));
});

export const listBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct("brand", { active: true, brand: { $ne: "" } });
  res.json(brands.sort());
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, brand, category, sku, price, unit, unitsPerPack, stock, minStock, minOrderQty, featured, active } =
    req.body;

  const product = new Product({
    name,
    description,
    brand,
    category,
    sku: sku || undefined,
    price,
    unit,
    unitsPerPack,
    stock,
    minStock,
    minOrderQty,
    featured,
    active
  });

  if (req.files?.length) {
    product.images = await uploadMany(req.files, CLOUDINARY_FOLDERS.products);
  }

  await product.save();
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  const fields = [
    "name",
    "description",
    "brand",
    "category",
    "sku",
    "price",
    "unit",
    "unitsPerPack",
    "stock",
    "minStock",
    "minOrderQty",
    "featured",
    "active"
  ];
  for (const field of fields) {
    if (req.body[field] === undefined) continue;
    product[field] = field === "sku" ? req.body[field] || undefined : req.body[field];
  }

  // removeImages: array de publicIds a borrar, enviado como JSON string desde el form
  if (req.body.removeImages) {
    let toRemove;
    try {
      toRemove = JSON.parse(req.body.removeImages);
    } catch {
      return res.status(400).json({ message: "Lista de imágenes a borrar inválida" });
    }
    // Solo se pueden borrar imágenes que pertenecen a ESTE producto.
    const ownIds = new Set(product.images.map((img) => img.publicId));
    toRemove = Array.isArray(toRemove) ? toRemove.filter((id) => typeof id === "string" && ownIds.has(id)) : [];
    if (toRemove.length) {
      await deleteMany(toRemove);
      product.images = product.images.filter((img) => !toRemove.includes(img.publicId));
    }
  }

  if (req.files?.length) {
    const uploaded = await uploadMany(req.files, CLOUDINARY_FOLDERS.products);
    product.images = [...product.images, ...uploaded];
  }

  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  await deleteMany(product.images.map((img) => img.publicId));
  await product.deleteOne();
  res.json({ message: "Producto eliminado" });
});
