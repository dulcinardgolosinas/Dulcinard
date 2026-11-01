import { Router } from "express";
import {
  listPromotions,
  listHomePromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} from "../controllers/promotionController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { createPromotionValidator, updatePromotionValidator } from "../validators/promotionValidators.js";

const router = Router();

router.get("/", listPromotions);
router.get("/home", listHomePromotions);
router.get("/:id", getPromotion);
router.post("/", requireAuth, requireAdmin, upload.single("banner"), createPromotionValidator, createPromotion);
router.put("/:id", requireAuth, requireAdmin, upload.single("banner"), updatePromotionValidator, updatePromotion);
router.delete("/:id", requireAuth, requireAdmin, deletePromotion);

export default router;
