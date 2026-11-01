import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

export const updateProviderValidator = [
  body("name").optional().isString().trim().isLength({ min: 2, max: 60 }).withMessage("El nombre debe tener entre 2 y 60 caracteres"),
  body("order").optional().isInt({ min: 0, max: 999 }).withMessage("La posición debe ser un número entre 0 y 999").toInt(),
  body("active").optional().isBoolean().withMessage("Valor inválido para mostrar u ocultar").toBoolean(),
  validate
];
