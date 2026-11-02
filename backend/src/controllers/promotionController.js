import Promotion from "../models/Promotion.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

// Las fechas llegan como día ("2026-11-30"): la promo arranca a las 00:00 y
// termina a las 23:59 de ese día en hora de Argentina (no en UTC, que
// cortaría la promo a las 21 hs del día anterior).
const AR_OFFSET = "-03:00";
function dayStart(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000${AR_OFFSET}`) : value;
}
function dayEnd(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T23:59:59.999${AR_OFFSET}`) : value;
}

// Precio que llega del formulario: vacío = sin precio propio (null).
const toPrice = (value) => (value === undefined ? undefined : value === "" || value === null ? null : Number(value));

// Lista de IDs enviada como JSON desde el form. Lanza 400 (no 500) si viene malformada.
function parseIdList(raw) {
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    list = null;
  }
  if (!Array.isArray(list) || !list.every((id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id))) {
    throw Object.assign(new Error("Lista de productos o categorías inválida"), { status: 400 });
  }
  return [...new Set(list)];
}

export const listPromotions = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;
  const filter = {};
  if (activeOnly === "true") {
    const now = new Date();
    filter.active = true;
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  }
  const promotions = await Promotion.find(filter)
    .populate("products", "name price images slug")
    .populate("categories", "name slug")
    .sort({ createdAt: -1 });
  res.json(promotions);
});

// Público y liviano, para la sección de promociones del home: solo las
// vigentes y solo los campos que se muestran (sin la lista de productos).
export const listHomePromotions = asyncHandler(async (req, res) => {
  const now = new Date();
  const promotions = await Promotion.find({ active: true, startDate: { $lte: now }, endDate: { $gte: now } })
    .select("title description discountPercent price regularPrice showInPopup banner.url startDate endDate categories products")
    .populate("categories", "name slug")
    .populate({ path: "products", select: "name slug", match: { active: true } })
    .sort({ discountPercent: -1, endDate: 1 })
    .limit(8)
    .lean();
  // El navegador puede reusar la respuesta un minuto: las promos no cambian tan seguido.
  res.set("Cache-Control", "public, max-age=60");
  res.json(promotions);
});

export const getPromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });
  res.json(promotion);
});

export const createPromotion = asyncHandler(async (req, res) => {
  const { title, description, discountPercent, products, categories, startDate, endDate, active, price, regularPrice, showInPopup } = req.body;

  const promotion = new Promotion({
    title,
    description,
    discountPercent,
    price: toPrice(price) ?? null,
    regularPrice: toPrice(regularPrice) ?? null,
    showInPopup: showInPopup ?? true,
    products: products ? parseIdList(products) : [],
    categories: categories ? parseIdList(categories) : [],
    startDate: dayStart(startDate),
    endDate: dayEnd(endDate),
    active
  });

  if (req.file) {
    promotion.banner = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.promotions);
  }

  await promotion.save();
  res.status(201).json(promotion);
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });

  const { title, description, discountPercent, products, categories, startDate, endDate, active, price, regularPrice, showInPopup } = req.body;
  if (title !== undefined) promotion.title = title;
  if (price !== undefined) promotion.price = toPrice(price);
  if (regularPrice !== undefined) promotion.regularPrice = toPrice(regularPrice);
  if (showInPopup !== undefined) promotion.showInPopup = showInPopup;
  if (description !== undefined) promotion.description = description;
  if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
  if (products !== undefined) promotion.products = parseIdList(products);
  if (categories !== undefined) promotion.categories = parseIdList(categories);
  if (startDate !== undefined) promotion.startDate = dayStart(startDate);
  if (endDate !== undefined) promotion.endDate = dayEnd(endDate);
  if (active !== undefined) promotion.active = active;

  if (req.file) {
    if (promotion.banner?.publicId) await deleteImage(promotion.banner.publicId);
    promotion.banner = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.promotions);
  }

  await promotion.save();
  res.json(promotion);
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });

  if (promotion.banner?.publicId) await deleteImage(promotion.banner.publicId);
  await promotion.deleteOne();
  res.json({ message: "Promoción eliminada" });
});
