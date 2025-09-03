import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { httpCreateComment, httpDeleteComment, httpListComments } from "./comment.controller.js";

export const commentRoutes = Router();

commentRoutes.get("/:postId", authMiddleware, errorHandler(httpListComments));
commentRoutes.post("/:postId", authMiddleware, errorHandler(httpCreateComment));
commentRoutes.delete("/:commentId", authMiddleware, errorHandler(httpDeleteComment));
