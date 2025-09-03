import mongoose from "mongoose";
import { CommentModel } from "../../../DB/Models/Comment.model.js";

export async function createComment({ postId, userId, content, media }) {
  const session = await mongoose.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      created = await CommentModel.create([{ post: postId, user: userId, content, media }], { session });
      await PostModel.updateOne(
        { _id: postId },
        { $inc: { commentsCount: 1 } },
        { session }
      );
    });
  } finally {
    session.endSession?.();
  }

  // populate user
  const comment = await CommentModel.findById(created[0]._id)
    .populate("user", "username profileImage")
    .lean();

  const post = await PostModel.findById(postId, { commentsCount: 1 }).lean();
  const commentsCount = post?.commentsCount ?? 0;

  return { comment, commentsCount };
}

export async function deleteComment({ commentId, userId }) {
  const session = await mongoose.startSession();
  let postId = null;
  let ok = false;

  try {
    await session.withTransaction(async () => {
      const doc = await CommentModel.findOne({ _id: commentId, user: userId }).session(session);
      if (!doc) return;

      postId = doc.post;
      await CommentModel.deleteOne({ _id: doc._id }).session(session);

      await PostModel.updateOne(
        { _id: postId },
        {
          $set: {
            commentsCount: {
              $max: [
                {
                  $subtract: [{ $ifNull: ["$commentsCount", 0] }, 1],
                },
                0,
              ],
            },
          },
        },
        { session }
      );
      ok = true;
    });
  } finally {
    session.endSession?.();
  }

  if (!ok || !postId) return { ok: false };
  const post = await PostModel.findById(postId, { commentsCount: 1 }).lean();
  return { ok: true, postId: String(postId), commentsCount: post?.commentsCount ?? 0 };
}

export async function listComments({ postId, page = 1, limit = 20 }) {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    CommentModel.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("user", "username profileImage")
      .lean(),
    CommentModel.countDocuments({ post: postId }),
  ]);

  // normalize id
  const comments = items.map((c) => ({ ...c, id: String(c._id) }));

  return {
    comments,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      hasNext: skip + items.length < total,
      hasPrev: pageNum > 1,
    },
  };
}
