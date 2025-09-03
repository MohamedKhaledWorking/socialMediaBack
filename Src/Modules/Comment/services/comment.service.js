// Modules/Comment/services/comment.service.js
import mongoose from "mongoose";
import { CommentModel } from "../../../DB/Models/Comment.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";

export async function createComment({ postId, userId, content, media, parentId }) {
  const session = await mongoose.startSession();
  let comment, commentsCount;

  await session.withTransaction(async () => {
    // ensure post exists
    const post = await PostModel.findById(postId).session(session);
    if (!post) throw new Error("Post not found");

    [comment] = await CommentModel.create(
      [{ post: postId, user: userId, content, media, parentId }],
      { session }
    );

    const updated = await PostModel.findByIdAndUpdate(
      postId,
      { $inc: { commentsCount: 1 } },
      { new: true, session, select: "commentsCount" }
    );
    commentsCount = updated?.commentsCount || 0;
  });

  session.endSession?.();
  // minimal projection for client
  const safe = await CommentModel.findById(comment._id)
    .populate("user", "username profileImage")
    .lean();

  return { comment: safe, commentsCount };
}

export async function deleteComment({ commentId, userId }) {
  const session = await mongoose.startSession();
  let postId, commentsCount, ok = false;

  await session.withTransaction(async () => {
    const doc = await CommentModel.findOne({ _id: commentId, user: userId })
      .session(session);
    if (!doc) return;

    postId = String(doc.post);
    await doc.deleteOne({ session });
    const updated = await PostModel.findByIdAndUpdate(
      postId,
      { $inc: { commentsCount: -1 } },
      { new: true, session, select: "commentsCount" }
    );
    commentsCount = updated?.commentsCount || 0;
    ok = true;
  });

  session.endSession?.();
  return { ok, postId, commentsCount };
}

export async function listComments({ postId, page = 1, limit = 20 }) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  const skip = (p - 1) * l;

  const [rows, total] = await Promise.all([
    CommentModel.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate("user", "username profileImage")
      .lean(),
    CommentModel.countDocuments({ post: postId }),
  ]);

  return {
    comments: rows,
    pagination: {
      currentPage: p,
      totalPages: Math.ceil(total / l),
      totalComments: total,
      hasNext: skip + rows.length < total,
      hasPrev: p > 1,
    },
  };
}
