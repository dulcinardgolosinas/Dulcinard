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
  confirmOrderPayment
} from "../controllers/orderController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { orderLimiter } from "../middleware/security.js";
import { createOrderValidator, updateOrderStatusValidator } from "../validators/orderValidators.js";

const router = Router();

// Webhook público (lo llama Mercado Pago, no un usuario autenticado)
router.post("/mercadopago/webhook", mercadoPagoWebhook);

router.post("/", requireAuth, orderLimiter, createOrderValidator, createOrder);
router.get("/mine", requireAuth, listMyOrders);
router.get("/mine/:id", requireAuth, getMyOrder);
router.post("/:id/pay", requireAuth, orderLimiter, createPaymentPreference);
router.post("/:id/sync-payment", requireAuth, orderLimiter, syncOrderPayment);

router.get("/", requireAuth, requireAdmin, listAllOrders);
router.get("/:id", requireAuth, requireAdmin, getOrderAdmin);
router.put("/:id/status", requireAuth, requireAdmin, updateOrderStatusValidator, updateOrderStatus);
router.put("/:id/confirm-payment", requireAuth, requireAdmin, confirmOrderPayment);

export default router;
