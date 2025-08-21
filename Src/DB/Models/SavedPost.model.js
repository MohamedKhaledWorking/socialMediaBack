import mongoose, { Schema } from "mongoose";

const SavedPostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
}, { timestamps: true });

// Compound index to prevent duplicate saves
SavedPostSchema.index({ user: 1, post: 1 }, { unique: true });

export const SavedPostModel = mongoose.models.SavedPost || mongoose.model("SavedPost", SavedPostSchema); 