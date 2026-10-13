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
