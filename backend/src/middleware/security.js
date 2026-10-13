import rateLimit from "express-rate-limit";
import RateLimitHit from "../models/RateLimitHit.js";

// Claves que permitirían inyectar operadores de MongoDB ({"$ne": null},
// {"$regex": ...}) o contaminar prototipos (__proto__) desde el cliente.
// En el body también se bloquean claves con "." (rutas anidadas de Mongo); en
// la query no, porque el webhook de Mercado Pago manda "?data.id=...".
function isDangerousKey(key, { allowDots }) {
  return (
    key.startsWith("$") ||
    (!allowDots && key.includes(".")) ||
    key === "__proto__" ||
    key === "constructor" ||
    key === "prototype"
  );
}

function sanitize(value, options, depth = 0) {
  if (depth > 10 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, options, depth + 1));
  for (const key of Object.keys(value)) {
    if (isDangerousKey(key, options)) delete value[key];
    else value[key] = sanitize(value[key], options, depth + 1);
  }
  return value;
}

/**
 * Elimina de body, query y params las claves con "$": así nadie puede mandar
 * desde la consola algo como ?brand[$regex]=... o {"email": {"$ne": ""}} y
 * hacer que Mongo lo interprete como operador.
 */
/** Limpia solo el body: para usar después de multer (forms multipart). */
export function sanitizeBody(body) {
  return sanitize(body, { allowDots: false });
}

export function sanitizeRequest(req, res, next) {
  sanitize(req.body, { allowDots: false });
  sanitize(req.query, { allowDots: true });
  sanitize(req.params, { allowDots: true });
  next();
}

/**
 * Store de express-rate-limit sobre MongoDB (ventana fija). El contador vive
 * en la base y no en la memoria del proceso, así que el límite se comparte
 * entre todas las instancias serverless y sobrevive a reinicios.
 */
class MongoRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  currentWindow(key) {
    const start = Math.floor(Date.now() / this.windowMs) * this.windowMs;
    return { id: `${this.prefix}:${key}:${start}`, resetTime: new Date(start + this.windowMs) };
  }

  async increment(key) {
    const { id, resetTime } = this.currentWindow(key);
    const update = { $inc: { hits: 1 }, $setOnInsert: { expiresAt: resetTime } };
    let doc;
    try {
      doc = await RateLimitHit.findOneAndUpdate({ _id: id }, update, { upsert: true, new: true, lean: true });
    } catch (err) {
      // Dos requests simultáneas pueden intentar crear el mismo contador: se reintenta una vez.
      if (err.code !== 11000) throw err;
      doc = await RateLimitHit.findOneAndUpdate({ _id: id }, update, { new: true, lean: true });
    }
    return { totalHits: doc.hits, resetTime };
  }

  async decrement(key) {
    await RateLimitHit.updateOne({ _id: this.currentWindow(key).id }, { $inc: { hits: -1 } });
  }

  async resetKey(key) {
    await RateLimitHit.deleteOne({ _id: this.currentWindow(key).id });
  }
}

function createLimiter(name, options) {
  return rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Demasiados intentos. Esperá unos minutos y volvé a probar." },
    store: new MongoRateLimitStore(name),
    // Si la base no responde, no se bloquea a los usuarios por el limitador.
    passOnStoreError: true,
    ...options
  });
}

// Fuerza bruta de contraseñas: 10 intentos fallidos por IP cada 15 minutos.
export const loginLimiter = createLimiter("login", { windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true });

// Alta masiva de cuentas: 5 registros por IP por hora.
export const registerLimiter = createLimiter("register", { windowMs: 60 * 60 * 1000, limit: 5 });

// Creación de pedidos y pagos (evita spam de pedidos / preferencias de MP).
export const orderLimiter = createLimiter("orders", { windowMs: 15 * 60 * 1000, limit: 30 });
