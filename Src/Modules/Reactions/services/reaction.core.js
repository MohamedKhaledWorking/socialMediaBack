import mongoose from "mongoose";
import { ReactionModel } from "../../../DB/Models/Reaction.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";
import { REACTION_KINDS } from "../../../Constant/constants.js";

function ensureAllowed(kind) {
  if (!REACTION_KINDS.includes(kind)) {
    const list = REACTION_KINDS.join(", ");
    const err = new Error(`Invalid reaction type. Allowed: ${list}`);
    err.status = 400;
    throw err;
  }
}

/** Upsert/change a reaction, increment/decrement counters accordingly. */
export async function applyReaction({ userId, postId, type }) {
  ensureAllowed(type);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const prev = await ReactionModel.findOne({ post: postId, user: userId }).session(session);

      if (!prev) {
        await ReactionModel.create(
          [{ post: postId, user: userId, kind: type }],
          { session }
        );
        // first time reacting -> likesCount +1
        await PostModel.updateOne(
          { _id: postId },
          { $inc: { [`reactions.${type}`]: 1, likesCount: 1 } },
          { session }
        );
      } else if (prev.kind !== type) {
        const old = prev.kind;
        prev.kind = type;
        await prev.save({ session });

        await PostModel.updateOne(
          { _id: postId },
          { $inc: { [`reactions.${old}`]: -1, [`reactions.${type}`]: 1 } },
          { session }
        );
        // likesCount unchanged on kind switch
      }
      // same kind -> no-op
    });
  } finally {
    session.endSession();
  }

  const [reaction, post] = await Promise.all([
    ReactionModel.findOne({ post: postId, user: userId }).lean(),
    PostModel.findById(postId).lean(),
  ]);

  return { reaction, post };
}

/** Remove a reaction, decrement bucket & recompute likesCount. */
export async function clearReaction({ userId, postId }) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const doc = await ReactionModel.findOneAndDelete(
        { post: postId, user: userId },
        { session }
      );

      if (doc) {
        const kind = doc.kind;

        await PostModel.updateOne(
          { _id: postId },
          [
            // decrement bucket (clamped at 0)
            {
              $set: {
                [`reactions.${kind}`]: {
                  $max: [
                    { $subtract: [{ $ifNull: [`$reactions.${kind}`, 0] }, 1] },
                    0,
                  ],
                },
              },
            },
            // recompute likesCount as sum of all buckets
            {
              $set: {
                likesCount: {
                  $add: [
                    { $ifNull: ["$reactions.like", 0] },
                    { $ifNull: ["$reactions.love", 0] },
                    { $ifNull: ["$reactions.haha", 0] },
                    { $ifNull: ["$reactions.wow", 0] },
                    { $ifNull: ["$reactions.sad", 0] },
                    { $ifNull: ["$reactions.angry", 0] },
                  ],
                },
              },
            },
          ],
          { session }
        );
      }
    });
  } finally {
    session.endSession();
  }

  const post = await PostModel.findById(postId).lean();
  return { post };
}
