// routes/stories.routes.js
import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import {
  createStory,
  deleteStory,
  getStoriesFeed,
  getStoryMedia,
} from "./services/stories.service.js";
import { Multer } from "../../Middleware/multer.middleware.js";

export const storiesRoutes = Router();

const upload = Multer([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "video/mp4", 
]);

storiesRoutes.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 10 },
    { name: "video", maxCount: 5 },
  ]),
  errorHandler(createStory)
);

storiesRoutes.get(
  '/friends-stories',
  authMiddleware,
  errorHandler(getStoriesFeed)
)

storiesRoutes.delete("/:id", authMiddleware, errorHandler(deleteStory));

storiesRoutes.get("/:id", authMiddleware, errorHandler(getStoryMedia));
