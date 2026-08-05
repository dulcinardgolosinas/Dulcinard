import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No autenticado" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.active) return res.status(401).json({ message: "No autenticado" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso restringido a administradores" });
  }
  next();
}
