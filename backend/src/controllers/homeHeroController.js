import HomeHeroImage from "../models/HomeHeroImage.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

// Público: solo las fotos activas, para el slideshow del hero del home.
// Admin (?all=true): todas, para gestionarlas desde el panel.
export const listHomeHeroImages = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { active: true };
  const images = await HomeHeroImage.find(filter)
    .sort({ order: 1, createdAt: 1 })
    .populate("product", "name slug active")
    .populate("category", "name slug active")
    .lean();
  // La lista pública la guarda la red de Vercel un minuto (y la sigue dando
  // mientras la actualiza): así casi ninguna visita espera a que el servidor
  // "despierte". La del panel (?all=true) siempre va al día.
  if (req.query.all !== "true") res.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=600");
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

  const { order, active, title, buttonText, linkType, product, category } = req.body;
  if (order !== undefined) doc.order = order;
  if (active !== undefined) doc.active = active;
  if (title !== undefined) doc.title = title;
  if (buttonText !== undefined) doc.buttonText = buttonText || "Comprar";
  if (linkType !== undefined) {
    doc.linkType = linkType;
    doc.product = null;
    doc.category = null;
    if (linkType === "product") {
      if (!(await Product.exists({ _id: product }))) return res.status(400).json({ message: "Elegí un producto de la lista" });
      doc.product = product;
    }
    if (linkType === "category") {
      if (!(await Category.exists({ _id: category }))) return res.status(400).json({ message: "Elegí una categoría de la lista" });
      doc.category = category;
    }
  }

  await doc.save();
  await doc.populate([
    { path: "product", select: "name slug active" },
    { path: "category", select: "name slug active" }
  ]);
  res.json(doc);
});

export const deleteHomeHeroImage = asyncHandler(async (req, res) => {
  const doc = await HomeHeroImage.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Imagen no encontrada" });

  if (doc.image?.publicId) await deleteImage(doc.image.publicId);
  await doc.deleteOne();

  res.json({ message: "Imagen eliminada" });
});
