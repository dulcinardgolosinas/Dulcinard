import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

export const register = asyncHandler(async (req, res) => {
  const { name, businessName, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Ya existe una cuenta con ese email" });

  const user = await User.create({ name, businessName, email, password, phone });
  const token = generateToken(user);
  res.status(201).json({ user: sanitizeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email y contraseña son obligatorios" });

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !user.active) return res.status(401).json({ message: "Credenciales inválidas" });

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: "Credenciales inválidas" });

  const token = generateToken(user);
  res.json({ user: sanitizeUser(user), token });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, businessName, phone, addresses } = req.body;

  if (name !== undefined) req.user.name = name;
  if (businessName !== undefined) req.user.businessName = businessName;
  if (phone !== undefined) req.user.phone = phone;
  // Solo los campos conocidos de cada dirección (nada de _id u otros campos inventados).
  if (addresses !== undefined) {
    req.user.addresses = addresses.map(({ label, street, city, zone, notes }) => ({
      label: label || "Principal",
      street,
      city,
      zone: zone || null,
      notes: notes || ""
    }));
  }

  await req.user.save();
  res.json({ user: sanitizeUser(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  const match = await user.comparePassword(currentPassword);
  if (!match) return res.status(400).json({ message: "La contraseña actual es incorrecta" });

  user.password = newPassword;
  // Cierra las sesiones abiertas en otros dispositivos; esta recibe un token nuevo.
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ message: "Contraseña actualizada", token: generateToken(user) });
});
