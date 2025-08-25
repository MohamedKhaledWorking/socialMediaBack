import { Router } from "express";
import { adminDeleteMessage, allMessages, getFriendMessages } from "./services/services.message.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { authorizeRoles } from "../../Middleware/Authorization.middleware.js";

export const messageRoutes = Router();

messageRoutes.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(allMessages)
)

messageRoutes.get(
  "/:friendId",
  authMiddleware,
  errorHandler(getFriendMessages)
);

messageRoutes.delete(
  "/admin/:messageId",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(adminDeleteMessage)
);
