import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { searchUsers, searchPosts } from "./Services/search.service.js";

export const searchRoutes = Router();

searchRoutes.get("/users", authMiddleware, errorHandler(searchUsers));

searchRoutes.get("/posts", authMiddleware, errorHandler(searchPosts));
