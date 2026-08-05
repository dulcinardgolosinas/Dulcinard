export function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || "Datos inválidos" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "campo";
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Error interno del servidor" });
}
