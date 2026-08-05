import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new Error("Solo se permiten archivos de imagen"));
};

// Guardamos en memoria (no en disco) y de ahí subimos el buffer a Cloudinary.
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB por imagen
});
