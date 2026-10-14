export function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: "El archivo supera el tamaño máximo permitido",
  LIMIT_FILE_COUNT: "Subiste demasiados archivos",
  LIMIT_UNEXPECTED_FILE: "Archivo no esperado en el formulario"
};

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || "Datos inválidos" });
  }

  // ID con formato inválido en la URL o el body (ej: /api/orders/abc)
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Identificador o dato con formato inválido" });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: MULTER_MESSAGES[err.code] || "No pudimos procesar el archivo" });
  }

  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "El cuerpo de la petición no es JSON válido" });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "La petición es demasiado grande" });

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "campo";
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
  }

  const status = err.status || 500;
  // Los errores 500 pueden traer detalles internos (librerías, base de datos):
  // en producción no se exponen al cliente.
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Error interno del servidor"
      : err.message || "Error interno del servidor";
  res.status(status).json({ message });
}
