import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

// Compara solo por día (no por hora) para no rechazar "hoy" por unos minutos
// de diferencia entre el reloj del navegador y el del servidor.
function isPastDate(value) {
  const date = new Date(value);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date < today;
}

const baseRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("El título es obligatorio")
    .isLength({ min: 2, max: 120 })
    .withMessage("El título debe tener entre 2 y 120 caracteres"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("La descripción no puede superar los 500 caracteres"),
  body("discountPercent")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("El descuento debe ser un número entre 0 y 100"),
  body("startDate")
    .notEmpty()
    .withMessage("Elegí la fecha de inicio")
    .isISO8601()
    .withMessage("Fecha de inicio inválida")
    .custom((value) => !isPastDate(value))
    .withMessage("La fecha de inicio no puede ser una fecha pasada"),
  body("endDate")
    .notEmpty()
    .withMessage("Elegí la fecha de fin")
    .isISO8601()
    .withMessage("Fecha de fin inválida")
    .custom((value) => !isPastDate(value))
    .withMessage("La fecha de fin no puede ser una fecha pasada")
    .custom((value, { req }) => new Date(value) >= new Date(req.body.startDate))
    .withMessage("La fecha de fin debe ser posterior o igual a la fecha de inicio"),
  validate
];

export const createPromotionValidator = baseRules;
export const updatePromotionValidator = baseRules;
