import { Router } from "express";
import {
  createOrder,
  createPaymentPreference,
  mercadoPagoWebhook,
  syncOrderPayment,
  listMyOrders,
  getMyOrder,
  listAllOrders,
  getOrderAdmin,
  updateOrderStatus,
  confirmOrderPayment,
  exportDeliveredOrders
} from "../controllers/orderController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { orderLimiter } from "../middleware/security.js";
import { uploadSpreadsheet } from "../middleware/upload.js";
import { exportPendingDelivery, importDeliveredOrders } from "../controllers/deliveredImportController.js";
import { createOrderValidator, updateOrderStatusValidator, exportDeliveredValidator } from "../validators/orderValidators.js";

const router = Router();

// Webhook público (lo llama Mercado Pago, no un usuario autenticado)
router.post("/mercadopago/webhook", mercadoPagoWebhook);

router.post("/", requireAuth, orderLimiter, createOrderValidator, createOrder);
router.get("/mine", requireAuth, listMyOrders);
router.get("/mine/:id", requireAuth, getMyOrder);
router.post("/:id/pay", requireAuth, orderLimiter, createPaymentPreference);
router.post("/:id/sync-payment", requireAuth, orderLimiter, syncOrderPayment);

router.get("/", requireAuth, requireAdmin, listAllOrders);
// Antes de "/:id" para que "export" no se tome como id de pedido.
router.get("/export/delivered", requireAuth, requireAdmin, exportDeliveredValidator, exportDeliveredOrders);
// Marcar entregados en masa: planilla para completar y subida con vista previa.
router.get("/export/pending-delivery", requireAuth, requireAdmin, exportPendingDelivery);
router.post("/import/delivered", requireAuth, requireAdmin, uploadSpreadsheet.single("file"), importDeliveredOrders);
router.get("/:id", requireAuth, requireAdmin, getOrderAdmin);
router.put("/:id/status", requireAuth, requireAdmin, updateOrderStatusValidator, updateOrderStatus);
router.put("/:id/confirm-payment", requireAuth, requireAdmin, confirmOrderPayment);

export default router;
