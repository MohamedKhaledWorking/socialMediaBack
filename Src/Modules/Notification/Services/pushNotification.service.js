import webpush from 'web-push';
import { UserModel } from "../../../DB/Models/User.model.js";

// Configure web-push with your VAPID keys
// These should be set in your environment variables
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  process.env.VAPID_MAILTO || 'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey,
  process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey
);

// Send push notification to a specific user
export const sendPushNotification = async (userId, notificationData) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return { success: false, message: 'No push subscriptions found' };
    }

    const results = [];
    
    for (const subscription of user.pushSubscriptions) {
      try {
        const payload = JSON.stringify({
          title: notificationData.title,
          body: notificationData.body,
          type: notificationData.type,
          fromUser: notificationData.fromUser,
          postId: notificationData.postId,
          createdAt: new Date().toISOString(),
          icon: notificationData.icon || '/icon.png',
          badge: notificationData.badge || '/badge.png',
          data: notificationData.data || {}
        });

        const result = await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          payload
        );

        results.push({ subscriptionId: subscription._id, success: true, result });
      } catch (error) {
        console.error('Push notification error for subscription:', subscription._id, error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await UserModel.updateOne(
            { _id: userId },
            { $pull: { pushSubscriptions: { _id: subscription._id } } }
          );
        }
        
        results.push({ subscriptionId: subscription._id, success: false, error: error.message });
      }
    }

    return {
      success: true,
      results,
      message: `Push notifications sent to ${user.pushSubscriptions.length} devices`
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple users
export const sendPushNotificationToUsers = async (userIds, notificationData) => {
  const results = [];
  
  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notificationData);
    results.push({ userId, result });
  }
  
  return results;
};

// Get VAPID public key for client
export const getVapidPublicKey = async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey;
  
  return res.status(200).json({
    status: "success",
    publicKey,
  });
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (req, res) => {
  const userId = req.user._id;
  const { endpoint, keys } = req.body;

  try {
    // Check if subscription already exists
    const existingSubscription = await UserModel.findOne({
      _id: userId,
      "pushSubscriptions.endpoint": endpoint,
    });

    if (existingSubscription) {
      return res.status(400).json({
        status: "failure",
        error: "Push subscription already exists for this endpoint",
      });
    }

    // Add new subscription
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          pushSubscriptions: {
            endpoint,
            keys,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return res.status(201).json({
      status: "success",
      message: "Successfully subscribed to push notifications",
      subscriptionCount: user.pushSubscriptions.length,
    });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return res.status(500).json({
      status: "failure",
      error: "Failed to subscribe to push notifications",
    });
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (req, res) => {
  const userId = req.user._id;
  const { endpoint } = req.query;

  try {
    let updateQuery;
    
    if (endpoint) {
      // Remove specific subscription
      updateQuery = {
        $pull: {
          pushSubscriptions: { endpoint },
        },
      };
    } else {
      // Remove all subscriptions
      updateQuery = {
        $set: { pushSubscriptions: [] },
      };
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      updateQuery,
      { new: true }
    );

    const message = endpoint
      ? "Successfully unsubscribed from push notifications"
      : "Successfully unsubscribed from all push notifications";

    return res.status(200).json({
      status: "success",
      message,
      subscriptionCount: user.pushSubscriptions.length,
    });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return res.status(500).json({
      status: "failure",
      error: "Failed to unsubscribe from push notifications",
    });
  }
}; 