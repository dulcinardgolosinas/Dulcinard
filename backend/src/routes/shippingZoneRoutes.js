import { Router } from "express";
import {
  listShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone
} from "../controllers/shippingZoneController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { createShippingZoneValidator, updateShippingZoneValidator } from "../validators/shippingZoneValidators.js";

const router = Router();

router.get("/", listShippingZones);
router.post("/", requireAuth, requireAdmin, createShippingZoneValidator, createShippingZone);
router.put("/:id", requireAuth, requireAdmin, updateShippingZoneValidator, updateShippingZone);
router.delete("/:id", requireAuth, requireAdmin, deleteShippingZone);

export default router;
