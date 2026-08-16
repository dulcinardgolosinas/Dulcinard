import { Router } from "express";
import { listProviders, updateProvider, uploadProviderLogo, deleteProviderLogo } from "../controllers/providerController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listProviders);
router.put("/:id", requireAuth, requireAdmin, updateProvider);
router.put("/:id/logo", requireAuth, requireAdmin, upload.single("logo"), uploadProviderLogo);
router.delete("/:id/logo", requireAuth, requireAdmin, deleteProviderLogo);

export default router;
