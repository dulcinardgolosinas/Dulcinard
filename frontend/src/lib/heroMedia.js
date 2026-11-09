import { api } from "./api";

// Subida de fotos y videos del carrusel de la página principal.
// - Fotos: pasan por el servidor (hasta 4 MB, igual que el resto de las imágenes).
// - Videos: van directo del navegador a Cloudinary, con un permiso firmado por el
//   servidor, porque Vercel no deja pasar archivos de más de ~4,5 MB.

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const isVideoFile = (file) => file?.type?.startsWith("video/");
export const formatMB = (bytes) => `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB`;

/** Mensaje de error si el archivo no sirve para el carrusel, o null si está bien. */
export function checkHeroFile(file, maxVideoBytes = 40 * 1024 * 1024) {
  if (!file) return "Elegí una foto o un video";
  if (isVideoFile(file)) {
    if (!VIDEO_TYPES.includes(file.type)) return "El video tiene que ser MP4, WEBM o MOV";
    if (file.size > maxVideoBytes) {
      return `El video pesa ${formatMB(file.size)} y el máximo es ${formatMB(maxVideoBytes)}. Probá con uno más corto o comprimilo.`;
    }
    return null;
  }
  if (!PHOTO_TYPES.includes(file.type)) return "La foto tiene que ser JPG, PNG o WEBP";
  if (file.size > MAX_PHOTO_BYTES) return `La foto pesa ${formatMB(file.size)} y el máximo es ${formatMB(MAX_PHOTO_BYTES)}`;
  return null;
}

/** Sube un video directo a Cloudinary. Devuelve su publicId. onProgress recibe 0 a 100. */
export async function uploadVideoToCloudinary(file, onProgress) {
  const { data: sign } = await api.get("/home-hero-images/upload-signature");
  const problem = checkHeroFile(file, sign.maxBytes);
  if (problem) throw new Error(problem);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", sign.timestamp);
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // respuesta vacía o rara: se informa como error genérico
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.public_id) resolve(body.public_id);
      else reject(new Error(body.error?.message ? `Cloudinary no aceptó el video: ${body.error.message}` : "No pudimos subir el video"));
    };
    xhr.onerror = () => reject(new Error("Se cortó la conexión mientras subía el video. Probá de nuevo"));
    xhr.send(form);
  });
}

/**
 * Sube una foto o un video al carrusel. Sin slideId crea un slide nuevo; con
 * slideId reemplaza la foto o el video de ese slide. Devuelve el slide.
 */
export async function uploadHeroMedia(file, { slideId, onProgress } = {}) {
  if (isVideoFile(file)) {
    const publicId = await uploadVideoToCloudinary(file, onProgress);
    const { data } = slideId
      ? await api.put(`/home-hero-images/${slideId}/media`, { publicId })
      : await api.post("/home-hero-images/video", { publicId });
    return data;
  }
  const problem = checkHeroFile(file);
  if (problem) throw new Error(problem);
  const formData = new FormData();
  formData.append("image", file);
  const config = {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100))
  };
  const { data } = slideId
    ? await api.put(`/home-hero-images/${slideId}/media`, formData, config)
    : await api.post("/home-hero-images", formData, config);
  return data;
}
