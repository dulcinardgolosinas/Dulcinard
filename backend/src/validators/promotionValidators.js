import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { OCCASION_KEYS, PROMO_SCOPES } from "../utils/promotionTypes.js";
import { parseArDate } from "../controllers/promotionController.js";

const DATE_OR_DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const idCount = (raw) => {
  try {
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
};

// Precio opcional: vacío = la promo no tiene precio para mostrar.
const optionalPrice = (field, label) =>
  body(field)
    .optional({ values: "falsy" })
    .isFloat({ min: 1, max: 100000000 })
    .withMessage(`${label} debe ser un número mayor a 0`);

const rules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 120 })
    .withMessage("El nombre debe tener entre 2 y 120 caracteres"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("La descripción no puede superar los 500 caracteres"),

  body("discountPercent").isFloat({ min: 1, max: 100 }).withMessage("El descuento tiene que ser un número entre 1 y 100"),
  body("scope")
    .isIn(PROMO_SCOPES)
    .withMessage("Elegí a qué productos se aplica"),
  body("categories")
    .custom((value, { req }) => req.body.scope !== "categories" || idCount(value) > 0)
    .withMessage("Elegí al menos una categoría"),
  body("products")
    .custom((value, { req }) => req.body.scope !== "products" || idCount(value) > 0)
    .withMessage("Elegí al menos un producto"),

  body("occasion").isIn(OCCASION_KEYS).withMessage("Elegí la ocasión"),
  body("occasionName")
    .if(body("occasion").equals("otra"))
    .trim()
    .notEmpty()
    .withMessage("Escribí el nombre de la fecha especial")
    .isLength({ max: 40 })
    .withMessage("El nombre de la fecha especial no puede superar los 40 caracteres"),

  optionalPrice("price", "El precio para mostrar"),
  optionalPrice("regularPrice", "El precio normal"),
  body("regularPrice")
    .optional({ values: "falsy" })
    .custom((value, { req }) => !req.body.price || Number(value) > Number(req.body.price))
    .withMessage("El precio normal tiene que ser mayor al precio de la promo"),
  body("showInPopup").optional().isBoolean().withMessage("Valor inválido para el cartel").toBoolean(),
  body("active").optional().isBoolean().withMessage("Valor inválido para publicar").toBoolean(),

  body("startDate").notEmpty().withMessage("Elegí cuándo empieza").matches(DATE_OR_DATETIME).withMessage("Fecha de inicio inválida"),
  body("endDate")
    .notEmpty()
    .withMessage("Elegí cuándo termina")
    .matches(DATE_OR_DATETIME)
    .withMessage("Fecha de fin inválida")
    .custom((value) => parseArDate(value, { endOfDay: true }) > new Date())
    .withMessage("La promoción no puede terminar en el pasado")
    .custom((value, { req }) => parseArDate(value, { endOfDay: true }) > parseArDate(req.body.startDate))
    .withMessage("Tiene que terminar después de que empieza")
];

export const createPromotionValidator = [...rules, validate];
// Al editar una promo que ya empezó se conserva su inicio (puede estar en el pasado).
export const updatePromotionValidator = [...rules, validate];
