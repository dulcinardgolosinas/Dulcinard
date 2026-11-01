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
import { updatePricesFromFile } from "../controllers/priceUpdateController.js";
import { exportStock, importStockFromFile } from "../controllers/stockExcelController.js";
import {
  listProductsWithoutImages,
  matchImageFiles,
  setMainImage,
  listProductOptions,
  suggestProductsForPhotos
} from "../controllers/productImagesController.js";
import { createProductValidator, updateProductValidator } from "../validators/productValidators.js";

const router = Router();

router.get("/", optionalAuth, listProducts);
router.get("/brands", listBrands);
// Actualización masiva de precios: va antes de "/:idOrSlug" para que "import" no se tome como slug.
router.post("/import/prices", requireAuth, requireAdmin, uploadSpreadsheet.single("file"), updatePricesFromFile);
// Stock en Excel: descargar el actual y actualizarlo en masa.
router.get("/export/stock", requireAuth, requireAdmin, exportStock);
router.post("/import/stock", requireAuth, requireAdmin, uploadSpreadsheet.single("file"), importStockFromFile);
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
