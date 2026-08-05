import { Router } from "express";
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", requireAuth, requireAdmin, upload.single("image"), createCategory);
router.put("/:id", requireAuth, requireAdmin, upload.single("image"), updateCategory);
router.delete("/:id", requireAuth, requireAdmin, deleteCategory);

export default router;
