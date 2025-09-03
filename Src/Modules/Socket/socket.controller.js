import { Server } from "socket.io";
import verifySocketToken from "../../Middleware/socket/verifySocketToken.js";
import { registerSocket, unregisterSocket } from "./Service/socket.service.js";
import { sendMessage } from "./Service/message.service.js";
import { registerCommentSocket } from "./Service/comment.socket.js";
// import { registerReactionSocket } from "./Service/reaction.socket.js"; // if you split reactions

export const runIO = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });
  io.use(verifySocketToken);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    socket.join(userId);
    await registerSocket(userId, socket.id);

    // let clients join per-post rooms
    socket.on(
      "post:join",
      ({ postId }) => postId && socket.join(`post:${postId}`)
    );
    socket.on(
      "post:leave",
      ({ postId }) => postId && socket.leave(`post:${postId}`)
    );

    // existing message handler
    sendMessage(io, socket);

    // NEW: comments + reactions
    registerCommentSocket(io, socket);
    // registerReactionSocket(io, socket); // (your existing reaction code if you split it)

    socket.on("disconnect", async () => {
      await unregisterSocket(userId);
    });
  });

  return io;
};
