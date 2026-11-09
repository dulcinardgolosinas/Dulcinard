import { Router } from "express";
import {
  getSiteConfig,
  updateSiteConfig,
  updateLogo,
  updateSecondaryLogo,
  deleteSecondaryLogo,
  updateFavicon,
  uploadBranchImage
} from "../controllers/siteConfigController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload, uploadLogoFile } from "../middleware/upload.js";
import { updateSiteConfigValidator } from "../validators/siteConfigValidators.js";

const router = Router();

router.get("/", getSiteConfig);
router.put("/", requireAuth, requireAdmin, updateSiteConfigValidator, updateSiteConfig);
router.put("/logo", requireAuth, requireAdmin, uploadLogoFile.single("logo"), updateLogo);
router.put("/secondary-logo", requireAuth, requireAdmin, uploadLogoFile.single("logo"), updateSecondaryLogo);
router.delete("/secondary-logo", requireAuth, requireAdmin, deleteSecondaryLogo);
router.put("/favicon", requireAuth, requireAdmin, upload.single("favicon"), updateFavicon);
router.put("/branches/:branchId/image", requireAuth, requireAdmin, upload.single("image"), uploadBranchImage);

export default router;
