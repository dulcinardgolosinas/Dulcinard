import { Router } from "express";
import { getSiteConfig, updateSiteConfig, updateLogo, updateFavicon, uploadBranchImage } from "../controllers/siteConfigController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { updateSiteConfigValidator } from "../validators/siteConfigValidators.js";

const router = Router();

router.get("/", getSiteConfig);
router.put("/", requireAuth, requireAdmin, updateSiteConfigValidator, updateSiteConfig);
router.put("/logo", requireAuth, requireAdmin, upload.single("logo"), updateLogo);
router.put("/favicon", requireAuth, requireAdmin, upload.single("favicon"), updateFavicon);
router.put("/branches/:branchId/image", requireAuth, requireAdmin, upload.single("image"), uploadBranchImage);

export default router;
