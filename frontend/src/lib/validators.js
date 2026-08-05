import { z } from "zod";

// Mismos patrones que el backend (backend/src/utils/validationPatterns.js)
// para que los mensajes de front y back sean consistentes.
export const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'.\-\s]*$/;
export const PHONE_REGEX = /^[0-9+()\s-]+$/;
export const ALPHANUMERIC_TEXT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'".,°/\-\s]+$/;
export const SKU_REGEX = /^[A-Za-z0-9_-]+$/;
export const DIGITS_ONLY_REGEX = /^[0-9]+$/;

// --- Builders reutilizables ---

export const nameField = (label = "Este campo", { min = 2, max = 80 } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .regex(NAME_REGEX, `${label} solo puede contener letras`);

export const optionalNameField = (label = "Este campo", { max = 80 } = {}) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .regex(NAME_REGEX, `${label} solo puede contener letras`)
    .or(z.literal(""))
    .optional();

export const alphanumericField = (label = "Este campo", { min = 1, max = 150 } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .regex(ALPHANUMERIC_TEXT_REGEX, `${label} tiene caracteres inválidos`);

export const optionalAlphanumericField = (label = "Este campo", { max = 150 } = {}) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .regex(ALPHANUMERIC_TEXT_REGEX, `${label} tiene caracteres inválidos`)
    .or(z.literal(""))
    .optional();

export const emailField = z.string().trim().min(1, "El email es obligatorio").email("Ingresá un email válido").max(254);

export const phoneField = ({ min = 6, max = 20, required = false, label = "El teléfono" } = {}) => {
  const base = z
    .string()
    .trim()
    .regex(PHONE_REGEX, `${label} solo puede contener números`)
    .min(min, `${label} debe tener entre ${min} y ${max} dígitos`)
    .max(max, `${label} debe tener entre ${min} y ${max} dígitos`);
  if (required) return base;
  return base.or(z.literal("")).optional();
};

export const passwordField = ({ min = 6, max = 72, label = "La contraseña" } = {}) =>
  z
    .string()
    .min(1, `${label} es obligatoria`)
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} no puede superar los ${max} caracteres`);

export const urlField = ({ required = false, label = "El link" } = {}) => {
  const base = z.string().trim().url(`${label} no es una URL válida`);
  if (required) return base;
  return base.or(z.literal("")).optional();
};

export const skuField = z
  .string()
  .trim()
  .max(40, "El SKU no puede superar los 40 caracteres")
  .regex(SKU_REGEX, "El SKU solo puede contener letras, números, guiones y guion bajo")
  .or(z.literal(""))
  .optional();

// number/int coercion desde inputs HTML (siempre llegan como string)
export const numberField = (label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) =>
  z.coerce
    .number({ invalid_type_error: `${label} debe ser un número` })
    .min(min, `${label} debe ser mayor o igual a ${min}`)
    .max(max, `${label} no puede superar ${max}`);

export const intField = (label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) =>
  z.coerce
    .number({ invalid_type_error: `${label} debe ser un número` })
    .int(`${label} debe ser un número entero`)
    .min(min, `${label} debe ser mayor o igual a ${min}`)
    .max(max, `${label} no puede superar ${max}`);

// --- Fechas: no pasadas, y fin >= inicio ---

function isPastDate(value) {
  const date = new Date(value);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export const futureDateField = (label = "La fecha") =>
  z
    .string()
    .min(1, `${label} es obligatoria`)
    .refine((v) => !Number.isNaN(new Date(v).getTime()), `${label} no es válida`)
    .refine((v) => !isPastDate(v), `${label} no puede ser una fecha pasada`);

export const dateRangeRefinement = (schema, { startKey = "startDate", endKey = "endDate" } = {}) =>
  schema.refine((data) => new Date(data[endKey]) >= new Date(data[startKey]), {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: [endKey]
  });
