import { MessageModel } from "../../../DB/Models/Message.model.js";

export const sendMessage = (io, socket) => {
  // Send & save message
  socket.on("sendMessage", async (payload, cb) => {
    try {
      const senderId = socket.user.id;
      const receiverId = payload?.receiverId;
      const content = (payload?.content || "").trim();

      if (!receiverId || !content) {
        cb?.({ ok: false, error: "invalid_payload" });
        return;
      }

      const doc = await MessageModel.create({
        sender: senderId,
        receiver: receiverId,
        content,
      });

      const message = {
        _id: doc._id.toString(),
        sender: senderId,
        receiver: receiverId,
        content: doc.content,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };

      // Ack to sender so client can mark "sent"
      cb?.({ ok: true, message });

      // Broadcast to both rooms (receiver & sender)
      io.to(receiverId).emit("message:new", message);
      io.to(senderId).emit("message:new", message);
    } catch (err) {
      console.error("sendMessage error:", err);
      cb?.({ ok: false, error: "server_error" });
    }
  });

  // Typing indicator relay
  socket.on("typing", ({ to, isTyping }) => {
    const from = socket.user.id;
    if (!to) return;
    io.to(to).emit("typing", { from, isTyping: !!isTyping, at: Date.now() });
  });

  // Delivery receipt (receiver -> sender)
  socket.on("message:delivered", ({ messageId, to }) => {
    if (!messageId || !to) return;
    io.to(to).emit("message:delivered", { messageId, at: Date.now() });
  });

  // Seen receipt (receiver -> sender) + persist read flag
  socket.on("message:seen", async ({ messageId, to }) => {
    if (!messageId || !to) return;
    try {
      await MessageModel.updateOne(
        { _id: messageId },
        { $set: { isRead: true, readAt: new Date() } }
      );
    } catch (e) {
      console.warn("failed to persist read flag:", e.message);
    }
    io.to(to).emit("message:seen", { messageId, at: Date.now() });
  });
};
