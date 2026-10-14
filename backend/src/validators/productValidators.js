import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { ALPHANUMERIC_TEXT_REGEX, SKU_REGEX } from "../utils/validationPatterns.js";
import { SALE_UNITS } from "../models/Product.js";

const baseRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del producto es obligatorio")
    .isLength({ min: 2, max: 150 })
    .withMessage("El nombre debe tener entre 2 y 150 caracteres")
    .matches(ALPHANUMERIC_TEXT_REGEX)
    .withMessage("El nombre del producto tiene caracteres inválidos"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage("La descripción no puede superar los 2000 caracteres"),
  body("brand").optional({ checkFalsy: true }).trim().isLength({ max: 80 }).withMessage("La marca no puede superar los 80 caracteres"),
  body("category").notEmpty().withMessage("Elegí una categoría").isMongoId().withMessage("Categoría inválida"),
  body("sku")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("El SKU no puede superar los 40 caracteres")
    .matches(SKU_REGEX)
    .withMessage("El SKU solo puede contener letras, números, guiones y guion bajo"),
  body("price").notEmpty().withMessage("Ingresá un precio").isFloat({ min: 0, max: 100000000 }).withMessage("El precio debe ser un número mayor o igual a 0"),
  body("unit").optional({ checkFalsy: true }).isIn(SALE_UNITS).withMessage("Unidad de venta inválida"),
  body("unitsPerPack").optional({ checkFalsy: true }).isInt({ min: 1, max: 100000 }).withMessage("Las unidades por pack deben ser un número entero mayor a 0"),
  body("stock").notEmpty().withMessage("Ingresá el stock disponible").isInt({ min: 0, max: 10000000 }).withMessage("El stock debe ser un número entero mayor o igual a 0"),
  body("minStock").optional({ checkFalsy: true }).isInt({ min: 0, max: 10000000 }).withMessage("El stock mínimo debe ser un número entero mayor o igual a 0"),
  body("minOrderQty").optional({ checkFalsy: true }).isInt({ min: 1, max: 100000 }).withMessage("El pedido mínimo debe ser un número entero mayor a 0")
];

export const createProductValidator = [...baseRules, validate];
export const updateProductValidator = [...baseRules, validate];
