import { NotificationModel } from "../../../DB/Models/Notification.model.js";
import { sendPushNotification } from "./pushNotification.service.js";

// Create a new notification
export const createNotification = async (notificationData) => {
  try {
    const notification = await NotificationModel.create(notificationData);
    
    // Send push notification if user has subscriptions
    try {
      await sendPushNotification(notificationData.userId, {
        title: getNotificationTitle(notificationData.type),
        body: notificationData.message,
        type: notificationData.type,
        fromUser: notificationData.fromUser,
        postId: notificationData.postId,
        data: {
          notificationId: notification._id,
          ...notificationData.metadata
        }
      });
    } catch (pushError) {
      console.error("Push notification failed:", pushError);
      // Don't fail the main notification creation
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Helper function to get notification titles
const getNotificationTitle = (type) => {
  const titles = {
    new_reaction: "New Reaction",
    new_follow: "New Follower",
    follow_accepted: "Follow Accepted",
    new_message: "New Message",
    new_comment: "New Comment",
    post_liked: "Post Liked",
    mention: "You were mentioned",
    system: "System Notification"
  };
  
  return titles[type] || "New Notification";
};

// Get user notifications (paginated)
export const getUserNotifications = async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type, isRead } = req.query;
  const skip = (page - 1) * limit;

  const filter = { userId };
  
  if (type) filter.type = type;
  if (isRead !== undefined) filter.isRead = isRead === "true";

  const notifications = await NotificationModel.find(filter)
    .populate("fromUser", "username profileImage")
    .populate("postId", "content")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await NotificationModel.countDocuments(filter);

  return res.status(200).json({
    status: "success",
    notifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      hasNext: skip + notifications.length < total,
      hasPrev: page > 1,
    },
  });
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      userId: userId,
    },
    { isRead: true },
    { new: true }
  ).populate("fromUser", "username profileImage");

  if (!notification) {
    return res.status(404).json({
      status: "failure",
      error: "Notification not found",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Notification marked as read",
    notification,
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user._id;

  const result = await NotificationModel.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  return res.status(200).json({
    status: "success",
    message: `${result.modifiedCount} notifications marked as read`,
    modifiedCount: result.modifiedCount,
  });
};

// Delete a specific notification
export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await NotificationModel.findOneAndDelete({
    _id: notificationId,
    userId: userId,
  });

  if (!notification) {
    return res.status(404).json({
      status: "failure",
      error: "Notification not found",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Notification deleted successfully",
  });
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  const userId = req.user._id;

  const result = await NotificationModel.deleteMany({ userId });

  return res.status(200).json({
    status: "success",
    message: `${result.deletedCount} notifications deleted successfully`,
    deletedCount: result.deletedCount,
  });
}; 