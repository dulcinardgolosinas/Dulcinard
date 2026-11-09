import { Router } from "express";
import {
  listHomeHeroImages,
  addHomeHeroImage,
  updateHomeHeroImage,
  deleteHomeHeroImage,
  getVideoUploadSignature,
  addHomeHeroVideo,
  replaceHomeHeroMedia
} from "../controllers/homeHeroController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

import { updateHomeHeroImageValidator, videoValidator } from "../validators/homeHeroValidators.js";

const router = Router();

router.get("/", listHomeHeroImages);
router.post("/", requireAuth, requireAdmin, upload.single("image"), addHomeHeroImage);
// Videos: el panel pide permiso, sube directo a Cloudinary y avisa cuál subió.
router.get("/upload-signature", requireAuth, requireAdmin, getVideoUploadSignature);
router.post("/video", requireAuth, requireAdmin, videoValidator, addHomeHeroVideo);
router.put("/:id/media", requireAuth, requireAdmin, upload.single("image"), replaceHomeHeroMedia);
router.put("/:id", requireAuth, requireAdmin, updateHomeHeroImageValidator, updateHomeHeroImage);
router.delete("/:id", requireAuth, requireAdmin, deleteHomeHeroImage);

export default router;
