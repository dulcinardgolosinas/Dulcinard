import PageHero from "../models/PageHero.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

export const PAGE_HERO_SLUGS = ["quienes-somos", "envios", "contacto"];

// Admin: listado completo (una fila por página conocida, exista o no el documento).
export const listPageHeroes = asyncHandler(async (req, res) => {
  const docs = await PageHero.find({});
  const byPage = new Map(docs.map((d) => [d.page, d]));
  const result = PAGE_HERO_SLUGS.map(
    (page) => byPage.get(page) || { page, backgroundImage: { url: "", publicId: "" } }
  );
  res.json(result);
});

// Público: fondo de una página puntual (null si no se cargó ninguno).
export const getPageHero = asyncHandler(async (req, res) => {
  const doc = await PageHero.findOne({ page: req.params.page });
  res.json(doc || { page: req.params.page, backgroundImage: { url: "", publicId: "" } });
});

export const uploadPageHeroImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Falta el archivo de imagen" });
  const { page } = req.params;
  if (!PAGE_HERO_SLUGS.includes(page)) return res.status(400).json({ message: "Página inválida" });

  let doc = await PageHero.findOne({ page });
  if (!doc) doc = new PageHero({ page });

  if (doc.backgroundImage?.publicId) await deleteImage(doc.backgroundImage.publicId);
  doc.backgroundImage = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.heroes);

  await doc.save();
  res.json(doc);
});

export const deletePageHeroImage = asyncHandler(async (req, res) => {
  const { page } = req.params;
  if (!PAGE_HERO_SLUGS.includes(page)) return res.status(400).json({ message: "Página inválida" });

  const doc = await PageHero.findOne({ page });
  if (!doc || !doc.backgroundImage?.url) return res.status(404).json({ message: "Esta página no tiene imagen cargada" });

  if (doc.backgroundImage?.publicId) await deleteImage(doc.backgroundImage.publicId);
  doc.backgroundImage = { url: "", publicId: "" };

  await doc.save();
  res.json(doc);
});
