import { validationResult } from "express-validator";

// Corta la request con el primer mensaje de error si algún validador falló.
// Se coloca al final de cada cadena de validadores, antes del controlador.
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}
