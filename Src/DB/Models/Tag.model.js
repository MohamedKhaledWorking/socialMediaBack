import mongoose, { Schema } from "mongoose";

const TagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    usageCount: { type: Number, default: 0 },
    description: { type: String },
    isTrending: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },  
  },
  { timestamps: true }
);

export const TagModel = mongoose.models.Tag || mongoose.model("Tag", TagSchema);
