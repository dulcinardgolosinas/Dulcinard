import { Router } from "express";
import {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} from "../controllers/promotionController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listPromotions);
router.get("/:id", getPromotion);
router.post("/", requireAuth, requireAdmin, upload.single("banner"), createPromotion);
router.put("/:id", requireAuth, requireAdmin, upload.single("banner"), updatePromotion);
router.delete("/:id", requireAuth, requireAdmin, deletePromotion);

export default router;
