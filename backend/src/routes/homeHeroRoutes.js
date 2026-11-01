import { Router } from "express";
import {
  listHomeHeroImages,
  addHomeHeroImage,
  updateHomeHeroImage,
  deleteHomeHeroImage
} from "../controllers/homeHeroController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

import { updateHomeHeroImageValidator } from "../validators/homeHeroValidators.js";

const router = Router();

router.get("/", listHomeHeroImages);
router.post("/", requireAuth, requireAdmin, upload.single("image"), addHomeHeroImage);
router.put("/:id", requireAuth, requireAdmin, updateHomeHeroImageValidator, updateHomeHeroImage);
router.delete("/:id", requireAuth, requireAdmin, deleteHomeHeroImage);

export default router;
