import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { NAME_REGEX, ALPHANUMERIC_TEXT_REGEX, PHONE_REGEX } from "../utils/validationPatterns.js";

export const updateUserValidator = [
  body("role").optional({ checkFalsy: true }).isIn(["admin", "cliente"]).withMessage("Rol inválido"),
  body("active").optional().isBoolean().withMessage("El estado activo debe ser verdadero o falso"),
  body("name")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres")
    .matches(NAME_REGEX)
    .withMessage("El nombre solo puede contener letras"),
  body("businessName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("El nombre del negocio no puede superar los 100 caracteres")
    .matches(ALPHANUMERIC_TEXT_REGEX)
    .withMessage("El nombre del negocio tiene caracteres inválidos"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("El teléfono solo puede contener números")
    .isLength({ min: 6, max: 20 })
    .withMessage("El teléfono debe tener entre 6 y 20 dígitos"),
  validate
];
