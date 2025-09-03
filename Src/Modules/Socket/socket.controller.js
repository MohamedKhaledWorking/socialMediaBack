// Modules/Socket/index.js
import { Server } from "socket.io";
import verifySocketToken from "../../Middleware/socket/verifySocketToken.js";
import { registerSocket, unregisterSocket } from "./Service/socket.service.js";
import { sendMessage } from "./Service/message.service.js";
import { registerCommentSocket } from "./Service/comment.socket.js";
import { registerReactionIO as registerReactionSocket } from "./Service/reaction.socket.js"; // 👈 match the exported name

export const runIO = (server) => {
  const io = new Server(server, { cors: { origin: "*" }, transports: ["websocket"] });
  io.use(verifySocketToken);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    // keep DM rooms, etc.
    socket.join(userId);
    await registerSocket(userId, socket.id);

    // centralize post room join/leave here so every module benefits
    socket.on("post:join", ({ postId }) => postId && socket.join(`post:${postId}`));
    socket.on("post:leave", ({ postId }) => postId && socket.leave(`post:${postId}`));

    // sockets
    sendMessage(io, socket);           // ✅ your messages stay intact
    registerReactionSocket(io, socket); // ✅ reactions live
    registerCommentSocket(io, socket);  // ✅ comments live

    socket.on("disconnect", async () => {
      await unregisterSocket(userId);
    });
  });

  return io;
};
