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

export const updateProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: "Proveedor no encontrado" });

  const { order, active } = req.body;
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
