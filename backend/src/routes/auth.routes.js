import { Router } from "express";
import {
  forgotPassword,
  login,
  loginGoogle,
  loginWallet,
  logout,
  refresh,
  register,
  resetPassword,
  whoami,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  walletLoginSchema,
} from "../validators/auth.validators.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/login-wallet", validate(walletLoginSchema), loginWallet);
authRouter.post("/login-google", validate(googleLoginSchema), loginGoogle);
authRouter.post("/refresh", validate(refreshSchema), refresh);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRouter.get("/me", requireAuth, whoami);
