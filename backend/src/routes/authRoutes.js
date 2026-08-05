import { Router } from "express";
import { register, login, me, updateProfile, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { registerValidator, loginValidator, updateProfileValidator, changePasswordValidator } from "../validators/authValidators.js";

const router = Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfileValidator, updateProfile);
router.put("/me/password", requireAuth, changePasswordValidator, changePassword);

export default router;
