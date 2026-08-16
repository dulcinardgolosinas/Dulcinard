import HomeHeroImage from "../models/HomeHeroImage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

// Público: solo las fotos activas, para el slideshow del hero del home.
// Admin (?all=true): todas, para gestionarlas desde el panel.
export const listHomeHeroImages = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { active: true };
  const images = await HomeHeroImage.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(images);
});

export const addHomeHeroImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Falta el archivo de imagen" });

  const image = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.heroes);
  const count = await HomeHeroImage.countDocuments();
  const doc = await HomeHeroImage.create({ image, order: count });
  res.status(201).json(doc);
});

export const updateHomeHeroImage = asyncHandler(async (req, res) => {
  const doc = await HomeHeroImage.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Imagen no encontrada" });

  const { order, active } = req.body;
  if (order !== undefined) doc.order = order;
  if (active !== undefined) doc.active = active;

  await doc.save();
  res.json(doc);
});

export const deleteHomeHeroImage = asyncHandler(async (req, res) => {
  const doc = await HomeHeroImage.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Imagen no encontrada" });

  if (doc.image?.publicId) await deleteImage(doc.image.publicId);
  await doc.deleteOne();

  res.json({ message: "Imagen eliminada" });
});
