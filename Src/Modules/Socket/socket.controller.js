import { Server } from "socket.io";
import verifySocketToken from "../../Middleware/socket/verifySocketToken.js";
import { registerSocket, unregisterSocket } from "./Service/socket.service.js";
import { sendMessage } from "./Service/message.service.js";
import { registerCommentSocket } from "./Service/comment.socket.js";
import { registerReactionIO } from "./Service/reaction.socket.js";

export const runIO = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });
  io.use(verifySocketToken);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    socket.join(userId);
    await registerSocket(userId, socket.id);

    socket.on(
      "post:join",
      ({ postId }) => postId && socket.join(`post:${postId}`)
    );
    socket.on(
      "post:leave",
      ({ postId }) => postId && socket.leave(`post:${postId}`)
    );

    // existing
    sendMessage(io, socket);

    // new
    registerCommentSocket(io, socket);
    registerReactionIO(io, socket);

    socket.on("disconnect", async () => {
      await unregisterSocket(userId);
    });
  });

  return io;
};
