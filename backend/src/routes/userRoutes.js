import { Router } from "express";
import { listUsers, getUser, updateUser, deleteUser } from "../controllers/userController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { updateUserValidator } from "../validators/userValidators.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/", listUsers);
router.get("/:id", getUser);
router.put("/:id", updateUserValidator, updateUser);
router.delete("/:id", deleteUser);

export default router;
