// Patrones reutilizados por los validadores de express-validator.

// Solo letras (con acentos y ñ), espacios, guiones, apóstrofes y puntos
// (para abreviaturas como "Av." o "Ing."). Sin números.
export const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'.\-\s]*$/;

// Dígitos con separadores comunes de teléfono (espacios, guiones, paréntesis, +).
export const PHONE_REGEX = /^[0-9+()\s-]+$/;

// Letras, números, espacios y separadores básicos (nombre de producto, marca, dirección).
export const ALPHANUMERIC_TEXT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'".,°/\-\s]+$/;

// SKU / códigos: letras, números, guiones y guion bajo, sin espacios.
export const SKU_REGEX = /^[A-Za-z0-9_-]+$/;

// Número de WhatsApp / teléfono de Argentina sin 0 ni 15: solo dígitos.
export const DIGITS_ONLY_REGEX = /^[0-9]+$/;
