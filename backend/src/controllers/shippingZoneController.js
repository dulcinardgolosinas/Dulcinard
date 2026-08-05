import ShippingZone from "../models/ShippingZone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listShippingZones = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { active: true };
  const zones = await ShippingZone.find(filter).sort({ name: 1 });
  res.json(zones);
});

export const createShippingZone = asyncHandler(async (req, res) => {
  const zone = await ShippingZone.create(req.body);
  res.status(201).json(zone);
});

export const updateShippingZone = asyncHandler(async (req, res) => {
  const zone = await ShippingZone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!zone) return res.status(404).json({ message: "Zona no encontrada" });
  res.json(zone);
});

export const deleteShippingZone = asyncHandler(async (req, res) => {
  const zone = await ShippingZone.findByIdAndDelete(req.params.id);
  if (!zone) return res.status(404).json({ message: "Zona no encontrada" });
  res.json({ message: "Zona eliminada" });
});
