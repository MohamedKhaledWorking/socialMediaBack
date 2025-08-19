import { Router } from "express";
import {
  forgetPassword,
  loginController,
  logoutController,
  registerController,
  resetPassword,
  verifyEmail,
} from "./Services/auth.service.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import {
  forgetPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
  verifyEmailSchema,
} from "./Validators/auth.schema.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";

export const authRoutes = Router();

authRoutes.post(
  "/signUp",
  validateSchema(signUpSchema),
  errorHandler(registerController)
);

authRoutes.post(
  "/login",
  validateSchema(loginSchema),
  errorHandler(loginController)
);

authRoutes.patch(
  "/verify-email",
  validateSchema(verifyEmailSchema),
  errorHandler(verifyEmail)
);

authRoutes.post(
  "/forget-password",
  validateSchema(forgetPasswordSchema),
  errorHandler(forgetPassword)
);

authRoutes.patch(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  errorHandler(resetPassword)
);

authRoutes.post("/logout", errorHandler(logoutController));
