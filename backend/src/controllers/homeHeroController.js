import HomeHeroImage from "../models/HomeHeroImage.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage, deleteVideo } from "../utils/cloudinaryUpload.js";
import cloudinary, { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

// Los videos no pasan por el servidor (Vercel no acepta archivos de más de
// ~4,5MB): el panel los sube directo a Cloudinary con una firma que da el
// servidor, y después el servidor los verifica y crea el slide.
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

// Borra de Cloudinary la foto o el video de un slide.
async function deleteSlideMedia(doc) {
  if (doc.mediaType === "video") await deleteVideo(doc.video?.publicId);
  else await deleteImage(doc.image?.publicId);
}

// Datos de un video ya subido a Cloudinary. Lanza 400 si no existe, no es de
// la carpeta del carrusel o pesa de más (en ese caso lo borra).
async function verifiedVideo(publicId) {
  if (typeof publicId !== "string" || !publicId.startsWith(`${CLOUDINARY_FOLDERS.heroes}/`)) {
    throw Object.assign(new Error("Video inválido"), { status: 400 });
  }
  let info;
  try {
    info = await cloudinary.api.resource(publicId, { resource_type: "video" });
  } catch {
    throw Object.assign(new Error("No encontramos el video subido. Probá subirlo de nuevo"), { status: 400 });
  }
  if (info.bytes > MAX_VIDEO_BYTES) {
    await deleteVideo(publicId);
    throw Object.assign(new Error(`El video pesa ${Math.round(info.bytes / 1048576)} MB y el máximo es ${MAX_VIDEO_BYTES / 1048576} MB`), { status: 400 });
  }
  return {
    video: { url: info.secure_url, publicId: info.public_id, duration: Math.round(info.duration || 0), bytes: info.bytes },
    // Miniatura (primer cuadro) para mostrar mientras carga el video.
    image: {
      url: info.secure_url.replace("/video/upload/", "/video/upload/so_0/").replace(/\.[a-z0-9]+$/i, ".jpg"),
      publicId: info.public_id
    }
  };
}

// GET /home-hero-images/upload-signature -> permiso para subir un video directo a Cloudinary.
export const getVideoUploadSignature = asyncHandler(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = CLOUDINARY_FOLDERS.heroes;
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, cloudinary.config().api_secret);
  res.json({
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    timestamp,
    folder,
    signature,
    maxBytes: MAX_VIDEO_BYTES
  });
});

// POST /home-hero-images/video { publicId } -> crea un slide con un video ya subido.
export const addHomeHeroVideo = asyncHandler(async (req, res) => {
  const media = await verifiedVideo(req.body.publicId);
  const count = await HomeHeroImage.countDocuments();
  const doc = await HomeHeroImage.create({ mediaType: "video", ...media, order: count });
  res.status(201).json(doc);
});

// PUT /home-hero-images/:id/media -> reemplaza la foto (archivo) o el video ({ publicId }) de un slide.
export const replaceHomeHeroMedia = asyncHandler(async (req, res) => {
  const doc = await HomeHeroImage.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Slide no encontrado" });

  let next;
  if (req.file) next = { mediaType: "image", image: await uploadBuffer(req.file.buffer, CLOUDINARY_FOLDERS.heroes), video: {} };
  else if (req.body.publicId) next = { mediaType: "video", ...(await verifiedVideo(req.body.publicId)) };
  else return res.status(400).json({ message: "Elegí una foto o un video" });

  const previous = { mediaType: doc.mediaType, image: { ...doc.image }, video: { ...doc.video } };
  doc.set(next);
  await doc.save();
  // El archivo anterior se borra recién cuando el nuevo ya quedó guardado.
  if (!(previous.mediaType === "video" && previous.video.publicId === doc.video?.publicId)) await deleteSlideMedia(previous);

  await doc.populate([
    { path: "product", select: "name slug active" },
    { path: "category", select: "name slug active" }
  ]);
  res.json(doc);
});

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

  await deleteSlideMedia(doc);
  await doc.deleteOne();

  res.json({ message: "Imagen eliminada" });
});
