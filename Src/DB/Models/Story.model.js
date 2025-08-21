import mongoose, { Schema } from "mongoose";

const StorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    thumbnail: { type: String, required: true },
    media: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    caption: { type: String },
    link: { type: String },
    viewsCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const StoryModel =
  mongoose.models.Story || mongoose.model("Story", StorySchema);
