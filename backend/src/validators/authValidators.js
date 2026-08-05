import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { NAME_REGEX, ALPHANUMERIC_TEXT_REGEX, PHONE_REGEX } from "../utils/validationPatterns.js";

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
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("El nombre del negocio no puede superar los 100 caracteres")
    .matches(ALPHANUMERIC_TEXT_REGEX)
    .withMessage("El nombre del negocio tiene caracteres inválidos"),
  body("email").trim().notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("Ingresá un email válido").isLength({ max: 254 }),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("El teléfono solo puede contener números")
    .isLength({ min: 6, max: 20 })
    .withMessage("El teléfono debe tener entre 6 y 20 dígitos"),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6, max: 72 })
    .withMessage("La contraseña debe tener entre 6 y 72 caracteres"),
  validate
];

export const loginValidator = [
  body("email").trim().notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("Ingresá un email válido"),
  body("password").notEmpty().withMessage("La contraseña es obligatoria"),
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
  validate
];

export const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Ingresá tu contraseña actual"),
  body("newPassword")
    .notEmpty()
    .withMessage("Ingresá la nueva contraseña")
    .isLength({ min: 6, max: 72 })
    .withMessage("La nueva contraseña debe tener entre 6 y 72 caracteres"),
  validate
];
