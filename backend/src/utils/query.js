// Helpers compartidos por los listados paginados del panel admin.

const MAX_LIMIT = 100;

/**
 * Normaliza los query params `page` y `limit` (valores inválidos caen al default).
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query, defaultLimit = 20) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Respuesta estándar de un listado paginado. */
export function paginatedResponse(items, total, { page, limit }) {
  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

/** Escapa un texto del usuario para usarlo de forma segura dentro de un RegExp. */
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** RegExp de búsqueda parcial, sin distinguir mayúsculas. */
export function searchRegex(text) {
  return new RegExp(escapeRegex(String(text).trim()), "i");
}

/** Toma un query param como texto plano (descarta arrays u objetos armados a mano, ej: ?brand[x]=1). */
export function queryString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Clave para comparar nombres de productos: sin mayúsculas, acentos,
 * puntuación ni espacios repetidos. "ALF. TOFI X 78 GR" == "alf tofi x 78 gr".
 * La usan la carga de listas de precios y la subida masiva de fotos.
 */
export function nameKey(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
