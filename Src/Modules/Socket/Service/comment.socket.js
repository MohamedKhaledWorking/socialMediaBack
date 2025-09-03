import { createComment, deleteComment, listComments }from "../../Comment/services/comment.service.js";

export function registerCommentSocket(io, socket) {
  // Add a comment
  socket.on("comment:add", async (payload, ack) => {
    try {
      const { postId, content, media } = payload || {};
      if (!postId || !content?.trim()) {
        return ack?.({ ok: false, message: "postId and content are required" });
      }
      const userId = socket.user.id; // set by verifySocketToken
      const { comment, commentsCount } = await createComment({
        postId,
        userId,
        content: content.trim(),
        media,
      });

      // notify all watchers of this post
      io.to(`post:${postId}`).emit("comment:created", { postId, comment, commentsCount });

      return ack?.({ ok: true, comment, commentsCount });
    } catch (err) {
      return ack?.({ ok: false, message: err?.message || "Failed to add comment" });
    }
  });

  // Delete a comment (author only)
  socket.on("comment:delete", async (payload, ack) => {
    try {
      const { commentId } = payload || {};
      if (!commentId) return ack?.({ ok: false, message: "commentId is required" });

      const userId = socket.user.id;
      const result = await deleteComment({ commentId, userId });
      if (!result.ok) return ack?.({ ok: false, message: "Comment not found" });

      io.to(`post:${result.postId}`).emit("comment:deleted", {
        postId: result.postId,
        commentId,
        commentsCount: result.commentsCount,
      });

      return ack?.({ ok: true, postId: result.postId, commentsCount: result.commentsCount });
    } catch (err) {
      return ack?.({ ok: false, message: err?.message || "Failed to delete comment" });
    }
  });

  // Paginated fetch over socket (optional)
  socket.on("comment:list", async (payload, ack) => {
    try {
      const { postId, page = 1, limit = 20 } = payload || {};
      if (!postId) return ack?.({ ok: false, message: "postId is required" });
      const data = await listComments({ postId, page, limit });
      return ack?.({ ok: true, ...data });
    } catch (err) {
      return ack?.({ ok: false, message: err?.message || "Failed to fetch comments" });
    }
  });
}
