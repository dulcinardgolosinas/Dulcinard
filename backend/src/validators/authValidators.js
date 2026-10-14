import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { NAME_REGEX, ALPHANUMERIC_TEXT_REGEX, PHONE_REGEX, STRONG_PASSWORD_REGEX } from "../utils/validationPatterns.js";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres")
    .matches(NAME_REGEX)
    .withMessage("El nombre solo puede contener letras"),
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("El nombre del negocio es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre del negocio debe tener entre 2 y 100 caracteres")
    .matches(ALPHANUMERIC_TEXT_REGEX)
    .withMessage("El nombre del negocio tiene caracteres inválidos"),
  body("email").trim().notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("Ingresá un email válido").isLength({ max: 254 }),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es obligatorio")
    .matches(PHONE_REGEX)
    .withMessage("El teléfono solo puede contener números")
    .isLength({ min: 6, max: 20 })
    .withMessage("El teléfono debe tener entre 6 y 20 dígitos"),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 8, max: 72 })
    .withMessage("La contraseña debe tener entre 8 y 72 caracteres")
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage("La contraseña debe incluir mayúscula, minúscula, número y símbolo"),
  validate
];

export const loginValidator = [
  body("email").trim().notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("Ingresá un email válido"),
  body("password").isString().withMessage("La contraseña es obligatoria").notEmpty().withMessage("La contraseña es obligatoria"),
  validate
];

export const updateProfileValidator = [
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
  body("addresses").optional().isArray({ max: 10 }).withMessage("Podés guardar hasta 10 direcciones"),
  body("addresses.*").isObject().withMessage("Dirección inválida"),
  body("addresses.*.label")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 40 })
    .withMessage("La etiqueta de la dirección no puede superar los 40 caracteres"),
  body("addresses.*.street")
    .isString()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("La dirección debe tener entre 3 y 150 caracteres")
    .matches(ALPHANUMERIC_TEXT_REGEX)
    .withMessage("La dirección tiene caracteres inválidos"),
  body("addresses.*.city")
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("La localidad debe tener entre 2 y 80 caracteres"),
  body("addresses.*.zone").optional({ values: "null" }).isMongoId().withMessage("Zona de envío inválida"),
  body("addresses.*.notes")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Las notas no pueden superar los 500 caracteres"),
  validate
];

export const changePasswordValidator = [
  body("currentPassword").isString().withMessage("Ingresá tu contraseña actual").notEmpty().withMessage("Ingresá tu contraseña actual"),
  body("newPassword")
    .notEmpty()
    .withMessage("Ingresá la nueva contraseña")
    .isLength({ min: 8, max: 72 })
    .withMessage("La nueva contraseña debe tener entre 8 y 72 caracteres")
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage("La nueva contraseña debe incluir mayúscula, minúscula, número y símbolo"),
  validate
];
