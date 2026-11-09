import cloudinary from "../config/cloudinary.js";

/**
 * Sube un buffer de imagen (memoria, vía multer.memoryStorage) a Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder - una de CLOUDINARY_FOLDERS
 * @returns {Promise<{url: string, publicId: string}>}
 */
export function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Sube varias imágenes en paralelo.
 * @param {Express.Multer.File[]} files
 * @param {string} folder
 */
export function uploadMany(files, folder) {
  return Promise.all(files.map((file) => uploadBuffer(file.buffer, folder)));
}

/**
 * Borra una imagen de Cloudinary por su publicId. No lanza si ya no existe.
 * @param {string} publicId
 */
export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[cloudinary] No se pudo borrar ${publicId}:`, err.message);
  }
}

/**
 * Borra un video de Cloudinary por su publicId. No lanza si ya no existe.
 * @param {string} publicId
 */
export async function deleteVideo(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (err) {
    console.error(`[cloudinary] No se pudo borrar el video ${publicId}:`, err.message);
  }
}

export function deleteMany(publicIds = []) {
  return Promise.all(publicIds.map((id) => deleteImage(id)));
}

