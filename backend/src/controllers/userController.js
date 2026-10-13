import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, paginatedResponse, searchRegex } from "../utils/query.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { q, role } = req.query;
  const filter = {};
  if (q?.trim()) {
    const regex = searchRegex(q);
    filter.$or = [{ name: regex }, { email: regex }, { businessName: regex }];
  }
  if (role === "admin" || role === "cliente") filter.role = role;

  const pagination = parsePagination(req.query, 20);

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(filter)
  ]);

  res.json(paginatedResponse(items, total, pagination));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const { role, active, name, businessName, phone } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  // Un admin no puede quitarse el rol ni bloquearse: evita quedarse sin acceso al panel.
  const isSelf = user._id.equals(req.user._id);
  if (isSelf && ((role !== undefined && role !== "admin") || active === false)) {
    return res.status(400).json({ message: "No podés quitarte el rol de admin ni bloquear tu propia cuenta" });
  }

  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (name !== undefined) user.name = name;
  if (businessName !== undefined) user.businessName = businessName;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.equals(req.params.id)) {
    return res.status(400).json({ message: "No podés eliminar tu propia cuenta" });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json({ message: "Usuario eliminado" });
});
