import SiteConfig from "../models/SiteConfig.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

// SiteConfig es un singleton: si no existe documento, se crea uno con los defaults del schema.
async function getOrCreateConfig() {
  let config = await SiteConfig.findOne();
  if (!config) config = await SiteConfig.create({});
  return config;
}

export const getSiteConfig = asyncHandler(async (req, res) => {
  const config = await getOrCreateConfig();
  res.json(config);
});

export const updateSiteConfig = asyncHandler(async (req, res) => {
  const config = await getOrCreateConfig();

  const fields = [
    "brandName",
    "instagram",
    "whatsappNumber",
    "whatsappMessage",
    "pedidosYaUrl",
    "minPurchaseAmount",
    "defaultShippingCost",
    "freeShippingFrom",
    "deliveryEtaHours"
  ];
  for (const field of fields) {
    if (req.body[field] !== undefined) config[field] = req.body[field];
  }
  if (req.body.branches !== undefined) {
    config.branches = typeof req.body.branches === "string" ? JSON.parse(req.body.branches) : req.body.branches;
  }

  await config.save();
  res.json(config);
});

export const updateLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Falta el archivo de imagen" });
  const config = await getOrCreateConfig();

  if (config.logo?.publicId) await deleteImage(config.logo.publicId);
  config.logo = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.branding);

  await config.save();
  res.json(config);
});

export const updateFavicon = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Falta el archivo de imagen" });
  const config = await getOrCreateConfig();

  if (config.favicon?.publicId) await deleteImage(config.favicon.publicId);
  config.favicon = await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.branding);

  await config.save();
  res.json(config);
});
