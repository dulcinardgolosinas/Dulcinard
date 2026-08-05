import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { NAME_REGEX } from "../utils/validationPatterns.js";

const baseRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la categoría es obligatorio")
    .isLength({ min: 2, max: 60 })
    .withMessage("El nombre debe tener entre 2 y 60 caracteres")
    .matches(NAME_REGEX)
    .withMessage("El nombre de la categoría solo puede contener letras"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("La descripción no puede superar los 500 caracteres"),
  body("parent").optional({ checkFalsy: true }).isMongoId().withMessage("Categoría padre inválida"),
  body("order").optional({ checkFalsy: true }).isInt({ min: 0, max: 9999 }).withMessage("El orden debe ser un número entero"),
  validate
];

export const createCategoryValidator = baseRules;
export const updateCategoryValidator = baseRules;
