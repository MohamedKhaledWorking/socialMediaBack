// Src/Socket/Service/comment.socket.service.js
import mongoose from "mongoose";
import { CommentModel } from "../../../DB/Models/Comment.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";
/* ------------------------ helpers ------------------------ */
function pickUser(u) {
  if (!u) return null;
  if (typeof u === "object") {
    return {
      _id: u._id,
      username: u.username,
      profileImage: u.profileImage, // could be {public_id,...} or string
    };
  }
  return { _id: u };
}

function toClientComment(doc) {
  const c = doc?.toObject ? doc.toObject() : doc;
  return {
    id: String(c._id),
    postId: String(c.post),
    user: pickUser(c.user),
    content: c.content,
    media: c.media || null,
    parentId: c.parentId ? String(c.parentId) : null,
    likesCount: c.likesCount || 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* ------------------------ main mount ------------------------ */
export function mountCommentSockets(io, socket) {
  const userId = socket?.user?.id;
  if (!userId) return;

  /* Optional: join/leave post rooms (safe if you already do this elsewhere) */
  socket.on("post:join", ({ postId } = {}) => {
    if (validId(postId)) socket.join(String(postId));
  });

  socket.on("post:leave", ({ postId } = {}) => {
    if (validId(postId)) socket.leave(String(postId));
  });

  /* ======================= READ (list) ======================= */
  // payload: { postId, page?, limit?, parentId? }
  socket.on("comment:list", async (payload = {}, ack = () => {}) => {
    try {
      const { postId, parentId = null, page = 1, limit = 20 } = payload || {};
      if (!validId(postId)) return ack({ ok: false, message: "Invalid postId" });

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter = { post: postId };
      if (parentId === null) {
        // root comments only
        filter.parentId = { $in: [null, undefined] };
      } else if (parentId) {
        if (!validId(parentId)) return ack({ ok: false, message: "Invalid parentId" });
        filter.parentId = parentId;
      }

      const [rows, total] = await Promise.all([
        CommentModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate("user", "username profileImage")
          .lean(),
        CommentModel.countDocuments(filter),
      ]);

      const comments = rows.map(toClientComment);

      return ack({
        ok: true,
        comments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          hasNext: skip + comments.length < total,
          hasPrev: pageNum > 1,
        },
      });
    } catch (err) {
      return ack({ ok: false, message: err?.message || "Failed to list comments" });
    }
  });

  /* ======================= CREATE ======================= */
  // payload: { postId, content, media?, parentId? }
  socket.on("comment:create", async (payload = {}, ack = () => {}) => {
    const { postId, content, media = "", parentId = null } = payload || {};
    try {
      if (!validId(postId)) return ack({ ok: false, message: "Invalid postId" });
      if (!content || String(content).trim().length === 0) {
        return ack({ ok: false, message: "Content is required" });
      }
      if (parentId && !validId(parentId)) {
        return ack({ ok: false, message: "Invalid parentId" });
      }

      const session = await mongoose.startSession();
      let created, postAfter;
      await session.withTransaction(async () => {
        const [doc] = await CommentModel.create(
          [
            {
              post: postId,
              user: userId,
              content: String(content).trim(),
              media: media || "",
              parentId: parentId || undefined,
            },
          ],
          { session }
        );

        created = await doc.populate("user", "username profileImage");

        // increment post.commentsCount atomically and return new value
        postAfter = await PostModel.findByIdAndUpdate(
          postId,
          { $inc: { commentsCount: 1 } },
          { new: true, session }
        ).lean();
      });
      session.endSession();

      const clientComment = toClientComment(created);
      const commentsCount = Number(postAfter?.commentsCount || 0);

      // ack to author
      ack({ ok: true, comment: clientComment, commentsCount });

      // broadcast to everyone in the post room
      io.to(String(postId)).emit("comment:added", {
        postId: String(postId),
        comment: clientComment,
        commentsCount,
      });
    } catch (err) {
      return ack({ ok: false, message: err?.message || "Failed to create comment" });
    }
  });

  /* ======================= UPDATE ======================= */
  // payload: { commentId, content?, media? }
  socket.on("comment:update", async (payload = {}, ack = () => {}) => {
    const { commentId, content, media } = payload || {};
    try {
      if (!validId(commentId)) return ack({ ok: false, message: "Invalid commentId" });

      const update = {};
      if (typeof content === "string") {
        const trimmed = content.trim();
        if (!trimmed) return ack({ ok: false, message: "Content cannot be empty" });
        update.content = trimmed;
      }
      if (typeof media === "string") update.media = media;

      const doc = await CommentModel.findOneAndUpdate(
        { _id: commentId, user: userId },  // only author can edit
        { $set: update },
        { new: true }
      )
        .populate("user", "username profileImage");

      if (!doc) return ack({ ok: false, message: "Comment not found or not allowed" });

      const clientComment = toClientComment(doc);
      ack({ ok: true, comment: clientComment });

      io.to(String(clientComment.postId)).emit("comment:updated", {
        postId: clientComment.postId,
        comment: clientComment,
      });
    } catch (err) {
      return ack({ ok: false, message: err?.message || "Failed to update comment" });
    }
  });

  /* ======================= DELETE ======================= */
  // payload: { commentId }
  socket.on("comment:delete", async (payload = {}, ack = () => {}) => {
    const { commentId } = payload || {};
    try {
      if (!validId(commentId)) return ack({ ok: false, message: "Invalid commentId" });

      const session = await mongoose.startSession();
      let doc, postAfter;
      await session.withTransaction(async () => {
        doc = await CommentModel.findOneAndDelete(
          { _id: commentId, user: userId }, // only author can delete
          { session }
        );
        if (!doc) return; // nothing to do

        // decrement commentsCount with floor 0
        postAfter = await PostModel.updateOne(
          { _id: doc.post },
          [
            {
              $set: {
                commentsCount: {
                  $max: [
                    { $subtract: [{ $ifNull: ["$commentsCount", 0] }, 1] },
                    0,
                  ],
                },
              },
            },
          ],
          { session }
        );
      });
      session.endSession();

      if (!doc) return ack({ ok: false, message: "Comment not found or not allowed" });

      // fetch the new commentsCount
      const post = await PostModel.findById(doc.post).select("commentsCount").lean();
      const commentsCount = Number(post?.commentsCount || 0);

      ack({
        ok: true,
        commentId: String(commentId),
        postId: String(doc.post),
        commentsCount,
      });

      io.to(String(doc.post)).emit("comment:deleted", {
        postId: String(doc.post),
        commentId: String(commentId),
        commentsCount,
      });
    } catch (err) {
      return ack({ ok: false, message: err?.message || "Failed to delete comment" });
    }
  });
}
