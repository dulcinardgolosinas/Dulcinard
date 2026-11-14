import Promotion from "../models/Promotion.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";
import { promoLabel, occasionLabel, scopeOf } from "../utils/promotionTypes.js";

// Fechas: llegan con hora ("2026-11-30T09:00", hora de Argentina) o solo el día
// ("2026-11-30": arranca a las 00:00 y termina a las 23:59 de ese día). Siempre
// en hora de Argentina, no en UTC (que cortaría la promo 3 horas antes).
const AR_OFFSET = "-03:00";
export function parseArDate(value, { endOfDay = false } = {}) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}${AR_OFFSET}`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(`${value}:00${endOfDay ? ".999" : ".000"}${AR_OFFSET}`);
  return new Date(value);
}

// Precio que llega del formulario: vacío = sin precio propio (null).
const toPrice = (value) => (value === undefined ? undefined : value === "" || value === null ? null : Number(value));
const toNumber = (value) => (value === undefined || value === "" ? undefined : Number(value));

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

// Lo que se puede cargar desde el formulario (create y update comparten la lógica).
function applyFields(promotion, body) {
  const set = (key, value) => value !== undefined && (promotion[key] = value);
  set("title", body.title);
  set("description", body.description);
  promotion.type = "percent";
  set("discountPercent", toNumber(body.discountPercent));
  set("occasion", body.occasion);
  set("occasionName", body.occasion === "otra" ? body.occasionName : body.occasion !== undefined ? "" : undefined);
  set("scope", body.scope);
  if (body.products !== undefined) promotion.products = parseIdList(body.products);
  if (body.categories !== undefined) promotion.categories = parseIdList(body.categories);
  if (body.price !== undefined) promotion.price = toPrice(body.price);
  if (body.regularPrice !== undefined) promotion.regularPrice = toPrice(body.regularPrice);
  set("showInPopup", body.showInPopup);
  if (body.startDate !== undefined) promotion.startDate = parseArDate(body.startDate);
  if (body.endDate !== undefined) promotion.endDate = parseArDate(body.endDate, { endOfDay: true });
  set("active", body.active);

  // Lo que no corresponde al alcance elegido no queda guardado (evita descuentos "fantasma").
  const scope = promotion.scope;
  if (scope === "all") {
    promotion.products = [];
    promotion.categories = [];
  } else if (scope === "categories") promotion.products = [];
  else if (scope === "products") promotion.categories = [];
}

// Datos para mostrar: etiqueta del badge ("-20%") y nombre de la ocasión.
const present = (p) => {
  const json = typeof p.toJSON === "function" ? p.toJSON() : p;
  return { ...json, scope: scopeOf(json), label: promoLabel(json), occasionLabel: occasionLabel(json) };
};

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
  res.json(promotions.map(present));
});

// Público y liviano, para la sección de promociones del home: solo las
// vigentes y solo los campos que se muestran.
export const listHomePromotions = asyncHandler(async (req, res) => {
  const now = new Date();
  const promotions = await Promotion.find({ active: true, startDate: { $lte: now }, endDate: { $gte: now } })
    .select(
      "title description type discountPercent occasion occasionName scope price regularPrice showInPopup banner.url startDate endDate categories products"
    )
    .populate("categories", "name slug")
    .populate({ path: "products", select: "name slug", match: { active: true } })
    .sort({ discountPercent: -1, endDate: 1 })
    .limit(12)
    .lean();
  // El navegador puede reusar la respuesta un minuto: las promos no cambian tan seguido.
  res.set("Cache-Control", "public, max-age=60");
  res.json(promotions.map(present));
});

export const getPromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id).populate("products", "name slug").populate("categories", "name slug");
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });
  res.json(present(promotion));
});

export const createPromotion = asyncHandler(async (req, res) => {
  const promotion = new Promotion({ showInPopup: true });
  applyFields(promotion, req.body);
  if (req.file) promotion.banner = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.promotions);
  await promotion.save();
  res.status(201).json(present(promotion));
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });

  applyFields(promotion, req.body);
  if (req.file) {
    if (promotion.banner?.publicId) await deleteImage(promotion.banner.publicId);
    promotion.banner = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.promotions);
  }
  await promotion.save();
  res.json(present(promotion));
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });

  if (promotion.banner?.publicId) await deleteImage(promotion.banner.publicId);
  await promotion.deleteOne();
  res.json({ message: "Promoción eliminada" });
});
