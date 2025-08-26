import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import {
  acceptFriend,
  addFriend,
  cancelFriendRequest,
  getFriends,
  getPendingRequests,
  getSuggestedFriends,
  rejectFriend,
  unfriend,
} from "./services/friend.service.js";
import { FriendSchema } from "./validation/friend.schema.js";

import { Router } from "express";

export const friendRoutes = Router();

friendRoutes.get(
  "/suggestedFriends",
  authMiddleware,
  errorHandler(getSuggestedFriends)
);

friendRoutes.get(
  "/requests",
  authMiddleware,
  errorHandler(getPendingRequests)
)


friendRoutes.get(
  "/:friendId",
  validateSchema(FriendSchema),
  authMiddleware,
  errorHandler(addFriend)
);

friendRoutes.get(
  "/accept/:friendId",
  validateSchema(FriendSchema),
  authMiddleware,
  errorHandler(acceptFriend)
);

friendRoutes.get(
  "/cancel/:friendId",
  validateSchema(FriendSchema),
  authMiddleware,
  errorHandler(cancelFriendRequest)
);

friendRoutes.get(
  "/rejectFriend/:friendId",
  validateSchema(FriendSchema),
  authMiddleware,
  errorHandler(rejectFriend)
);

friendRoutes.get(
  "/unfriend/:friendId",
  validateSchema(FriendSchema),
  authMiddleware,
  errorHandler(unfriend)
);


friendRoutes.get("/", authMiddleware, errorHandler(getFriends));
