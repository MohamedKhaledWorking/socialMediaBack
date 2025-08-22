import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { 
  sendMessage, 
  getChatHistory,
  getConversations,
  markMessageAsRead,
  deleteMessage,
  markMessageAsSeen,
  markConversationAsSeen
} from "./Services/message.service.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import { sendMessageSchema } from "./Validators/message.schema.js";

const router = Router();

// Send a private message
router.post(
  "/",
  validateSchema(sendMessageSchema),
  authMiddleware,
  errorHandler(sendMessage)
);

// Get chat history between two users
router.get("/:userId", authMiddleware, errorHandler(getChatHistory));

// Get all conversations for current user
router.get("/", authMiddleware, errorHandler(getConversations));

// Mark message as read
router.patch("/:messageId/read", authMiddleware, errorHandler(markMessageAsRead));

// Delete a message
router.delete("/:messageId", authMiddleware, errorHandler(deleteMessage));

// Mark message as seen
router.patch("/:messageId/seen", authMiddleware, errorHandler(markMessageAsSeen));

// Mark all messages in a conversation as seen
router.patch("/conversation/:userId/seen", authMiddleware, errorHandler(markConversationAsSeen));

export { router as messageRoutes }; 