// Src/Socket/runIO.js
import { Server } from "socket.io";
import verifySocketToken from "../../Middleware/socket/verifySocketToken.js";
import { registerSocket, unregisterSocket } from "./Service/socket.service.js";
import { sendMessage } from "./Service/message.service.js";
import { registerReactionIO } from "./Service/reaction.socket.js";

export const runIO = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });

  // Attach JWT to socket.user
  io.use(verifySocketToken);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    // Join a personal room so we can target this user by their id
    socket.join(userId);

    // optionally keep socket mapping (your service)
    await registerSocket(userId, socket.id);

    // Let client know socket is ready (optional)
    socket.emit("socket:ready", { userId, socketId: socket.id });

    // Register message handler (pass io so we can emit to rooms)
    sendMessage(io, socket);
    registerReactionIO(io, socket);

    socket.on("disconnect", async () => {
      await unregisterSocket(userId);
    });
  });

  return io;
};
