import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

export const listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === "true";
  const filter = includeInactive ? {} : { active: true };
  const categories = await Category.find(filter).sort({ order: 1, name: 1 });
  // Lista pública: Vercel la guarda 1 minuto (el panel usa ?all=true, que no se guarda).
  if (!includeInactive) res.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=86400");
  res.json(categories);
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Categoría no encontrada" });
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, order, active } = req.body;
  const category = new Category({ name, description, parent: parent || null, order, active });

  if (req.file) {
    const uploaded = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.categories);
    category.image = uploaded;
  }

  await category.save();
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

  const { name, description, parent, order, active } = req.body;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (parent !== undefined) category.parent = parent || null;
  if (order !== undefined) category.order = order;
  if (active !== undefined) category.active = active;

  if (req.file) {
    if (category.image?.publicId) await deleteImage(category.image.publicId);
    category.image = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.categories);
  }

  await category.save();
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

  if (category.image?.publicId) await deleteImage(category.image.publicId);
  await category.deleteOne();
  res.json({ message: "Categoría eliminada" });
});
