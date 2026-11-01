import { body, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import { ORDER_STATUSES, CHECKOUT_PAYMENT_METHODS } from "../models/Order.js";
import { PHONE_REGEX } from "../utils/validationPatterns.js";

export const createOrderValidator = [
  body("items").isArray({ min: 1, max: 200 }).withMessage("El carrito debe tener entre 1 y 200 productos"),
  body("items.*.productId").isMongoId().withMessage("Producto inválido en el carrito"),
  body("items.*.quantity").isInt({ min: 1, max: 100000 }).withMessage("La cantidad debe ser un número entero mayor a 0"),
  body("shippingAddress.phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono de contacto es obligatorio")
    .matches(PHONE_REGEX)
    .withMessage("El teléfono solo puede contener números")
    .isLength({ min: 6, max: 20 })
    .withMessage("El teléfono debe tener entre 6 y 20 dígitos"),
  body("shippingAddress.street")
    .trim()
    .notEmpty()
    .withMessage("La dirección es obligatoria")
    .isLength({ min: 3, max: 150 })
    .withMessage("La dirección debe tener entre 3 y 150 caracteres"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("La localidad es obligatoria")
    .isLength({ min: 2, max: 80 })
    .withMessage("La localidad debe tener entre 2 y 80 caracteres"),
  body("shippingAddress.zone").optional({ checkFalsy: true }).isMongoId().withMessage("Zona de envío inválida"),
  body("shippingAddress.notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("Las notas no pueden superar los 500 caracteres"),
  body("paymentMethod").optional({ checkFalsy: true }).isIn(CHECKOUT_PAYMENT_METHODS).withMessage("Método de pago inválido"),
  validate
];

const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;
export const exportDeliveredValidator = [
  query("from").optional({ checkFalsy: true }).matches(DATE_PARAM).withMessage("La fecha \"desde\" no es válida"),
  query("to").optional({ checkFalsy: true }).matches(DATE_PARAM).withMessage("La fecha \"hasta\" no es válida"),
  query("to")
    .optional({ checkFalsy: true })
    .custom((to, { req }) => !req.query.from || req.query.from <= to)
    .withMessage("La fecha \"desde\" tiene que ser anterior a la fecha \"hasta\""),
  validate
];

export const updateOrderStatusValidator = [
  body("status").notEmpty().withMessage("Elegí un estado").isIn(ORDER_STATUSES).withMessage("Estado de pedido inválido"),
  validate
];
