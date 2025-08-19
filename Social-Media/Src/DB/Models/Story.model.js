import mongoose, { Schema } from "mongoose";

const StorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    media: { type: String, required: true },
    caption: { type: String },
    backgroundColor: { type: String },
    link: { type: String },
    viewsCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const StoryModel = mongoose.models.Story || mongoose.model("Story", StorySchema);