import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

// Compara solo el día, en hora de Argentina, sin depender del huso horario del
// servidor (si no, "hoy" podía tomarse como "ayer" y rechazarse).
const arDay = (date) => date.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
function isPastDate(value) {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : arDay(new Date(value));
  return day < arDay(new Date());
}

// Precio opcional: vacío = la promo no tiene precio propio.
const optionalPrice = (field, label) =>
  body(field)
    .optional({ values: "falsy" })
    .isFloat({ min: 1, max: 100000000 })
    .withMessage(`${label} debe ser un número mayor a 0`);

const commonRules = [
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
  optionalPrice("price", "El precio de la promo"),
  optionalPrice("regularPrice", "El precio normal"),
  body("regularPrice")
    .optional({ values: "falsy" })
    .custom((value, { req }) => !req.body.price || Number(value) > Number(req.body.price))
    .withMessage("El precio normal tiene que ser mayor al precio de la promo"),
  body("showInPopup").optional().isBoolean().withMessage("Valor inválido para el cartel").toBoolean(),
  body("endDate")
    .notEmpty()
    .withMessage("Elegí la fecha de fin")
    .isISO8601()
    .withMessage("Fecha de fin inválida")
    .custom((value) => !isPastDate(value))
    .withMessage("La fecha de fin no puede ser una fecha pasada")
    .custom((value, { req }) => new Date(value) >= new Date(req.body.startDate))
    .withMessage("La fecha de fin debe ser posterior o igual a la fecha de inicio")
];

const startDate = body("startDate").notEmpty().withMessage("Elegí la fecha de inicio").isISO8601().withMessage("Fecha de inicio inválida");

// Al crear, la promo no puede empezar en el pasado.
export const createPromotionValidator = [
  startDate.custom((value) => !isPastDate(value)).withMessage("La fecha de inicio no puede ser una fecha pasada"),
  ...commonRules,
  validate
];

// Al editar sí: una promo que ya empezó conserva su fecha de inicio.
export const updatePromotionValidator = [
  body("startDate").notEmpty().withMessage("Elegí la fecha de inicio").isISO8601().withMessage("Fecha de inicio inválida"),
  ...commonRules,
  validate
];
