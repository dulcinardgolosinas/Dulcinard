import { Router } from "express";
import {
  createOrder,
  createPaymentPreference,
  mercadoPagoWebhook,
  listMyOrders,
  getMyOrder,
  listAllOrders,
  getOrderAdmin,
  updateOrderStatus
} from "../controllers/orderController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { createOrderValidator, updateOrderStatusValidator } from "../validators/orderValidators.js";

const router = Router();

// Webhook público (lo llama Mercado Pago, no un usuario autenticado)
router.post("/mercadopago/webhook", mercadoPagoWebhook);

router.post("/", requireAuth, createOrderValidator, createOrder);
router.get("/mine", requireAuth, listMyOrders);
router.get("/mine/:id", requireAuth, getMyOrder);
router.post("/:id/pay", requireAuth, createPaymentPreference);

router.get("/", requireAuth, requireAdmin, listAllOrders);
router.get("/:id", requireAuth, requireAdmin, getOrderAdmin);
router.put("/:id/status", requireAuth, requireAdmin, updateOrderStatusValidator, updateOrderStatus);

export default router;
