import { NotificationModel } from "../../../DB/Models/Notification.model.js";

export const initializeNotificationHandlers = (io, socket, checkRateLimit) => {
  // Handle notification read via socket
  socket.on("mark_notification_read", async (data) => {
    if (!checkRateLimit(socket, "mark_notification_read", 20, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for notification updates" });
    }

    try {
      const { notificationId } = data;

      if (!notificationId) {
        return socket.emit("error", { message: "Notification ID is required" });
      }

      // Update notification as read
      const notification = await NotificationModel.findOneAndUpdate(
        {
          _id: notificationId,
          userId: socket.userId,
        },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return socket.emit("error", { message: "Notification not found" });
      }

      // Confirm to sender
      socket.emit("notification_updated", {
        notificationId,
        isRead: true,
        status: "success",
      });

    } catch (error) {
      console.error("Socket notification read error:", error);
      socket.emit("error", { message: "Failed to mark notification as read" });
    }
  });

  // Handle notification deletion via socket
  socket.on("delete_notification", async (data) => {
    if (!checkRateLimit(socket, "delete_notification", 10, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for notification deletion" });
    }

    try {
      const { notificationId } = data;

      if (!notificationId) {
        return socket.emit("error", { message: "Notification ID is required" });
      }

      // Delete notification
      const notification = await NotificationModel.findOneAndDelete({
        _id: notificationId,
        userId: socket.userId,
      });

      if (!notification) {
        return socket.emit("error", { message: "Notification not found" });
      }

      // Confirm deletion
      socket.emit("notification_deleted", {
        notificationId,
        status: "success",
      });

    } catch (error) {
      console.error("Socket notification deletion error:", error);
      socket.emit("error", { message: "Failed to delete notification" });
    }
  });

  // Handle mark all notifications as read
  socket.on("mark_all_notifications_read", async () => {
    if (!checkRateLimit(socket, "mark_all_notifications_read", 3, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for bulk notification updates" });
    }

    try {
      const result = await NotificationModel.updateMany(
        { userId: socket.userId, isRead: false },
        { isRead: true }
      );

      socket.emit("all_notifications_updated", {
        modifiedCount: result.modifiedCount,
        status: "success",
      });

    } catch (error) {
      console.error("Socket bulk notification update error:", error);
      socket.emit("error", { message: "Failed to update all notifications" });
    }
  });

  // Handle notification preferences
  socket.on("update_notification_preferences", async (data) => {
    if (!checkRateLimit(socket, "update_notification_preferences", 2, 300000)) {
      return socket.emit("error", { message: "Rate limit exceeded for preference updates" });
    }

    try {
      const { preferences } = data;

      if (!preferences || typeof preferences !== "object") {
        return socket.emit("error", { message: "Invalid preferences data" });
      }

      // Here you would typically update user notification preferences
      // For now, we'll just acknowledge the request
      socket.emit("preferences_updated", {
        status: "success",
        message: "Notification preferences updated",
      });

    } catch (error) {
      console.error("Socket notification preferences error:", error);
      socket.emit("error", { message: "Failed to update notification preferences" });
    }
  });
}; 