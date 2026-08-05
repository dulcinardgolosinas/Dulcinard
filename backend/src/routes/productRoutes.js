import { Router } from "express";
import {
  listProducts,
  getProduct,
  listBrands,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listProducts);
router.get("/brands", listBrands);
router.get("/:idOrSlug", getProduct);
router.post("/", requireAuth, requireAdmin, upload.array("images", 6), createProduct);
router.put("/:id", requireAuth, requireAdmin, upload.array("images", 6), updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
