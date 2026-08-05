import { Router } from "express";
import {
  listShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone
} from "../controllers/shippingZoneController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listShippingZones);
router.post("/", requireAuth, requireAdmin, createShippingZone);
router.put("/:id", requireAuth, requireAdmin, updateShippingZone);
router.delete("/:id", requireAuth, requireAdmin, deleteShippingZone);

export default router;
