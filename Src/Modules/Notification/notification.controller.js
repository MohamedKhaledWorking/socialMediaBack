import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { 
  getUserNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
} from "./Services/notification.service.js";

const router = Router();

// Get user notifications (paginated)
router.get("/", authMiddleware, errorHandler(getUserNotifications));

// Mark notification as read
router.patch("/:notificationId/read", authMiddleware, errorHandler(markNotificationAsRead));

// Mark all notifications as read
router.patch("/read-all", authMiddleware, errorHandler(markAllNotificationsAsRead));

// Delete a specific notification
router.delete("/:notificationId", authMiddleware, errorHandler(deleteNotification));

// Delete all notifications
router.delete("/", authMiddleware, errorHandler(deleteAllNotifications));

export { router as notificationRoutes }; 