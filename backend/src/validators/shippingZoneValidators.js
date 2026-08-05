import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { NAME_REGEX } from "../utils/validationPatterns.js";

const baseRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la zona es obligatorio")
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres")
    .matches(NAME_REGEX)
    .withMessage("El nombre de la zona solo puede contener letras"),
  body("cost").notEmpty().withMessage("Ingresá el costo de envío").isFloat({ min: 0, max: 1000000 }).withMessage("El costo de envío debe ser un número mayor o igual a 0"),
  body("minPurchaseAmount")
    .notEmpty()
    .withMessage("Ingresá el monto mínimo de compra")
    .isFloat({ min: 0, max: 100000000 })
    .withMessage("El monto mínimo debe ser un número mayor o igual a 0"),
  body("freeShippingFrom")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100000000 })
    .withMessage("El monto de envío gratis debe ser un número mayor o igual a 0"),
  validate
];

export const createShippingZoneValidator = baseRules;
export const updateShippingZoneValidator = baseRules;
