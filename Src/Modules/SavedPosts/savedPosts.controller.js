import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { getSavedPosts, savePost, unsavePost } from "./services/savedPosts.service.js";

export const savedPostsRoutes = Router();

savedPostsRoutes.get("/"  , authMiddleware , errorHandler(getSavedPosts))

savedPostsRoutes.post("/:postId", authMiddleware, errorHandler(savePost));

savedPostsRoutes.delete("/:postId", authMiddleware, errorHandler(unsavePost));

