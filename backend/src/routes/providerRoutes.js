import { Router } from "express";
import {
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  uploadProviderLogo,
  deleteProviderLogo
} from "../controllers/providerController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { createProviderValidator, updateProviderValidator } from "../validators/providerValidators.js";

const router = Router();

router.get("/", listProviders);
router.post("/", requireAuth, requireAdmin, upload.single("logo"), createProviderValidator, createProvider);
router.put("/:id", requireAuth, requireAdmin, updateProviderValidator, updateProvider);
router.put("/:id/logo", requireAuth, requireAdmin, upload.single("logo"), uploadProviderLogo);
router.delete("/:id/logo", requireAuth, requireAdmin, deleteProviderLogo);
router.delete("/:id", requireAuth, requireAdmin, deleteProvider);

export default router;
