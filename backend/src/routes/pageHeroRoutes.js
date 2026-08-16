import { Router } from "express";
import { listPageHeroes, getPageHero, uploadPageHeroImage, deletePageHeroImage } from "../controllers/pageHeroController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, listPageHeroes);
router.get("/:page", getPageHero);
router.put("/:page/image", requireAuth, requireAdmin, upload.single("image"), uploadPageHeroImage);
router.delete("/:page/image", requireAuth, requireAdmin, deletePageHeroImage);

export default router;
