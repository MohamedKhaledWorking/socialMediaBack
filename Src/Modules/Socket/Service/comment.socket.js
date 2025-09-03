import {
  createComment,
  deleteComment,
  listComments,
} from "../../Comment/services/comment.service.js";

const room = (postId) => `post:${postId}`;

export function registerCommentSocket(io, socket) {
  // Add
  socket.on("comment:add", async (payload, ack) => {
    try {
      const { postId, content, media } = payload || {};
      if (!postId || !content?.trim())
        return ack?.({ ok: false, message: "postId and content are required" });

      const userId = socket.user.id;
      const { comment, commentsCount } = await createComment({
        postId,
        userId,
        content: content.trim(),
        media,
      });

      io.to(room(postId)).emit("comment:created", {
        postId,
        comment,
        commentsCount,
      });
      ack?.({ ok: true, comment, commentsCount });
    } catch (err) {
      ack?.({ ok: false, message: err?.message || "Failed to add comment" });
    }
  });

  // Delete
  socket.on("comment:delete", async (payload, ack) => {
    try {
      const { commentId } = payload || {};
      if (!commentId)
        return ack?.({ ok: false, message: "commentId is required" });

      const userId = socket.user.id;
      const result = await deleteComment({ commentId, userId });
      if (!result.ok) return ack?.({ ok: false, message: "Comment not found" });

      io.to(room(result.postId)).emit("comment:deleted", {
        postId: result.postId,
        commentId,
        commentsCount: result.commentsCount,
      });

      ack?.({
        ok: true,
        postId: result.postId,
        commentsCount: result.commentsCount,
      });
    } catch (err) {
      ack?.({ ok: false, message: err?.message || "Failed to delete comment" });
    }
  });

  // List (paginated)
  socket.on("comment:list", async (payload, ack) => {
    try {
      const { postId, page = 1, limit = 20 } = payload || {};
      if (!postId) return ack?.({ ok: false, message: "postId is required" });

      const data = await listComments({ postId, page, limit });
      ack?.({ ok: true, ...data });
    } catch (err) {
      ack?.({ ok: false, message: err?.message || "Failed to fetch comments" });
    }
  });
}
