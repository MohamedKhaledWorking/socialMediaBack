import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  sharePost,
  getPostsByUser,
  adminDeletePost,
  getFeedPosts,
} from "./Services/post.service.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import {
  createPostSchema,
  updatePostSchema,
} from "./Validators/post.schema.js";
import { Multer } from "../../Middleware/multer.middleware.js";
import { authorizeRoles } from "../../Middleware/Authorization.middleware.js";

export const postRoutes = Router();

// Create a new post
postRoutes.post(
  "/",
  validateSchema(createPostSchema),
  authMiddleware,
  Multer(["image/jpeg", "image/png", "image/jpg", "video/mp4"]).fields([
    { name: "image", maxCount: 5 },
    { name: "video", maxCount: 3 },
  ]),
  errorHandler(createPost)
);

// Update a post
postRoutes.patch(
  "/:postId",
  validateSchema(updatePostSchema),
  authMiddleware,
  Multer(["image/jpeg", "image/png", "image/jpg", "video/mp4"]).fields([
    { name: "image", maxCount: 5 },
    { name: "video", maxCount: 3 },
  ]),
  errorHandler(updatePost)
);

// Get all posts (with pagination and filters)
postRoutes.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(getAllPosts)
);

// Get current user's posts
postRoutes.get("/my/posts", authMiddleware, errorHandler(getMyPosts));

// Get posts by a specific user
postRoutes.get("/user/:userId", authMiddleware, errorHandler(getPostsByUser));

// get the friend posts
postRoutes.get("/friends/posts", authMiddleware, errorHandler(getFeedPosts));

// Get a specific post by ID
postRoutes.get("/:postId", authMiddleware, errorHandler(getPostById));

// Delete a post
postRoutes.delete("/:postId", authMiddleware, errorHandler(deletePost));

// Delete a post
postRoutes.delete(
  "/admin/:postId",
  authMiddleware,
  authorizeRoles("admin"),
  errorHandler(adminDeletePost)
);

// Like a post
postRoutes.post("/:postId/like", authMiddleware, errorHandler(likePost));

// Unlike a post
postRoutes.delete("/:postId/like", authMiddleware, errorHandler(unlikePost));

// Share a post
postRoutes.post("/:postId/share", authMiddleware, errorHandler(sharePost));

// restart the server on railway