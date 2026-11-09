import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new Error("Solo se permiten archivos de imagen"));
};

// Vercel no deja pasar pedidos de más de ~4,5MB: con 4MB el error es claro
// ("La imagen pesa demasiado") en vez de un rechazo sin explicación.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Guardamos en memoria (no en disco) y de ahí subimos el buffer a Cloudinary.
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES }
});

// Logos: solo PNG, JPG, WEBP o SVG.
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const uploadLogoFile = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (LOGO_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error("El logo tiene que ser PNG, JPG, WEBP o SVG"), { status: 400 }));
  },
  limits: { fileSize: MAX_IMAGE_BYTES }
});

const SPREADSHEET_EXTENSIONS = /\.(xlsx|xls|ods|csv|pdf)$/i;

// Listas de precios para la actualización masiva de precios (Excel nuevo o
// viejo, LibreOffice, CSV o el PDF de la lista de precios del proveedor).
export const uploadSpreadsheet = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (SPREADSHEET_EXTENSIONS.test(file.originalname)) return cb(null, true);
    cb(Object.assign(new Error("Subí un archivo Excel (.xlsx o .xls), LibreOffice (.ods), CSV o PDF"), { status: 400 }));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB (los PDF pesan más)
});
