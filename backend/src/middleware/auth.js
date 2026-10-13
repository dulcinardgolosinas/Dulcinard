import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Un token emitido antes del último cambio de contraseña ya no sirve.
const isCurrentToken = (payload, user) => (payload.v ?? 0) === (user.tokenVersion ?? 0);

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No autenticado" });

    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await User.findById(payload.id);
    if (!user || !user.active || !isCurrentToken(payload, user)) return res.status(401).json({ message: "No autenticado" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

// Identifica al usuario si manda token, pero no exige estar logueado. Sirve
// para endpoints públicos que muestran más datos solo a un admin.
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await User.findById(payload.id);
    if (user?.active && isCurrentToken(payload, user)) req.user = user;
  } catch {
    // token inválido: se trata como visitante anónimo
  }
  next();
}

export const isAdmin = (req) => req.user?.role === "admin";

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso restringido a administradores" });
  }
  next();
}
