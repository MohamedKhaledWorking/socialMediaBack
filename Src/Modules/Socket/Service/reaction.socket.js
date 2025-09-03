// Service/reaction.socket.js
import mongoose from "mongoose";
import { ReactionModel } from "../../../DB/Models/Reaction.model.js";
import { PostModel } from "../../../DB/Models/Post.model.js";

const ALLOWED = ["like", "love", "haha", "wow", "sad", "angry"];
const room = (postId) => `post:${postId}`;

async function readCounts(postId, session = null) {
  const post = await PostModel.findById(postId, { reactions: 1, likesCount: 1 })
    .session(session)
    .lean();
  return {
    counts: post?.reactions || {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    },
    likesCount: post?.likesCount ?? 0,
  };
}

export function registerReactionIO(io, socket) {
  const userId = socket.user.id;

  socket.on("post:join", ({ postId }) => postId && socket.join(room(postId)));
  socket.on("post:leave", ({ postId }) => postId && socket.leave(room(postId)));

  // Upsert now also toggles OFF when the same kind is selected again
  socket.on("reaction:upsert", async ({ postId, type }, ack) => {
    try {
      if (!postId || !ALLOWED.includes(type)) {
        throw new Error("Invalid payload");
      }

      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const prev = await ReactionModel.findOne({
          post: postId,
          user: userId,
        }).session(session);

        if (!prev) {
          // create new reaction
          await ReactionModel.create(
            [{ post: postId, user: userId, kind: type }],
            { session }
          );
          await PostModel.updateOne(
            { _id: postId },
            { $inc: { [`reactions.${type}`]: 1, likesCount: 1 } },
            { session }
          );
        } else if (prev.kind !== type) {
          // switch kind
          const old = prev.kind;
          prev.kind = type;
          await prev.save({ session });
          await PostModel.updateOne(
            { _id: postId },
            { $inc: { [`reactions.${old}`]: -1, [`reactions.${type}`]: 1 } },
            { session }
          );
        } else {
          // same kind -> toggle OFF (remove)
          await ReactionModel.deleteOne({ _id: prev._id }).session(session);
          await PostModel.updateOne(
            { _id: postId },
            { $inc: { [`reactions.${type}`]: -1, likesCount: -1 } },
            { session }
          );
        }
      });
      session.endSession?.();

      const { counts, likesCount } = await readCounts(postId);

      // broadcast aggregate to others
      io.to(room(postId)).except(socket.id).emit("reaction:updated", {
        postId,
        counts,
        likesCount,
      });

      // ack to the actor; if toggled off, myReaction must be null
      const me = await ReactionModel.findOne({
        post: postId,
        user: userId,
      }).lean();
      ack?.({
        ok: true,
        postId,
        counts,
        likesCount,
        myReaction: me?.kind ?? null,
      });
    } catch (err) {
      ack?.({ ok: false, error: err?.message || "Failed to react" });
    }
  });

  socket.on("reaction:remove", async ({ postId }, ack) => {
    try {
      if (!postId) throw new Error("Invalid payload");

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
            { $inc: { [`reactions.${kind}`]: -1, likesCount: -1 } },
            { session }
          );
        }
      });
      session.endSession?.();

      const { counts, likesCount } = await readCounts(postId);

      io.to(room(postId)).except(socket.id).emit("reaction:updated", {
        postId,
        counts,
        likesCount,
      });

      ack?.({ ok: true, postId, counts, likesCount, myReaction: null });
    } catch (err) {
      ack?.({ ok: false, error: err?.message || "Failed to remove reaction" });
    }
  });
}
