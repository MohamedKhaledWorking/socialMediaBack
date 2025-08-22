import { Router } from "express";
import { authMiddleware } from "../../Middleware/Authentication.middleware.js";
import { errorHandler } from "../../Middleware/errorHandler.middleware.js";
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  getVapidPublicKey
} from "./Services/pushNotification.service.js";
import { validateSchema } from "../../Middleware/validation.middleware.js";
import { pushSubscriptionSchema } from "./Validators/pushNotification.schema.js";

const router = Router();

// Subscribe to push notifications
router.post(
  "/subscribe",
  validateSchema(pushSubscriptionSchema),
  authMiddleware,
  errorHandler(subscribeToPushNotifications)
);

// Unsubscribe from push notifications
router.delete("/unsubscribe", authMiddleware, errorHandler(unsubscribeFromPushNotifications));

// Get VAPID public key for client
router.get("/vapid-key", errorHandler(getVapidPublicKey));

export { router as pushNotificationRoutes }; 