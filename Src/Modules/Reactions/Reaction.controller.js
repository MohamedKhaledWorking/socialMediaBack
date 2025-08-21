import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { removeReaction, upsertReaction } from "./services/reaction.service.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import { createReactionSchema } from "./validation/reaction.schema.js";

export const reactionRoutes = Router();

reactionRoutes.post(
  "/:postId",
  authMiddleware,
  validateSchema(createReactionSchema),
  errorHandler(upsertReaction)
);

reactionRoutes.delete("/:postId", authMiddleware, errorHandler(removeReaction));
