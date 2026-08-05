import { Router } from "express";
import { getSiteConfig, updateSiteConfig, updateLogo, updateFavicon } from "../controllers/siteConfigController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", getSiteConfig);
router.put("/", requireAuth, requireAdmin, updateSiteConfig);
router.put("/logo", requireAuth, requireAdmin, upload.single("logo"), updateLogo);
router.put("/favicon", requireAuth, requireAdmin, upload.single("favicon"), updateFavicon);

export default router;
