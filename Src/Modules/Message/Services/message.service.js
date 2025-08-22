import { MessageModel } from "../../../DB/Models/Message.model.js";
import { UserModel } from "../../../DB/Models/User.model.js";
import { createNotification } from "../../Notification/Services/notification.service.js";

// Socket.IO instance (will be set from app.controller.js)
let io = null;

// Function to set Socket.IO instance
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send a private message
export const sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user._id;

  // Prevent self-messaging
  if (senderId.toString() === receiverId) {
    return res.status(400).json({
      status: "failure",
      error: "You cannot send a message to yourself",
    });
  }

  // Check if receiver exists
  const receiver = await UserModel.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({
      status: "failure",
      error: "Receiver not found",
    });
  }

  // Create the message
  const newMessage = await MessageModel.create({
    sender: senderId,
    receiver: receiverId,
    message,
  });

  await newMessage.populate([
    { path: "sender", select: "username profileImage" },
    { path: "receiver", select: "username profileImage" },
  ]);

  // Create notification for receiver
  await createNotification({
    userId: receiverId,
    type: "new_message",
    fromUser: senderId,
    message: `${req.user.username} sent you a message`,
    metadata: { messageId: newMessage._id },
  });

  // Emit real-time event if Socket.IO is available
  if (io) {
    io.to(`user_${receiverId}`).emit("receive_message", {
      type: "new_message",
      message: newMessage,
      sender: {
        _id: senderId,
        username: req.user.username,
        profileImage: req.user.profileImage,
      },
    });
  }

  return res.status(201).json({
    status: "success",
    message: "Message sent successfully",
    data: newMessage,
  });
};

// Get chat history between two users
export const getChatHistory = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;
  const { page = 1, limit = 50, markAsSeen = "true" } = req.query;
  const skip = (page - 1) * limit;

  // Check if other user exists
  const otherUser = await UserModel.findById(userId);
  if (!otherUser) {
    return res.status(404).json({
      status: "failure",
      error: "User not found",
    });
  }

  // Get messages between the two users
  const messages = await MessageModel.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  })
    .populate("sender", "username profileImage")
    .populate("receiver", "username profileImage")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: 1 });

  const total = await MessageModel.countDocuments({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  });

  // Mark messages as seen and read if requested
  if (markAsSeen === "true") {
    const unreadMessages = messages.filter(
      msg => msg.receiver.toString() === currentUserId.toString() && !msg.isRead
    );

    for (const message of unreadMessages) {
      // Add current user to seenBy if not already there
      const alreadySeen = message.seenBy.some(seen => seen.userId.toString() === currentUserId.toString());
      
      if (!alreadySeen) {
        message.seenBy.push({
          userId: currentUserId,
          seenAt: new Date()
        });
      }
      
      message.isRead = true;
      await message.save();

      // Emit real-time event to sender if Socket.IO is available
      if (io) {
        io.to(`user_${message.sender}`).emit("message_seen", {
          messageId: message._id,
          seenBy: currentUserId,
          seenAt: new Date(),
          isRead: true,
        });
      }
    }
  }

  return res.status(200).json({
    status: "success",
    messages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalMessages: total,
      hasNext: skip + messages.length < total,
      hasPrev: page > 1,
    },
  });
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Get unique conversations (users with whom current user has exchanged messages)
  const conversations = await MessageModel.aggregate([
    {
      $match: {
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId },
        ],
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", currentUserId] },
            "$receiver",
            "$sender",
          ],
        },
        lastMessage: { $last: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", currentUserId] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ]);

  // Populate user details and format response
  const populatedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const user = await UserModel.findById(conv._id).select("username profileImage");
      return {
        user,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount,
      };
    })
  );

  const total = await MessageModel.distinct("sender", {
    $or: [
      { sender: currentUserId },
      { receiver: currentUserId },
    ],
  }).then(async (senders) => {
    const receivers = await MessageModel.distinct("receiver", {
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId },
      ],
    });
    return new Set([...senders, ...receivers]).size;
  });

  return res.status(200).json({
    status: "success",
    conversations: populatedConversations,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalConversations: total,
      hasNext: skip + populatedConversations.length < total,
      hasPrev: page > 1,
    },
  });
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  const message = await MessageModel.findById(messageId);

  if (!message) {
    return res.status(404).json({
      status: "failure",
      error: "Message not found",
    });
  }

  // Check if current user is the receiver
  if (message.receiver.toString() !== currentUserId.toString()) {
    return res.status(403).json({
      status: "failure",
      error: "You can only mark messages sent to you as read",
    });
  }

  message.isRead = true;
  await message.save();

  // Emit real-time event if Socket.IO is available
  if (io) {
    io.to(`user_${message.sender}`).emit("message_read_confirmation", {
      messageId: messageId,
      readBy: currentUserId,
      readAt: new Date(),
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Message marked as read",
  });
};

