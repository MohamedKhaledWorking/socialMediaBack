import mongoose, { Schema } from "mongoose";

export const REACTION_KINDS = ["like", "love", "haha", "wow", "sad", "angry"]; // ← match UI

const ReactionSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: REACTION_KINDS, required: true },
  },
  { timestamps: true }
);

ReactionSchema.index({ post: 1, user: 1 }, { unique: true });
ReactionSchema.index({ post: 1, kind: 1 });

export const ReactionModel =
  mongoose.models.Reaction || mongoose.model("Reaction", ReactionSchema);
