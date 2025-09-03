import mongoose from "mongoose";
import { CommentModel } from "../../../DB/Models/Comment.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";

export async function createComment({ postId, userId, content, media }) {
  const session = await mongoose.startSession();
  let comment;
  await session.withTransaction(async () => {
    // ensure post exists
    const post = await PostModel.findById(postId).session(session);
    if (!post) throw new Error("Post not found");

    // create comment
    [comment] = await CommentModel.create(
      [{ post: postId, user: userId, content, media }],
      { session }
    );

    // increment commentsCount on the Post
    await PostModel.updateOne(
      { _id: postId },
      { $inc: { commentsCount: 1 } },
      { session }
    );
  });
  session.endSession();

  // return hydrated comment for UI
  const hydrated = await CommentModel.findById(comment._id)
    .populate("user", "username profileImage")
    .lean();

  // also return the updated count
  const freshPost = await PostModel.findById(postId)
    .select("commentsCount")
    .lean();

  return { comment: hydrated, commentsCount: freshPost?.commentsCount ?? 0 };
}

export async function deleteComment({ commentId, userId }) {
  const session = await mongoose.startSession();
  let postId = null;
  let ok = false;

  await session.withTransaction(async () => {
    const doc = await CommentModel.findOneAndDelete(
      { _id: commentId, user: userId },
      { session }
    );

    if (!doc) return; // nothing to delete

    postId = String(doc.post);

    // decrement but never drop below 0
    await PostModel.updateOne(
      { _id: postId },
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
    ok = true;
  });

  session.endSession();

  if (!ok) return { ok: false };
  const fresh = await PostModel.findById(postId).select("commentsCount").lean();
  return { ok: true, postId, commentsCount: fresh?.commentsCount ?? 0 };
}

export async function listComments({ postId, page = 1, limit = 20 }) {
  const skip = (Math.max(1, +page) - 1) * Math.max(1, +limit);
  const [rows, total] = await Promise.all([
    CommentModel.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.max(1, +limit))
      .populate("user", "username profileImage")
      .lean(),
    CommentModel.countDocuments({ post: postId }),
  ]);

  return {
    comments: rows,
    pagination: {
      currentPage: +page,
      totalPages: Math.ceil(total / Math.max(1, +limit)),
      totalComments: total,
    },
  };
}