// Delete a message
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  const message = await MessageModel.findById(messageId);

  if (!message) {
    return res.status(404).json({
      status: "failure",
      error: "Message not found",
    });
  }

  // Check if current user is the sender
  if (message.sender.toString() !== currentUserId.toString()) {
    return res.status(403).json({
      status: "failure",
      error: "You can only delete your own messages",
    });
  }

  await MessageModel.findByIdAndDelete(messageId);

  return res.status(200).json({
    status: "success",
    message: "Message deleted successfully",
  });
};

// Mark a specific message as seen
export const markMessageAsSeen = async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  const message = await MessageModel.findById(messageId);

  if (!message) {
    return res.status(404).json({
      status: "failure",
      error: "Message not found",
    });
  }

  // Check if current user is a participant in the conversation
  if (message.sender.toString() !== currentUserId.toString() && 
      message.receiver.toString() !== currentUserId.toString()) {
    return res.status(403).json({
      status: "failure",
      error: "You can only mark messages in your conversations as seen",
    });
  }

  // Check if already seen by this user
  const alreadySeen = message.seenBy.some(seen => seen.userId.toString() === currentUserId.toString());
  
  if (!alreadySeen) {
    // Add user to seenBy array
    message.seenBy.push({
      userId: currentUserId,
      seenAt: new Date()
    });
    
    // Update isRead if receiver is marking as seen
    if (message.receiver.toString() === currentUserId.toString()) {
      message.isRead = true;
    }
    
    await message.save();

    // Emit real-time event to sender if Socket.IO is available
    if (io) {
      io.to(`user_${message.sender}`).emit("message_seen", {
        messageId: messageId,
        seenBy: currentUserId,
        seenAt: new Date(),
        isRead: message.isRead,
      });
    }
  }

  return res.status(200).json({
    status: "success",
    message: "Message marked as seen",
    seenBy: message.seenBy,
    isRead: message.isRead,
  });
};

// Mark all messages in a conversation as seen
export const markConversationAsSeen = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  // Check if other user exists
  const otherUser = await UserModel.findById(userId);
  if (!otherUser) {
    return res.status(404).json({
      status: "failure",
      error: "User not found",
    });
  }

  // Find all unread messages from the other user to current user
  const unreadMessages = await MessageModel.find({
    sender: userId,
    receiver: currentUserId,
    isRead: false,
  });

  if (unreadMessages.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No unread messages to mark as seen",
      updatedCount: 0,
    });
  }

  // Mark all messages as seen and read
  const updatePromises = unreadMessages.map(async (message) => {
    // Add current user to seenBy if not already there
    const alreadySeen = message.seenBy.some(seen => seen.userId.toString() === currentUserId.toString());
    
    if (!alreadySeen) {
      message.seenBy.push({
        userId: currentUserId,
        seenAt: new Date()
      });
    }
    
    message.isRead = true;
    return message.save();
  });

  await Promise.all(updatePromises);

  // Emit real-time events to senders if Socket.IO is available
  if (io) {
    for (const message of unreadMessages) {
      io.to(`user_${message.sender}`).emit("message_seen", {
        messageId: message._id,
        seenBy: currentUserId,
        seenAt: new Date(),
        isRead: true,
      });
    }
  }

  return res.status(200).json({
    status: "success",
    message: "All messages marked as seen",
    updatedCount: unreadMessages.length,
  });
}; 