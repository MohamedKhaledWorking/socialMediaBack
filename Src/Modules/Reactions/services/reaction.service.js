import mongoose from "mongoose";
import { ReactionModel } from "../../../DB/Models/Reaction.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";

const ALLOWED = ["like", "love", "haha", "wow", "sad", "angry"];

export const upsertReaction = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  const { type } = req.body;

  // optional guard (you said you'll validate with Joi; keep this anyway)
  if (!ALLOWED.includes(type)) {
    return res.status(400).json({ status: "error", message: "Invalid reaction type" });
  }

  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    const prev = await ReactionModel.findOne({ post: postId, user: userId }).session(session);

    if (!prev) {
      await ReactionModel.create([{ post: postId, user: userId, kind: type }], { session });

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
    // same kind → no-op
  });
  session.endSession();

  const [reaction, post] = await Promise.all([
    ReactionModel.findOne({ post: postId, user: userId }).lean(),
    PostModel.findById(postId).lean(),
  ]);
  return res.status(200).json({
    status: "success",
    message: "Reaction updated successfully",
    reaction,
    post,
  });
};
export const removeReaction = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;
  
    const session = await mongoose.startSession();
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
            {
              $set: {
                [`reactions.${kind}`]: {
                  $max: [
                    {
                      $subtract: [
                        { $ifNull: [`$reactions.${kind}`, 0] },
                        1
                      ]
                    },
                    0
                  ]
                }
              }
            },
            // 2) Recompute likesCount as sum of all buckets (use $ifNull for each)
            {
              $set: {
                likesCount: {
                  $add: [
                    { $ifNull: ["$reactions.like", 0] },
                    { $ifNull: ["$reactions.love", 0] },
                    { $ifNull: ["$reactions.haha", 0] },
                    { $ifNull: ["$reactions.wow", 0] },
                    { $ifNull: ["$reactions.sad", 0] },
                    { $ifNull: ["$reactions.angry", 0] }
                  ]
                }
              }
            }
          ],
          { session }
        );
      }
      // if no doc, do nothing (no decrements)
    });
    session.endSession();
  
    const post = await PostModel.findById(postId).lean();
    return res.status(200).json({
      status: "success",
      message: "Reaction removed",
      post,
    });
  };
  