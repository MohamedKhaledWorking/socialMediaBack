import mongoose, { Schema } from "mongoose";

const CommentSchema = new Schema(
  {
    post:      { type: Schema.Types.ObjectId, ref: "Post", required: true },
    user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    content:   { type: String, required: true },
    media:     { type: String },
    parentId:  { type: Schema.Types.ObjectId, ref: "Comment" },
    likesCount:{ type: Number, default: 0 },
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true }, 
        reactedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const CommentModel =
  mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
