import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

export const videoValidator = [
  body("publicId").isString().withMessage("Falta el video").trim().notEmpty().withMessage("Falta el video"),
  validate
];

export const updateHomeHeroImageValidator = [
  body("title").optional().isString().trim().isLength({ max: 80 }).withMessage("El título puede tener hasta 80 caracteres"),
  body("buttonText").optional().isString().trim().isLength({ max: 24 }).withMessage("El texto del botón puede tener hasta 24 caracteres"),
  body("linkType").optional().isIn(["catalog", "product", "category"]).withMessage("Elegí adónde lleva el botón"),
  body("product").if(body("linkType").equals("product")).isMongoId().withMessage("Elegí un producto de la lista"),
  body("category").if(body("linkType").equals("category")).isMongoId().withMessage("Elegí una categoría de la lista"),
  body("order").optional().isInt({ min: 0, max: 999 }).withMessage("La posición debe ser un número entre 0 y 999").toInt(),
  body("active").optional().isBoolean().withMessage("Valor inválido para mostrar u ocultar").toBoolean(),
  validate
];
