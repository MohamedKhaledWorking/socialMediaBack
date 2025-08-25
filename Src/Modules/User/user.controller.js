import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import {
  activateAccount,
  createAdmin,
  deleteAllUsers,
  deleteProfile,
  freezeProfile,
  getAllUsers,
  getProfile,
  updateProfile,
  updateUserPassword,
  shareAccount,
  getSharedAccounts,
  getMySharedAccounts,
  removeSharedAccess,
  getUserById,
  banUser,
  getAllBannedUsers,
  unBanUser,
} from "./Services/user.service.js";
import { authorizeRoles } from "../../Middleware/Authorization.middleware.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import {
  activateAccountSchema,
  createUserSchema,
  freezeAccountSchema,
  updateUserPasswordSchema,
  updateUserSchema,
} from "./Validators/user.schema.js";
import { Multer } from "../../Middleware/multer.middleware.js";

export const userRoutes = Router();

userRoutes.get("/profile", authMiddleware, errorHandler(getProfile));

userRoutes.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(getAllUsers)
);

userRoutes.get(
  "/getAllBannedUsers",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(getAllBannedUsers)
);

userRoutes.get(
  "/getUser/:userId",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(getUserById)
);

userRoutes.post(
  "/create-user",
  authMiddleware,
  authorizeRoles("admin"),
  Multer(["image/jpeg", "image/png", "image/jpg"]).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateSchema(createUserSchema),
  errorHandler(createAdmin)
);

userRoutes.patch(
  "/update-profile",
  authMiddleware,
  Multer(["image/jpeg", "image/png", "image/jpg"]).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateSchema(updateUserSchema),
  errorHandler(updateProfile)
);

userRoutes.patch(
  "/update-password",
  validateSchema(updateUserPasswordSchema),
  authMiddleware,
  errorHandler(updateUserPassword)
);

userRoutes.patch(
  "/freeze-profile",
  validateSchema(freezeAccountSchema),
  authMiddleware,
  errorHandler(freezeProfile)
);

userRoutes.patch(
  "/activate-profile",
  validateSchema(activateAccountSchema),
  errorHandler(activateAccount)
);

userRoutes.patch(
  "/banUser/:userId",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(banUser)
);

userRoutes.patch(
  "/unBanUser/:userId",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(unBanUser)
);

userRoutes.delete(
  "/delete-profile/:profileId",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(deleteProfile)
);

userRoutes.delete(
  "/deleteAllUsers",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(deleteAllUsers)
);

userRoutes.post("/share-account", authMiddleware, errorHandler(shareAccount));

userRoutes.get(
  "/shared-accounts",
  authMiddleware,
  errorHandler(getSharedAccounts)
);

userRoutes.get(
  "/my-shared-accounts",
  authMiddleware,
  errorHandler(getMySharedAccounts)
);

userRoutes.delete(
  "/remove-share/:shareId",
  authMiddleware,
  errorHandler(removeSharedAccess)
);
