import Provider from "../models/Provider.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

// Público: solo proveedores activos con logo cargado, para el carrusel del home.
// Admin (?all=true): todos, para gestionarlos desde el panel.
export const listProviders = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { active: true, "logo.url": { $ne: "" } };
  const providers = await Provider.find(filter).sort({ order: 1, name: 1 });
  res.json(providers);
});

// Sin distinguir mayúsculas ni acentos: "Arcor" y "ARCOR" son el mismo proveedor.
const nameTaken = (name, exceptId) =>
  Provider.findOne({ ...(exceptId ? { _id: { $ne: exceptId } } : {}), name })
    .collation({ locale: "es", strength: 1 })
    .select("_id")
    .lean();

// POST /providers (multipart: name, active y logo opcional). Va al final del carrusel.
export const createProvider = asyncHandler(async (req, res) => {
  const { name, active } = req.body;
  if (await nameTaken(name)) return res.status(400).json({ message: "Ya hay un proveedor con ese nombre" });

  const last = await Provider.findOne().sort({ order: -1 }).select("order").lean();
  const provider = new Provider({ name, active: active ?? true, order: (last?.order ?? -1) + 1 });
  if (req.file) provider.logo = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.providers);

  await provider.save();
  res.status(201).json(provider);
});

// DELETE /providers/:id (borra también su logo de Cloudinary).
export const deleteProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: "Proveedor no encontrado" });
  if (provider.logo?.publicId) await deleteImage(provider.logo.publicId);
  await provider.deleteOne();
  res.json({ message: "Proveedor eliminado" });
});

export const updateProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: "Proveedor no encontrado" });

  const { name, order, active } = req.body;
  if (name !== undefined) {
    if (await nameTaken(name, provider._id)) return res.status(400).json({ message: "Ya hay otro proveedor con ese nombre" });
    provider.name = name;
  }
  if (order !== undefined) provider.order = order;
  if (active !== undefined) provider.active = active;

  await provider.save();
  res.json(provider);
});

export const uploadProviderLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Falta el archivo de imagen" });
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: "Proveedor no encontrado" });

  if (provider.logo?.publicId) await deleteImage(provider.logo.publicId);
  provider.logo = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.providers);

  await provider.save();
  res.json(provider);
});

export const deleteProviderLogo = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: "Proveedor no encontrado" });
  if (!provider.logo?.url) return res.status(404).json({ message: "Este proveedor no tiene logo cargado" });

  if (provider.logo?.publicId) await deleteImage(provider.logo.publicId);
  provider.logo = { url: "", publicId: "" };

  await provider.save();
  res.json(provider);
});
