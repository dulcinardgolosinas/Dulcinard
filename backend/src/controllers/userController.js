import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { businessName: new RegExp(q, "i") }
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter)
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 });
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

  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (name !== undefined) user.name = name;
  if (businessName !== undefined) user.businessName = businessName;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json({ message: "Usuario eliminado" });
});
