import mongoose, { mongo, Schema } from "mongoose";
const PostSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String },
    content: { type: String },
    mood: { type: String },
    media: [{ url: String, public_id: String }],
    tags: [{ type: String }],
    privacy: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
    sharedPostId: { type: Schema.Types.ObjectId, ref: "Post" },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharedCount: { type: Number, default: 0 },
    reactions: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      haha: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

PostSchema.index({ content: "text", tags: "text" });



export const PostModel =
  mongoose.models.Post || mongoose.model("Post", PostSchema);
