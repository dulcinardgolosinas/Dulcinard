import Promotion from "../models/Promotion.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

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

export const getPromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promoción no encontrada" });
  res.json(promotion);
});

export const createPromotion = asyncHandler(async (req, res) => {
  const { title, description, discountPercent, products, categories, startDate, endDate, active } = req.body;

  const promotion = new Promotion({
    title,
    description,
    discountPercent,
    products: products ? JSON.parse(products) : [],
    categories: categories ? JSON.parse(categories) : [],
    startDate,
    endDate,
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

  const { title, description, discountPercent, products, categories, startDate, endDate, active } = req.body;
  if (title !== undefined) promotion.title = title;
  if (description !== undefined) promotion.description = description;
  if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
  if (products !== undefined) promotion.products = JSON.parse(products);
  if (categories !== undefined) promotion.categories = JSON.parse(categories);
  if (startDate !== undefined) promotion.startDate = startDate;
  if (endDate !== undefined) promotion.endDate = endDate;
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
