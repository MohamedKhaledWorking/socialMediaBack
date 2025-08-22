import { MessageModel } from "../../../DB/Models/Message.model.js";
import { UserModel } from "../../../DB/Models/User.model.js";
import { createNotification } from "../../Notification/Services/notification.service.js";

export const initializeMessageHandlers = (io, socket, checkRateLimit) => {
  // Handle direct message sending via socket
  socket.on("send_message", async (data) => {
    if (!checkRateLimit(socket, "send_message", 10, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for messages" });
    }

    try {
      const { receiverId, message } = data;

      // Validate input
      if (!receiverId || !message || message.trim().length === 0) {
        return socket.emit("error", { message: "Invalid message data" });
      }

      // Prevent self-messaging
      if (receiverId === socket.userId) {
        return socket.emit("error", { message: "You cannot send a message to yourself" });
      }

      // Check if receiver exists
      const receiver = await UserModel.findById(receiverId);
      if (!receiver) {
        return socket.emit("error", { message: "Receiver not found" });
      }

      // Create and save the message
      const newMessage = await MessageModel.create({
        sender: socket.userId,
        receiver: receiverId,
        message: message.trim(),
      });

      // Populate sender and receiver details
      await newMessage.populate([
        { path: "sender", select: "username profileImage" },
        { path: "receiver", select: "username profileImage" },
      ]);

      // Emit to sender (confirmation)
      socket.emit("message_sent", {
        status: "success",
        message: newMessage,
      });

      // Emit to receiver if online
      io.to(`user_${receiverId}`).emit("receive_message", {
        type: "new_message",
        message: newMessage,
        sender: {
          _id: socket.userId,
          username: socket.user.username,
          profileImage: socket.user.profileImage,
        },
      });

      // Create notification for receiver
      await createNotification({
        userId: receiverId,
        type: "new_message",
        fromUser: socket.userId,
        message: `${socket.user.username} sent you a message`,
        metadata: { messageId: newMessage._id },
      });

    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle message read confirmation
  socket.on("message_read", async (data) => {
    if (!checkRateLimit(socket, "message_read", 20, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for read confirmations" });
    }
  
    try {
      const { messageId } = data;

      if (!messageId) {
        return socket.emit("error", { message: "Message ID is required" });
      }

      // Find and update the message
      const message = await MessageModel.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      // Check if current user is the receiver
      if (message.receiver.toString() !== socket.userId) {
        return socket.emit("error", { message: "You can only mark messages sent to you as read" });
      }

      // Update message as read
      message.isRead = true;
      await message.save();

      // Notify sender that message was read
      io.to(`user_${message.sender}`).emit("message_read_confirmation", {
        messageId: messageId,
        readBy: socket.userId,
        readAt: new Date(),
      });

    } catch (error) {
      console.error("Socket message read error:", error);
      socket.emit("error", { message: "Failed to mark message as read" });
    }
  });

  // Handle message deletion
  socket.on("delete_message", async (data) => {
    if (!checkRateLimit(socket, "delete_message", 5, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for message deletion" });
    }

    try {
      const { messageId } = data;

      if (!messageId) {
        return socket.emit("error", { message: "Message ID is required" });
      }

      // Find the message
      const message = await MessageModel.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      // Check if current user is the sender
      if (message.sender.toString() !== socket.userId) {
        return socket.emit("error", { message: "You can only delete your own messages" });
      }

      // Delete the message
      await MessageModel.findByIdAndDelete(messageId);

      // Notify receiver that message was deleted
      io.to(`user_${message.receiver}`).emit("message_deleted", {
        messageId: messageId,
        deletedBy: socket.userId,
      });

      // Confirm deletion to sender
      socket.emit("message_deleted_confirmation", {
        messageId: messageId,
        status: "success",
      });

    } catch (error) {
      console.error("Socket message deletion error:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });
}; 