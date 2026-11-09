import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { NAME_REGEX, DIGITS_ONLY_REGEX } from "../utils/validationPatterns.js";

function optionalNumber(field, label, { min = 0, max = 100000000 } = {}) {
  return body(field)
    .optional({ checkFalsy: true })
    .isFloat({ min, max })
    .withMessage(`${label} debe ser un número mayor o igual a ${min}`);
}

// Colores editables de la paleta (SiteConfig.theme). "" = color por defecto.
export const THEME_KEYS = ["primary", "secondary", "accent", "background", "text"];
const HEX_COLOR_OR_EMPTY_REGEX = /^(#[0-9a-fA-F]{6})?$/;

export const updateSiteConfigValidator = [
  ...THEME_KEYS.map((key) =>
    body(`theme.${key}`)
      .optional()
      .isString()
      .matches(HEX_COLOR_OR_EMPTY_REGEX)
      .withMessage("Los colores deben tener el formato #rrggbb")
  ),
  body("brandName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre de la marca debe tener entre 2 y 100 caracteres"),
  body("instagram").optional({ checkFalsy: true }).trim().isURL().withMessage("El link de Instagram no es una URL válida"),
  body("facebook").optional({ checkFalsy: true }).trim().isURL().withMessage("El link de Facebook no es una URL válida"),
  body("whatsappNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(DIGITS_ONLY_REGEX)
    .withMessage("El número de WhatsApp solo puede contener números (sin 0 ni 15)")
    .isLength({ min: 6, max: 15 })
    .withMessage("El número de WhatsApp debe tener entre 6 y 15 dígitos"),
  body("whatsappMessage").optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage("El mensaje no puede superar los 300 caracteres"),
  optionalNumber("minPurchaseAmount", "El monto mínimo de compra"),
  optionalNumber("defaultShippingCost", "El costo de envío por defecto"),
  optionalNumber("freeShippingFrom", "El monto de envío gratis"),
  body("deliveryEtaHours").optional({ checkFalsy: true }).isInt({ min: 1, max: 720 }).withMessage("El tiempo de entrega debe ser un número entero de horas entre 1 y 720"),
  body("deliveryEtaMaxHours").optional({ checkFalsy: true }).isInt({ min: 1, max: 720 }).withMessage("El tiempo de entrega máximo debe ser un número entero de horas entre 1 y 720"),
  body("heroVideoMaxSeconds")
    .optional({ checkFalsy: true })
    .isInt({ min: 5, max: 120 })
    .withMessage("El tiempo máximo de cada video tiene que ser entre 5 y 120 segundos")
    .toInt(),
  body("promoPopupEnabled").optional().isBoolean().withMessage("Valor inválido para el cartel de promociones").toBoolean(),
  body("bankTransfer.alias")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-zA-Z0-9.-]{6,20}$/)
    .withMessage("El alias debe tener entre 6 y 20 caracteres (letras, números, puntos o guiones)"),
  body("bankTransfer.cbu")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{22}$/)
    .withMessage("El CBU o CVU debe tener 22 números"),
  body("bankTransfer.holder").optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage("El titular no puede superar los 100 caracteres"),
  body("bankTransfer.bankName").optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage("El banco no puede superar los 60 caracteres"),
  body("branches")
    .optional({ checkFalsy: true })
    .custom((value) => {
      let branches;
      try {
        branches = typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        throw new Error("Formato de sucursales inválido");
      }
      if (!Array.isArray(branches)) throw new Error("Formato de sucursales inválido");
      for (const b of branches) {
        if (!b.name || !b.name.trim() || !NAME_REGEX.test(b.name.trim())) {
          throw new Error("Cada sucursal necesita un nombre válido (solo letras)");
        }
        if (!b.address || !b.address.trim() || b.address.trim().length < 3) {
          throw new Error("Cada sucursal necesita una dirección válida");
        }
      }
      return true;
    }),
  validate
];
