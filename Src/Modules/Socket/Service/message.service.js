import { MessageModel } from "../../../DB/Models/Message.model.js";

export const sendMessage = (io, socket) => {
  socket.on("sendMessage", async (payload, cb) => {
    try {
      const senderId = socket.user.id;
      const receiverId = payload?.receiverId;
      const content = (payload?.content || "").trim();

      if (!receiverId || !content) {
        cb?.({ ok: false, error: "invalid_payload" });
        return;
      }

      // Save message
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

      // ✅ ACK back to the emitter (so the client can resolve the optimistic bubble)
      cb?.({ ok: true, message });

      // Broadcast to both users’ rooms (they must join their own userId room on connect)
      io.to(receiverId).emit("message:new", message);
      io.to(senderId).emit("message:new", message);
    } catch (err) {
      console.error("sendMessage error:", err);
      cb?.({ ok: false, error: "server_error" });
    }
  });
};
