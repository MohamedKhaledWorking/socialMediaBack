import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "./Services/follow.service.js";

const router = Router();

router.get("/follow/:userId", authMiddleware, errorHandler(followUser));

router.get("/unfollow/:userId", authMiddleware, errorHandler(unfollowUser));

router.get("/followers", authMiddleware, errorHandler(getFollowers));

router.get("/following", authMiddleware, errorHandler(getFollowing));

export { router as followRoutes };
