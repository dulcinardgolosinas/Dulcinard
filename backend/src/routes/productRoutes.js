import { Router } from "express";
import {
  listProducts,
  getProduct,
  listBrands,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { upload, uploadSpreadsheet } from "../middleware/upload.js";
import { exportProductSheet, importProductSheet } from "../controllers/productSheetController.js";
import {
  listProductsWithoutImages,
  matchImageFiles,
  setMainImage,
  listProductOptions,
  suggestProductsForPhotos
} from "../controllers/productImagesController.js";
import { createProductValidator, updateProductValidator, importProductSheetValidator } from "../validators/productValidators.js";

const router = Router();

router.get("/", optionalAuth, listProducts);
router.get("/brands", listBrands);
// Planilla única de productos (código, nombre, precio, categoría y stock): descargar y subir.
router.get("/export/sheet", requireAuth, requireAdmin, exportProductSheet);
router.post("/import/sheet", requireAuth, requireAdmin, uploadSpreadsheet.single("file"), importProductSheetValidator, importProductSheet);
// Subida masiva de fotos (también antes de "/:idOrSlug").
router.get("/images/missing", requireAuth, requireAdmin, listProductsWithoutImages);
router.post("/images/match", requireAuth, requireAdmin, matchImageFiles);
router.get("/images/options", requireAuth, requireAdmin, listProductOptions);
router.post("/images/suggest", requireAuth, requireAdmin, suggestProductsForPhotos);
router.get("/:idOrSlug", optionalAuth, getProduct);
router.post("/", requireAuth, requireAdmin, upload.array("images", 6), createProductValidator, createProduct);
router.put("/:id", requireAuth, requireAdmin, upload.array("images", 6), updateProductValidator, updateProduct);
router.put("/:id/main-image", requireAuth, requireAdmin, upload.single("image"), setMainImage);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
