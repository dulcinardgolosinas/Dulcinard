import { Router } from "express";
import { register, login, me, updateProfile, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter, registerLimiter } from "../middleware/security.js";
import { registerValidator, loginValidator, updateProfileValidator, changePasswordValidator } from "../validators/authValidators.js";

const router = Router();

router.post("/register", registerLimiter, registerValidator, register);
router.post("/login", loginLimiter, loginValidator, login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfileValidator, updateProfile);
router.put("/me/password", requireAuth, changePasswordValidator, changePassword);

export default router;
